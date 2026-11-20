# 🎬 All-in-One Nuvio Provider Repository

Official Community Scraper & Provider Repository for **[Nuvio Mobile](https://github.com/NuvioMedia/NuvioMobile)** (Android / iOS / TV).

Provides high-speed **Castle VIP** (AES-128 Decrypted) and **NetMirror** (Netflix, Prime, Disney) streams with full **Multi-Audio (Hindi, English, Tamil, Telugu)** in 1080p, 720p, and 480p.

---

## 🚀 How to Add this Repository in Nuvio

1. Open the **Nuvio** app on your phone, TV, or desktop.
2. Go to **Settings ⚙️** ➡️ **Local Scrapers** (or **Content & Discovery** ➡️ **Plugins**).
3. Select **Add Repository** (or **Add Plugin**).
4. Paste your GitHub Raw URL:
   ```text
   https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/All-in-One-Nuvio/main/manifest.json
   ```
5. Click **Add / Sync** and enable the providers!

---

## 📦 Included Providers

| Provider | ID | Description | Audio / Quality |
| :--- | :--- | :--- | :--- |
| **Castle VIP Streams** | `castle` | Direct Castle VIP streams with local AES-128 decryption | Hindi, English, Tamil, Telugu (1080p, 720p) |
| **NetMirror Streams** | `netmirror` | Netflix, Amazon Prime & Disney+ Hotstar titles | Multi-Audio (1080p, 720p) |
| **ModFlix Dual Engine** | `modflix-bridge` | Ultra-fast unified engine combining Castle + NetMirror | 4K, 1080p, 720p with instant caching |

---

## 🛠️ Testing Providers Locally

Run the test script with Node.js:
```bash
node test-plugin.js
```
