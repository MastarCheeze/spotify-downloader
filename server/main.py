from flask import Flask, jsonify, request
import subprocess
from dotenv import load_dotenv
import os

load_dotenv()
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR")

app = Flask(__name__)


@app.route("/api/status")
def status():
    return jsonify({"success": True}), 200


@app.route("/api/download", methods=["POST"])
def download():
    data = request.get_json() or {}
    spotify_url = data.get("url")

    if not spotify_url:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    command = [
        "spotdl",
        "download",
        spotify_url,
        "--output",
        f"{DOWNLOAD_DIR}/{{artist}} - {{title}}.{{output-ext}}"
    ]

    try:
        result = subprocess.run(
            command, capture_output=True, text=True, check=True)
        print(result)
        return jsonify({
            "success": True,
            "message": "Track downloaded"
        }), 200
    except subprocess.CalledProcessError as err:
        return jsonify({
            "success": False,
            "error": "Failed to download track",
            "details": err.stderr
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
