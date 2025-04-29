import React, { useState } from "react";
import { Card, Button, Row, Col, Badge, Spinner } from "react-bootstrap";
import { FaFileAudio, FaFileVideo, FaDownload } from "react-icons/fa";

const VideoInfo = ({ videoInfo, onDownload, loading }) => {
  const [selectedFormat, setSelectedFormat] = useState("mp3");
  const { title, author, lengthSeconds, thumbnailUrl } = videoInfo;

  // Convert seconds to minutes and seconds format
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="video-info-card">
      <Card.Body>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <img
              src={thumbnailUrl}
              alt={title}
              className="img-fluid rounded"
              style={{ maxWidth: "100%" }}
            />
          </Col>
          <Col md={8}>
            <Card.Title>{title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              By {author}
            </Card.Subtitle>
            <Card.Text>
              <Badge bg="secondary" className="me-2">
                Duration: {formatDuration(lengthSeconds)}
              </Badge>
            </Card.Text>

            <div className="format-options">
              <Button
                variant={
                  selectedFormat === "mp3" ? "success" : "outline-success"
                }
                onClick={() => setSelectedFormat("mp3")}
                className="me-2"
                disabled={loading}
              >
                <FaFileAudio className="icon-btn" />
                MP3 (Audio)
              </Button>
              <Button
                variant={
                  selectedFormat === "mp4" ? "primary" : "outline-primary"
                }
                onClick={() => setSelectedFormat("mp4")}
                disabled={loading}
              >
                <FaFileVideo className="icon-btn" />
                MP4 (Video)
              </Button>
            </div>

            <Button
              variant={selectedFormat === "mp3" ? "success" : "primary"}
              className="download-btn"
              onClick={() => onDownload(selectedFormat)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Converting...
                </>
              ) : (
                <>
                  <FaDownload className="icon-btn" />
                  Download {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default VideoInfo;
