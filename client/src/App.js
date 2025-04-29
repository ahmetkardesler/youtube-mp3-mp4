import React, { useState } from "react";
import { Container } from "react-bootstrap";
import ConverterForm from "./components/ConverterForm";
import VideoInfo from "./components/VideoInfo";
import axios from "axios";
import { toast } from "react-toastify";

const App = () => {
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const validateYouTubeUrl = async (url) => {
    setLoading(true);
    setVideoInfo(null);
    setYoutubeUrl(url);

    try {
      const response = await axios.get(
        `/api/validate?url=${encodeURIComponent(url)}`
      );
      if (response.data.valid) {
        setVideoInfo(response.data.videoDetails);
      } else {
        toast.error(response.data.error || "Invalid YouTube URL");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Error validating URL. Please check the server connection."
      );
      console.error("Error validating URL:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format) => {
    setDownloadLoading(true);
    console.log(
      `Requesting download for format: ${format}, URL: ${youtubeUrl}`
    );

    try {
      const endpoint = `/api/download/${format}`;
      const downloadUrl = `${endpoint}?url=${encodeURIComponent(youtubeUrl)}`;

      console.log(`Making axios request to: ${downloadUrl}`);

      const response = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "blob",
      });

      console.log("Received response from server:", response.status);

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const tempUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = tempUrl;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${format}_download.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2)
          filename = filenameMatch[1];
      }
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(tempUrl);

      toast.success(`${format.toUpperCase()} download successful!`);
    } catch (error) {
      console.error("Download error:", error);
      if (error.response) {
        try {
          const errorBlobText = await error.response.data.text();
          console.error("Error blob text:", errorBlobText);
          const errorJson = JSON.parse(errorBlobText);
          toast.error(`Download failed: ${errorJson.error || "Server error"}`);
        } catch (parseError) {
          console.error("Could not parse error blob:", parseError);
          toast.error(
            `Download failed: ${error.response.status} ${error.response.statusText}`
          );
        }
      } else if (error.request) {
        console.error("Download error: No response received", error.request);
        toast.error("Download failed: No response from server.");
      } else {
        console.error("Download error: Request setup issue", error.message);
        toast.error(`Download failed: ${error.message}`);
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <Container className="app-container">
      <div className="app-header">
        <h1 className="app-title">YouTube to MP3/MP4 Converter</h1>
        <p className="app-subtitle">
          Convert YouTube videos to MP3 audio or MP4 video format
        </p>
      </div>

      <ConverterForm onSubmit={validateYouTubeUrl} loading={loading} />

      {videoInfo && (
        <VideoInfo
          videoInfo={videoInfo}
          onDownload={downloadVideo}
          loading={downloadLoading}
        />
      )}
    </Container>
  );
};

export default App;
