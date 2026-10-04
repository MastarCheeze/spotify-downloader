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
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  function getServerUrl() {
    let url = GM_getValue("server_url") ?? "";
    return url.replace(/\/+$/, ""); // Remove trailing slash if present to avoid double slashes
  }

  GM_registerMenuCommand("Set Server URL", () => {
    const currentUrl = getServerUrl();
    const newUrl = prompt(
      "Enter your Spotify Downloader server URL:",
      currentUrl,
    );
    if (newUrl !== null && newUrl.trim() !== "") {
      GM_xmlhttpRequest({
        method: "GET",
        url: newUrl + "/api/status",
        timeout: 10000,
        onload: function (res) {
          if (res.status == 200) {
            GM_setValue("server_url", newUrl.trim());
            alert(`Server URL updated to: ${newUrl.trim()}`);
          } else {
            alert("Failed to establish connection with server.");
          }
        },
        onerror: function () {
          alert("Failed to establish connection with server.");
        },
        ontimeout: function () {
          alert("Connection with server timed out.");
        },
      });
    }
  });

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
      opacity: 1;
      transition: all 0.15s cubic-bezier(0.3, 0, 0, 1);
    }

    #spotify-downloader-btn.enabled:hover {
      transform: scale(1.01);
      color: #ffffff;
      border-color: #ffffff;
    }

    #spotify-downloader-btn.enabled:active {
      transform: scale(0.99);
      color: #b3b3b3;
      border-color: #b3b3b3;
    }

    #spotify-downloader-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    button.className = "enabled";

    button.addEventListener("click", () => {
      if (button.dataset.loading === "true") return;
      button.dataset.loading = "true";
      button.innerText = "⏳ Downloading...";
      button.className = "disabled";

      sendDownloadRequest(window.location.href, (success) => {
        if (success) {
          button.innerText = "✅ Downloaded";
        } else {
          button.dataset.loading = "false";
          button.innerText = "⬇ Download on Server";
          button.className = "enabled";
        }
      });
    });

    actionsEl.appendChild(button);
  }

  // Trigger download on server
  function sendDownloadRequest(url, callback) {
    if (!getServerUrl()) {
      error(
        "Server url not set",
        "Please set the url for your music server using the option in the menu.",
      );
      return;
    }

    console.log(
      `[Spotify Downloader] Sending request to ${getServerUrl()} to download track ${url}`,
    );

    GM_xmlhttpRequest({
      method: "POST",
      url: getServerUrl() + "/api/download",
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
          if (callback) callback(true);
        } else {
          try {
            const data = JSON.parse(res.responseText);
            error(data.message, data.details);
          } catch {
            error(`Error ${res.status}`, res.responseText);
          }
          if (callback) callback(false);
        }
      },
      onerror: function (res) {
        error("Network error", res.responseText);
        if (callback) callback(false);
      },
      ontimeout: function (res) {
        error("Request timed out", res.responseText);
        if (callback) callback(false);
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
