# 🎬 All-in-One Nuvio Provider Repository

Official Community Scraper & Provider Repository for **[Nuvio Mobile](https://github.com/NuvioMedia/NuvioMobile)** (Android / iOS / TV).

Provides high-speed **Castle VIP** (AES-128 Decrypted), **NetMirror Net77** (Multi-OTT Adaptive HLS), and **Bingr** (Multi-Source Streaming) with full **Multi-Audio (Hindi, English, Tamil, Telugu, etc.)** in 1080p, 720p, and 480p.

---

## 🚀 How to Add this Repository in Nuvio

1. Open the **Nuvio** app on your phone, TV, or desktop.
2. Go to **Settings ⚙️** ➡️ **Local Scrapers** (or **Content & Discovery** ➡️ **Plugins**).
3. Select **Add Repository** (or **Add Plugin**).
4. Paste your GitHub Raw URL:
   ```text
   https://raw.githubusercontent.com/flix-dlp/All-in-One-Nuvio/main/manifest.json
   ```
5. Click **Add / Sync** and enable the providers!

---

## 📦 Included Providers (v1.6.0)

| Provider | ID | Description | Audio / Quality |
| :--- | :--- | :--- | :--- |
| **🏰 Castle VIP Streams** | `castle` | Direct Castle VIP streams with local AES-128 decryption | Hindi, English, Tamil, Telugu (1080p, 720p) |
| **🌐 NetMirror (Net77)** | `net77` | Multi-OTT master HLS streams from Netflix, Prime & Hotstar | Multi-Audio (Hindi, English, Tamil, Telugu, etc.) |
| **⚡ Bingr Multi-Source** | `bingr` | Aggregated streams from Vidbolt, Punkflix, Flikhub, Filmu | Multi-Audio & Subtitles (1080p, 720p) |

---

## 🛠️ Testing Providers Locally

Run the test script with Node.js:
```bash
node test-plugin.js
```
