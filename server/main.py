from flask import Flask, jsonify, request
import subprocess
from dotenv import load_dotenv
import os

load_dotenv()
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))

app = Flask(__name__)


@app.route("/api/status")
def status():
    return jsonify({}), 200


@app.route("/api/download", methods=["POST"])
def download():
    data = request.get_json() or {}
    spotify_url = data.get("url")

    if not spotify_url:
        return jsonify({"message": "No URL provided"}), 400

    command = [
        "spotdl",
        "download",
        spotify_url,
        "--output",
        f"{DOWNLOAD_DIR}/{{artist}} - {{title}}.{{output-ext}}"
    ]

    app.logger.info(f"Downloading {spotify_url}")

    try:
        result = subprocess.run(
            command, capture_output=True, text=True, check=True)

        app.logger.info(result.stdout.strip())
        last_line = result.stdout.strip().split("\n")[-1]

        if "Downloaded" in last_line:
            track = last_line[12:last_line.index("\"", 12)]
            return jsonify({
                "message": "Track downloaded",
                "track": track,
            }), 200
        elif "(duplicate)" in last_line:
            track = last_line[9:-34]
            return jsonify({
                "message": "Track already downloaded",
                "track": track,
            }), 200
        else:
            return jsonify({
                "message": "Failed to download track",
                "details": last_line,
            }), 500
    except subprocess.CalledProcessError:
        return jsonify({
            "message": "Failed to download track",
            "details": "SpotDL error",
        }), 500


if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=True)
