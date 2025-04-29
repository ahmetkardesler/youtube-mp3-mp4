# YouTube to MP3/MP4 Converter

A tool to convert YouTube videos into MP3 (audio) and MP4 (video) formats.

## Features

- Convert YouTube links to MP3 audio format.
- Convert YouTube links to MP4 video format.
- Simple and user-friendly interface (React frontend).
- Reliable conversion process using `yt-dlp`.

## Requirements

- **Backend:**
  - Python 3.7+
  - `pip` (Python package installer)
  - FFmpeg (Required only for MP3 conversion, must be in system PATH)
- **Frontend:**
  - Node.js (v14 or later)
  - `npm` or `yarn` (package manager)

## Installation

Detailed instructions can be found in [INSTALL.md](./INSTALL.md).

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd youtube-to-mp3mp4-converter
    ```
2.  **Backend Setup (Flask):**
    ```bash
    cd backend
    python -m venv venv          # Create virtual environment (recommended)
    # Activate the virtual environment:
    # Linux/macOS:
    source venv/bin/activate
    # Windows (Command Prompt):
    # venv\Scripts\activate.bat
    # Windows (PowerShell):
    # .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt # Install Python dependencies
    cd ..
    ```
3.  **Frontend Setup (React):**
    ```bash
    cd client
    npm install                   # Install Node.js dependencies
    cd ..
    ```

## Running the Application

1.  **Start the Backend Server:**

    - Ensure the virtual environment is activated.

    ```bash
    cd backend
    flask run --port=5001       # Starts the Flask server on port 5001
    # Or run: python app.py
    ```

    - Keep this terminal running.

2.  **Start the Frontend Client (in a separate terminal):**
    ```bash
    cd client
    npm start                   # Starts the React development server
    ```
    - The application should open automatically in your browser at `http://localhost:3000`.

## Technologies Used

- **Backend:**
  - Python
  - Flask (Web Framework)
  - `yt-dlp` (YouTube downloading library)
  - FFmpeg (for MP3 post-processing)
- **Frontend:**
  - React (UI Library)
  - Axios (HTTP Client)
  - Bootstrap / React-Bootstrap (Styling)
  - React Toastify (Notifications)
