import React, { useState } from "react";
import { Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { FaYoutube, FaSearch } from "react-icons/fa";

const ConverterForm = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState("");
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    onSubmit(url);
  };

  return (
    <Form
      noValidate
      validated={validated}
      onSubmit={handleSubmit}
      className="url-input"
    >
      <Form.Group>
        <Form.Label>YouTube Video URL</Form.Label>
        <InputGroup>
          <InputGroup.Text>
            <FaYoutube className="text-danger" />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={loading}
          />
          <Button variant="primary" type="submit" disabled={loading || !url}>
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
                Validating...
              </>
            ) : (
              <>
                <FaSearch className="me-2" />
                Validate
              </>
            )}
          </Button>
        </InputGroup>
        <Form.Control.Feedback type="invalid">
          Please enter a valid YouTube URL.
        </Form.Control.Feedback>
        <Form.Text className="text-muted">
          Enter a YouTube video URL to convert to MP3 or MP4 format.
        </Form.Text>
      </Form.Group>
    </Form>
  );
};

export default ConverterForm;
