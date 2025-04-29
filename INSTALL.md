# Installation Guide - YouTube to MP3/MP4 Converter

This guide will help you set up and run the YouTube to MP3/MP4 converter application.

## Prerequisites

1. **Python** (v3.7 or later)

   - Download and install from [python.org](https://www.python.org/)
   - Ensure `pip` is included and available in your system's PATH.

2. **Node.js** (v14 or later) - _Required for the Frontend_

   - Download and install from [nodejs.org](https://nodejs.org/)

3. **FFmpeg** - _Required for MP3 Conversion_

   - The backend uses FFmpeg via `yt-dlp` to convert downloaded audio streams to the MP3 format.
   - **Crucially, the directory containing the `ffmpeg` executable must be in your system's PATH environment variable** so the backend process can find and execute it.

   **Windows Installation:**

   - Download static builds from the official [FFmpeg Website](https://ffmpeg.org/download.html#build-windows) or [gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
   - Alternatively, use a package manager like Chocolatey: `choco install ffmpeg`.
   - **Remember to add the `bin` directory (e.g., `C:\ffmpeg\bin`) to your system's PATH environment variable.**

   **macOS Installation:**

   - Using Homebrew is recommended: `brew install ffmpeg`.

   **Linux Installation:**

   - Using apt (Ubuntu/Debian): `sudo apt update && sudo apt install ffmpeg`.
   - Using yum/dnf (Fedora/CentOS/RHEL): `sudo dnf install ffmpeg` or `sudo yum install ffmpeg ffmpeg-devel`.

4. **Git** (Optional, for cloning the repository)
   - Download and install from [git-scm.com](https://git-scm.com/)

## Installation Steps

1. **Clone the Repository:**

   ```bash
   git clone <repository_url> # Replace <repository_url> with the actual URL
   cd <repository_directory_name>
   ```

2. **Set up the Backend (Flask):**

   ```bash
   cd backend

   # Create and activate a virtual environment (Highly Recommended)
   python -m venv venv

   # Activate on Linux/macOS (bash/zsh):
   source venv/bin/activate

   # Activate on Windows (Command Prompt):
   # venv\Scripts\activate.bat

   # Activate on Windows (PowerShell):
   # .\venv\Scripts\Activate.ps1
   # Note: You might need to set execution policy: Set-ExecutionPolicy -Scope Process Unrestricted

   # Install Python dependencies into the virtual environment
   pip install -r requirements.txt

   cd ..
   ```

3. **Set up the Frontend (React):**

   ```bash
   cd client
   npm install
   cd ..
   ```

## Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminals.

1. **Start the Backend Server (Flask):**

   - Navigate to the project root directory in your terminal.

   ```bash
   cd backend
   source venv/bin/activate     # Activate virtual environment (Linux/macOS)
   # .\venv\Scripts\Activate.ps1 # Activate virtual environment (Windows PowerShell)

   # Start the Flask server (defaults to port 5001 as configured in app.py)
   flask run --port=5001
   # Alternatively: python app.py
   ```

   - Keep this terminal window open. It will show backend logs and errors.

2. **Start the Frontend Client (React):**

   - Open a _new_, separate terminal window in the project root directory.

   ```bash
   cd client
   npm start
   ```

   - This command usually opens the application automatically in your default web browser at `http://localhost:3000`.
   - If it doesn't open automatically, navigate to that URL manually.

## Usage

1. Ensure both the backend (Flask) and frontend (React) servers are running.
2. Open `http://localhost:3000` in your web browser.
3. Paste a valid YouTube video URL into the input field.
4. Click the "Validate" button. Video details should appear if the URL is valid.
5. Select your desired download format (MP3 or MP4).
6. Click the "Download" button to begin the conversion and download process.

## Troubleshooting

### FFmpeg Not Found / MP3 Conversion Error

- **Verify Installation:** Confirm FFmpeg is installed correctly.
- **Check PATH:** This is the most common issue. Ensure the directory containing the `ffmpeg` executable is **correctly added to your system's PATH environment variable**. You might need to restart your terminal, your IDE, or even your computer after modifying the PATH for changes to take effect.
- **Check Backend Logs:** The Flask server terminal will often show specific error messages from `yt-dlp` or `ffmpeg` if there's a problem during the conversion.

### Connection Refused / API Errors / Validation Failing

- **Is Backend Running?:** Make sure the Flask server (`flask run --port=5001`) is running in its terminal window without errors.
- **Correct Port?:** Verify the backend is running on port 5001 and the frontend proxy in `client/package.json` is set to `http://localhost:5001`.
- **CORS:** If accessing the frontend from a URL other than `http://localhost:3000`, ensure the `origins` in `backend/app.py` CORS configuration includes your frontend URL.
- **Firewall:** Check if a local firewall is blocking communication between port 3000 and 5001.
- **Browser Console:** Check the browser's developer console (F12) Network tab for failed requests and the Console tab for JavaScript errors.

### Download Not Starting / Failing

- **Check Backend Logs:** Look for errors in the Flask terminal during the download request.
- **Check Browser Console:** Look for errors in the browser console (F12).
- **Browser Blocking Downloads?:** Ensure your browser isn't blocking the download (e.g., pop-up blockers, security settings).
- **Large Files:** Very large files might take a long time or hit server/browser timeouts (not handled in this basic version).

## Further Help

If you continue to experience issues:

1. Carefully review the error messages in both the Flask server terminal and the browser's developer console.
2. Verify the versions of Python, Node.js, `yt-dlp`, and FFmpeg.
3. Check the `yt-dlp` [GitHub Issues](https://github.com/yt-dlp/yt-dlp/issues) page for similar problems, especially if errors seem related to recent YouTube changes.
4. Consider creating an issue in this project's repository, providing detailed steps to reproduce the problem and including relevant log outputs and error messages.
