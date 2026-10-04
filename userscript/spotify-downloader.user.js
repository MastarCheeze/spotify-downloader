// ==UserScript==
// @name         Spotify Downloader
// @namespace    https://www.mastarcheeze.com/
// @version      1.0.0
// @description  Use the Spotify Web Player as a search engine to download songs on a server.
// @author       MastarCheeze
// @match        https://open.spotify.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=spotify.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// ==/UserScript==

(function () {
  "use strict";

  const SERVER_URL = "http://localhost:8000";

  // Query selectors
  const ACTIONS_SEL =
    "#main-view > div > div.main-view-container__scroll-node.WiwnWsPYbL585uUaVMp3 > div:nth-child(1) > div > main > section > div:nth-child(2) > div.WiwnWsPYbL585uUaVMp3 > div:nth-child(1) > div > div > div.jUYJ0jYnS41uokf46VXs";

  // Add styles
  GM_addStyle(`
    #spotify-downloader-btn {
      background-color: transparent;
      color: #b3b3b3;
      border: 2px solid #b3b3b3;
      border-radius: 24px;
      padding: 4px 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.15s cubic-bezier(0.3, 0, 0, 1);
    }

    #spotify-downloader-btn:hover {
      transform: scale(1.01);
      color: #ffffff;
      border-color: #ffffff;
    }

    #spotify-downloader-btn:active {
      transform: scale(0.99);
      color: #b3b3b3;
      border-color: #b3b3b3;
    }
  `);

  // UI inject functions
  function injectTrackPage() {
    if (!window.location.href.includes("/track/")) return;
    const actionsEl = document.querySelector(ACTIONS_SEL);
    if (!actionsEl) return;
    if (document.getElementById("spotify-downloader-btn")) return;

    const button = document.createElement("button");
    button.id = "spotify-downloader-btn";
    button.innerText = "⬇ Download on Server";

    button.addEventListener("click", () => {
      sendDownloadRequest(window.location.href);
    });

    actionsEl.appendChild(button);
  }

  // Trigger download on server
  function sendDownloadRequest(url) {
    console.log(
      `[Spotify Downloader] Sending request to download track ${url}`,
    );

    GM_xmlhttpRequest({
      method: "POST",
      url: SERVER_URL + "/api/download",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        url: url,
      }),
      timeout: 60000,
      onload: function (res) {
        if (res.status >= 200 && res.status < 300) {
          const data = JSON.parse(res.responseText);
          notify(data.message, data.track);
        } else {
          error(data.message, data.details);
        }
      },
      onerror: function (res) {
        error("Network error", res.responseText);
      },
      ontimeout: function () {
        error("Request timed out");
      },
    });
  }

  // Notification helpers
  function notify(title, text, logger) {
    logger = logger ?? console.info;
    if (text) {
      logger(`[Spotify Downloader]: ${title}: ${text}`);
    } else {
      logger(`[Spotify Downloader]: ${title}`);
    }

    GM_notification({
      title: title,
      text: text,
      url: "https:/spotify.com/",
    });
  }

  function error(title, text) {
    notify(title, text, console.error);
  }

  // Observe for page changes
  const observer = new MutationObserver(() => {
    injectTrackPage();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
