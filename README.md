# 🎬 All-in-One Nuvio Provider Repository

Official Community Scraper & Provider Repository for **[Nuvio Mobile](https://github.com/NuvioMedia/NuvioMobile)** (Android / iOS / TV).

Provides high-speed **Castle VIP** (AES-128 Decrypted), **NetMirror** (OTT titles), **4KHDHub** (HubCloud 4K Direct), and **HDHub4u** (Multi-Audio 4K/1080p/720p) streams with full **Multi-Audio (Hindi, English, Tamil, Telugu)** in 4K UHD, 1080p, 720p, and 480p.

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

## 📦 Included Providers

| Provider | ID | Description | Audio / Quality |
| :--- | :--- | :--- | :--- |
| **Castle VIP Streams** | `castle` | Direct Castle VIP streams with local AES-128 decryption | Hindi, English, Tamil, Telugu (1080p, 720p) |
| **NetMirror Streams** | `netmirror` | Netflix, Amazon Prime & Disney+ Hotstar titles | Multi-Audio & Subtitles (1080p, 720p) |
| **4KHDHub Ultra Streams** | `4khdhub` | Direct 4K UHD, 1080p & Remux streams via HubCloud direct CDN | Multi-Audio (4K, 1080p) |
| **HDHub4u Multi-Quality** | `hdhub4u` | High-Speed 4K, 1080p, 720p Bollywood, Hollywood & Series | Multi-Audio (4K, 1080p, 720p, 480p) |

---

## 🛠️ Testing Providers Locally

Run the test script with Node.js:
```bash
NODE_PATH=../node_modules node test-plugin.js
```
