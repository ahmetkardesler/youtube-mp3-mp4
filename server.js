const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("client/build"));

// Routes
app.get("/api/validate", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    console.error("Validation error: URL parameter is missing");
    return res.status(400).json({ error: "URL is required" });
  }

  console.log(`Attempting to validate URL: ${url}`);

  try {
    // Validate URL format first
    if (!url.match(/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
      console.error(`Invalid URL format: ${url}`);
      return res.status(400).json({
        valid: false,
        error: "Invalid YouTube URL format. Please use a proper YouTube link.",
      });
    }

    console.log("Extracting video ID...");
    const videoID = ytdl.getVideoID(url);
    console.log(`Video ID extracted: ${videoID}`);

    console.log("Fetching video info...");
    const info = await ytdl.getInfo(videoID);

    if (!info || !info.videoDetails) {
      console.error("Video details not found for ID:", videoID);
      return res.status(400).json({
        valid: false,
        error:
          "Could not retrieve video details. The video might be private or unavailable.",
      });
    }

    console.log(
      `Successfully retrieved info for: "${info.videoDetails.title}"`
    );

    const videoDetails = {
      title: info.videoDetails.title,
      lengthSeconds: info.videoDetails.lengthSeconds,
      thumbnailUrl: info.videoDetails.thumbnails[0]?.url || "",
      author: info.videoDetails.author?.name || "Unknown",
    };

    res.json({ valid: true, videoDetails });
  } catch (error) {
    console.error("Video validation error:", error.message);
    console.error("Error stack:", error.stack);

    let errorMessage = "Failed to validate YouTube URL";

    // Determine more specific error messages
    if (error.message.includes("No video id found")) {
      errorMessage =
        "Could not extract video ID from URL. Please check the URL format.";
    } else if (error.message.includes("Video unavailable")) {
      errorMessage =
        "This video is unavailable. It might be private, deleted, or age-restricted.";
    } else if (error.message.includes("status code")) {
      errorMessage =
        "YouTube API error. The service might be temporarily unavailable.";
    }

    res.status(400).json({
      valid: false,
      error: errorMessage,
      details: error.message,
    });
  }
});

app.get("/api/download/mp3", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const videoID = ytdl.getVideoID(url);
    const info = await ytdl.getInfo(videoID);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    const outputPath = path.join(downloadsDir, `${title}.mp3`);

    ytdl(url, { filter: "audioonly", quality: "highestaudio" })
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        res.download(outputPath, `${title}.mp3`, (err) => {
          if (err) {
            console.error("Download error:", err);
          }
          // Delete the file after download
          fs.unlinkSync(outputPath);
        });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to download and convert to MP3" });
  }
});

app.get("/api/download/mp4", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const videoID = ytdl.getVideoID(url);
    const info = await ytdl.getInfo(videoID);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
    const outputPath = path.join(downloadsDir, `${title}.mp4`);

    ytdl(url, {
      filter: (format) => format.container === "mp4" && format.qualityLabel,
    })
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        res.download(outputPath, `${title}.mp4`, (err) => {
          if (err) {
            console.error("Download error:", err);
          }
          // Delete the file after download
          fs.unlinkSync(outputPath);
        });
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to download MP4" });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
