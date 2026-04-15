# WhatsApp AI Chatbot - Ayres Parallel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Platform: Railway](https://img.shields.io/badge/Platform-Railway-blueviolet)](https://railway.app/)

Ayres Parallel Chatbot adalah bot WhatsApp berbasis Node.js yang menggabungkan handler berbasis keyword dengan fallback AI melalui Ollama API. Project ini ditujukan untuk membantu percakapan penjualan dan edukasi produk secara otomatis, termasuk pengiriman gambar, pengelolaan sesi WhatsApp, health check server, dan auto reconnect saat koneksi bermasalah.

## Ringkasan Fitur

- Integrasi WhatsApp Web menggunakan `@whiskeysockets/baileys`
- Fallback AI menggunakan Ollama API
- Handler keyword untuk sapaan, reset percakapan, kebutuhan kesehatan, dan peluang bisnis
- Pengiriman gambar otomatis dari folder `gambar/`
- Web panel sederhana untuk status bot, QR login, dan logout
- Endpoint health check untuk deployment di Railway
- Watchdog reconnect untuk koneksi yang macet atau terputus
- Logging terstruktur dan pengaturan rate limit dasar

## Struktur Project

```text
chatbot_kevin/
|-- gambar/                     # Asset gambar yang dikirim ke user
|-- src/
|   |-- ai/
|   |   |-- ollama.js          # Integrasi request ke Ollama
|   |   `-- prompt.js          # Builder prompt AI
|   |-- core/
|   |   |-- connection.js      # Koneksi WhatsApp, reconnect, watchdog
|   |   |-- healthcheck.js     # Web panel + API status/QR/logout
|   |   `-- router.js          # Routing pesan masuk
|   |-- handlers/
|   |   |-- aiHandler.js       # Fallback AI
|   |   `-- commandHandler.js  # Handler keyword dan image replies
|   `-- utils/
|       |-- logger.js          # Logging
|       `-- throttle.js        # Delay/rate limit reply
|-- .env.example
|-- index.js
|-- knowledge-base.json
|-- package.json
`-- railway.toml
```

## Prasyarat

- Node.js 18 atau lebih baru
- npm
- Akun WhatsApp untuk login QR
- Endpoint Ollama API yang bisa diakses
- API key Ollama bila endpoint Anda memerlukannya

## Instalasi

1. Clone repository:

```bash
git clone https://github.com/kevinprasetyo817-jpg/chatbot_kevin.git
cd chatbot_kevin
```

2. Install dependency:

```bash
npm install
```

3. Buat file environment dari contoh:

```bash
copy .env.example .env
```

4. Isi konfigurasi penting di file `.env`.

## Konfigurasi Environment

Contoh variabel yang tersedia:

| Variable | Keterangan | Default |
| --- | --- | --- |
| `OLLAMA_HOST` | Base URL Ollama API | `https://ollama.com` |
| `OLLAMA_KEY` | API key Ollama | - |
| `OLLAMA_MODEL` | Model yang dipakai AI | `gpt-oss:120b-cloud` |
| `AI_TIMEOUT` | Timeout request AI dalam ms | `25000` |
| `MAX_HISTORY` | Jumlah history chat yang disimpan | `10` |
| `RATE_LIMIT_MAX` | Maksimal pesan per window | `10` |
| `RATE_LIMIT_WINDOW` | Window rate limit dalam ms | `60000` |
| `REPLY_DELAY_MIN` | Delay minimum reply dalam ms | `800` |
| `REPLY_DELAY_MAX` | Delay maksimum reply dalam ms | `2000` |
| `LOG_LEVEL` | Level logging | `info` |
| `SESSION_DIR` | Lokasi penyimpanan sesi WhatsApp | `./auth` |
| `LOG_DIR` | Lokasi file log | `./logs` |
| `WA_WATCHDOG_INTERVAL_MS` | Interval watchdog | `60000` |
| `WA_WATCHDOG_DISCONNECTED_MS` | Batas disconnect sebelum reconnect paksa | `180000` |
| `WA_WATCHDOG_STARTING_MS` | Batas startup stall | `120000` |
| `WA_WATCHDOG_CONNECTED_STALE_MS` | Batas koneksi sehat tapi stale | `120000` |
| `PORT` | Port web panel dan health check | `3000` |

## Menjalankan Project

Mode normal:

```bash
npm start
```

Mode development:

```bash
npm run dev
```

Saat pertama kali dijalankan:

1. Bot akan membuka server HTTP lebih dulu.
2. QR code WhatsApp akan tersedia di terminal dan web panel.
3. Scan QR dari WhatsApp di ponsel melalui menu Perangkat Tertaut.
4. Setelah tersambung, sesi akan disimpan di folder `auth/` atau path yang Anda set di `SESSION_DIR`.

## Endpoint HTTP

Web panel dan endpoint berikut disediakan oleh `src/core/healthcheck.js`:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/` | Web panel status bot |
| `GET` | `/health` | Health check sederhana |
| `GET` | `/api/status` | Status koneksi bot |
| `GET` | `/api/qr` | QR code dalam format PNG |
| `POST` | `/api/logout` | Logout dan reset sesi bot |

## Perilaku Bot

Bot akan memproses keyword tertentu lebih dulu sebelum meneruskan pesan ke AI.

Keyword yang ditangani langsung antara lain:

- `ping`
- `reset` atau `/reset`
- `admin`
- sapaan seperti `halo`, `hai`, `hi`, `menu`, `start`, `mulai`
- keyword peluang bisnis seperti `peluang bisnis`, `join member`, `member afc`, `bonus sponsor`
- keyword kebutuhan kesehatan umum dan spesifik seperti `kesehatan`, `diabetes`, `kolesterol`, `asam urat`, `maag`, `insomnia`, dan sejenisnya

Untuk beberapa kebutuhan, bot akan mengirimkan gambar dari folder `gambar/`, misalnya:

- informasi kandungan dan paten fungsi produk
- paket join member
- bonus sponsor, pass up, pairing, dan bonus lainnya

Jika pesan tidak cocok dengan handler keyword, sistem akan meneruskannya ke AI melalui `askAI()`.

## Knowledge Base

File `knowledge-base.json` dipakai sebagai sumber informasi utama untuk jawaban AI. Isi file ini sebaiknya diperbarui saat ada perubahan:

- produk
- manfaat atau positioning produk
- skema bisnis
- FAQ
- aturan atau batasan komunikasi yang harus dijaga bot

## Logging dan Session

- File `.env` sudah diabaikan oleh Git.
- Folder `auth/` juga diabaikan agar sesi WhatsApp tidak ikut ter-commit.
- Log disimpan sesuai `LOG_DIR`.
- Jika sesi rusak atau login digantikan dari perangkat lain, bot akan mencoba reset sesi dan meminta login ulang.

## Deployment Railway

Project ini sudah menyiapkan `railway.toml`, `Procfile`, dan health endpoint sehingga cocok untuk Railway.

Rekomendasi saat deploy:

1. Gunakan `npm install` sebagai install command.
2. Gunakan `npm start` sebagai start command.
3. Mount volume persisten untuk sesi WhatsApp dan log.
4. Set `SESSION_DIR` ke lokasi volume, misalnya `/data/auth`.
5. Set `LOG_DIR` ke lokasi volume, misalnya `/data/logs`.

## Troubleshooting

### QR tidak muncul

- Pastikan bot berjalan tanpa error di terminal.
- Cek endpoint `/api/status` dan `/api/qr`.
- Pastikan port pada environment sudah benar.

### Bot sering disconnect

- Cek koneksi internet server.
- Pastikan sesi WhatsApp tidak sedang dipakai oleh instance lain.
- Periksa log untuk pesan seperti `Bad MAC`, `logged out`, atau `connection replaced`.

### AI tidak menjawab

- Pastikan `OLLAMA_HOST` benar dan bisa diakses.
- Pastikan `OLLAMA_KEY` valid jika dibutuhkan.
- Cek timeout `AI_TIMEOUT` dan log error dari handler AI.

### Ingin reset sesi

- Gunakan endpoint `POST /api/logout`, atau
- Hapus folder sesi sesuai `SESSION_DIR`, lalu jalankan ulang bot.

## Git

Remote utama project ini saat ini mengarah ke:

- `origin`: `https://github.com/kevinprasetyo817-jpg/chatbot_kevin.git`
- `upstream`: `https://github.com/EzraNahumury/chatbot_kevin.git`

## Lisensi

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lengkap.
