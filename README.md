# Spotify Downloader 🎵

## Synopsis

This is an self-hosted tool that turns your Spotify Web Player into a search engine to download music onto your own music server.

The project is composed of two parts, a Python Flask server that downloads tracks using [`spotdl`](https://github.com/spotdl/spotify-downloader), and a browser userscript that communicates with the server.

I wanted to host my own Spotify clone, but realised there's no intuitive way to search and download tracks onto my music server. So I made this to make my life easier.

## Instructions

Clone this repository on your music server, where your music files are stored.

Create an `.env` file in the `server` directory. You can use [`.env.example`](server/.env.example) as a reference.

To run the Python Flask server as a Docker container,

```sh
cd server
docker compose up
```

Download the userscript [userscript/spotify-downloader.user.js] into your favourite userscript manager (I only tested this with [TamperMonkey](http://tampermonkey.net/)). Use the "Set Server URL" option in the userscript manager's context menu to point to your music server. The userscript adds a "Download to server" button to the track's page.
