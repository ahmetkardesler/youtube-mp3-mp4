import os
import json
import re
import time
from flask import Flask, request, jsonify, send_file, after_this_request, Response
from flask_cors import CORS
import yt_dlp
import tempfile
import logging
from urllib.parse import quote

app = Flask(__name__)
# React client'ın (genellikle port 3000) erişimine izin ver
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Logging ayarları
logging.basicConfig(level=logging.INFO)

# Geçici klasörü backend/downloads olarak ayarla
BASE_DIR = os.path.dirname(os.path.abspath(
    __file__))  # backend klasörünün yolu
TEMP_FOLDER = os.path.join(BASE_DIR, "downloads")

if not os.path.exists(TEMP_FOLDER):
    try:
        os.makedirs(TEMP_FOLDER)
        logging.info(f"Created project download folder: {TEMP_FOLDER}")
    except OSError as e:
        logging.error(
            f"Could not create download folder {TEMP_FOLDER}: {e.strerror}")
        # Hata durumunda sistemin geçici klasörünü kullanmayı dene (opsiyonel fallback)
        # TEMP_FOLDER = os.path.join(tempfile.gettempdir(), "yt_downloads_flask_fallback")
        # if not os.path.exists(TEMP_FOLDER):
        #     os.makedirs(TEMP_FOLDER)

# Güvenli dosya adı oluşturma fonksiyonu


def sanitize_filename(filename):
    """Remove potentially unsafe characters from a filename."""
    # Geçersiz karakterleri kaldır
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1F]', '', filename)
    # Dosya adını kısalt (isteğe bağlı)
    return sanitized[:200]  # Maksimum 200 karakter


@app.route('/')
def index():
    return "Flask Backend is running!"


@app.route('/api/validate', methods=['GET'])
def validate_url():
    url = request.args.get('url')
    if not url:
        logging.error("Validation failed: URL parameter missing")
        return jsonify({"valid": False, "error": "URL is required"}), 400

    logging.info(f"Validating URL: {url}")

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'forcejson': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            video_details = {
                'title': info_dict.get('title', 'N/A'),
                'lengthSeconds': info_dict.get('duration', 0),
                'thumbnailUrl': info_dict.get('thumbnail', ''),
                'author': info_dict.get('uploader', 'N/A')
            }
            logging.info(
                f"Validation successful for: {video_details['title']}")
            return jsonify({"valid": True, "videoDetails": video_details})

    except yt_dlp.utils.DownloadError as e:
        logging.error(f"Validation failed for URL {url}: {str(e)}")
        error_message = str(e)
        if "Unsupported URL" in error_message:
            error_output = "Invalid or unsupported URL format."
        elif "Video unavailable" in error_message:
            error_output = "Video unavailable (private, deleted, or restricted)."
        else:
            error_output = "Could not validate the URL. It might be invalid or unsupported."
        return jsonify({"valid": False, "error": error_output}), 400
    except Exception as e:
        logging.exception(
            f"Unexpected error during validation for URL {url}: {str(e)}")
        return jsonify({"valid": False, "error": "An unexpected server error occurred."}), 500


@app.route('/api/download/<format_type>', methods=['GET'])
def download_file(format_type):
    url = request.args.get('url')
    if not url:
        logging.error("Download failed: URL parameter missing")
        return jsonify({"error": "URL is required"}), 400

    if format_type not in ['mp3', 'mp4']:
        logging.error(
            f"Download failed: Invalid format requested: {format_type}")
        return jsonify({"error": "Invalid format requested. Use 'mp3' or 'mp4'."}), 400

    logging.info(
        f"Download request received for URL: {url}, Format: {format_type}")

    # Geçici dosya adı için video başlığını alalım
    try:
        with yt_dlp.YoutubeDL({'quiet': True, 'skip_download': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            base_filename = sanitize_filename(info.get('title', 'video'))
    except Exception as e:
        logging.error(f"Could not get video title for filename: {str(e)}")
        base_filename = "video"  # Başlık alınamazsa varsayılan ad

    # İndirilecek dosyanın tam yolu
    output_filename = f"{base_filename}.{format_type}"
    output_path = os.path.join(TEMP_FOLDER, output_filename)

    # yt-dlp seçenekleri
    ydl_opts = {
        'format': 'bestaudio/best' if format_type == 'mp3' else 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        # Uzantıyı yt-dlp belirlesin
        'outtmpl': os.path.join(TEMP_FOLDER, f"{base_filename}.%(ext)s"),
        'quiet': True,
        'no_warnings': True,
        'postprocessors': [],
        # FFmpeg konumu belirtilebilir (Eğer PATH'de değilse)
        # 'ffmpeg_location': '/path/to/ffmpeg',
    }

    # Beklenen son çıktı yolu (MP3 için .mp3, MP4 için .mp4)
    final_output_path = os.path.join(
        TEMP_FOLDER, f"{base_filename}.{format_type}")

    # MP3 için post-processor ekle
    if format_type == 'mp3':
        ydl_opts['postprocessors'].append({
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',  # MP3 kalitesi
        })
        # Önemli: outtmpl zaten formatı içeriyor, mp3 için ayrıca path düzeltmeye gerek yok
        # Sadece beklentimizi final_output_path olarak tuttuk.

    try:
        logging.info(f"Starting download with yt-dlp options: {ydl_opts}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # İndirme işlemi sırasında hata olup olmadığını kontrol etmek için:
            error_code = ydl.download([url])
            if error_code != 0:
                logging.error(
                    f"yt-dlp download/postprocessing finished with error code: {error_code} for URL: {url}")
                return jsonify({"error": "Download or conversion process failed."}), 500
        logging.info(
            f"yt-dlp process finished for {url}. Checking for output file: {final_output_path}")

        # Dosya var mı diye kontrol etmeden önce kısa bir bekleme (opsiyonel, dosya sistemi için)
        # import time
        # time.sleep(0.5)

        # Şimdi beklenen son çıktı dosyasını kontrol et
        if not os.path.exists(final_output_path):
            logging.error(
                f"Expected output file not found: {final_output_path}")
            # Geçici klasördeki dosyalara bakalım
            try:
                files_in_temp = os.listdir(TEMP_FOLDER)
                logging.warning(f"Files in {TEMP_FOLDER}: {files_in_temp}")
                # Belki farklı bir uzantı ile kaydedilmiştir?
                found_alternative = False
                for fname in files_in_temp:
                    if fname.startswith(base_filename):
                        potential_path = os.path.join(TEMP_FOLDER, fname)
                        logging.warning(
                            f"Found potential alternative file: {potential_path}")
                        # Eğer MP3 bekliyorsak ve dosya ses dosyasıysa (ya da emin değilsek) onu kullanalım
                        # MP4 için daha katı olup sadece .mp4 arayabiliriz.
                        # Basit kontrol
                        if format_type == 'mp3' or fname.endswith('.mp4'):
                            final_output_path = potential_path
                            found_alternative = True
                            logging.info(
                                f"Using alternative file: {final_output_path}")
                            break
                if not found_alternative:
                    logging.error(
                        f"Could not find any suitable output file starting with {base_filename} in {TEMP_FOLDER}")
                    return jsonify({"error": "File conversion failed or final file not found."}), 500
            except Exception as list_err:
                logging.error(
                    f"Could not list temp directory {TEMP_FOLDER}: {list_err}")
                return jsonify({"error": "File conversion failed or final file not found."}), 500
        else:
            logging.info(f"Found expected output file: {final_output_path}")

            # Dosya içeriğini oku
            try:
                with open(final_output_path, 'rb') as f:
                    file_data = f.read()
                logging.info(f"Read file content from {final_output_path}")
            except Exception as read_err:
                logging.error(
                    f"Could not read file {final_output_path}: {read_err}")
                return jsonify({"error": "Could not read the converted file."}), 500

            # Dosyayı okuduktan SONRA silmeyi dene (retry ile)
            cleanup_success = False
            max_retries = 5
            retry_delay = 0.5
            for attempt in range(max_retries):
                try:
                    os.remove(final_output_path)
                    logging.info(
                        f"Cleaned up temporary file after attempt {attempt + 1}: {final_output_path}")
                    cleanup_success = True
                    break  # Başarılı olunca döngüden çık
                except OSError as e:
                    logging.warning(
                        f"Attempt {attempt + 1} failed to remove {final_output_path}: {e.strerror}. Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                except Exception as e:
                    logging.error(
                        f"Unexpected error during cleanup attempt {attempt + 1}: {e}")
                    break

            if not cleanup_success:
                logging.error(
                    f"Failed to remove temporary file {final_output_path} after {max_retries} attempts.")

            # Dosyayı Response nesnesi olarak gönder
            logging.info(
                f"Sending file data for {base_filename}.{format_type} to client.")

            # Güvenli dosya adı (ASCII ve URL-encoded UTF-8)
            # Sadece ASCII karakterler içeren bir fallback adı
            ascii_filename = base_filename.encode(
                'ascii', 'ignore').decode('ascii')
            if not ascii_filename:
                ascii_filename = "download"
            ascii_filename += f".{format_type}"

            # UTF-8 kodlanmış ve URL-encode edilmiş ad
            utf8_filename = quote(f"{base_filename}.{format_type}")

            response = Response(file_data)
            # RFC 6266 uyumlu Content-Disposition başlığı
            response.headers.set('Content-Disposition',
                                 f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{utf8_filename}")
            response.headers.set(
                'Content-Type', 'audio/mpeg' if format_type == 'mp3' else 'video/mp4')
            return response

    except yt_dlp.utils.DownloadError as e:
        logging.error(f"yt-dlp download error for {url}: {str(e)}")
        # FFmpeg hatası olup olmadığını kontrol et
        if "ffmpeg" in str(e).lower():
            logging.error(
                "Potential FFmpeg issue detected. Check FFmpeg installation and PATH.")
            return jsonify({"error": "MP3 conversion failed. Check FFmpeg setup."}), 500
        return jsonify({"error": f"Download failed: {str(e)}"}), 500
    except Exception as e:
        logging.exception(
            f"Unexpected error during download for {url}: {str(e)}")
        return jsonify({"error": "An unexpected server error occurred during download."}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
