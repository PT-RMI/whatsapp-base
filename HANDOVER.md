# 📋 Developer Handover — whatsapp-base

> **Project name:** `wa-web`
> **Stack:** Node.js · Express · whatsapp-web.js (Puppeteer)
> **Language:** JavaScript (CommonJS)
> **Last known working version:** whatsapp-web.js `^1.18.3`

---

## 1. Project Scope

This project is an **unofficial WhatsApp HTTP API gateway**. It bridges an existing WhatsApp account (authenticated via QR code) with any external system through a simple REST API.

**What it does:**

- Connects to WhatsApp Web using a Puppeteer-based library (`whatsapp-web.js`)
- Exposes HTTP endpoints so other services can **send messages** to WhatsApp contacts or groups
- Supports sending **plain text**, **media files (upload)**, and **media files (by URL)**
- Responds to a few basic **incoming WhatsApp commands** (e.g., `!ping`)
- Persists the WhatsApp session locally so re-authentication after restarts is not required

**What it does NOT do:**

- It is **not an official WhatsApp API** — it reverse-engineers WhatsApp Web
- It does not have a database layer
- It does not have any authentication system beyond a single shared token
- It does not handle webhooks for incoming messages (only console logs them)

---

## 2. Repository Structure

```
whatsapp-base/
├── index.js             # Main application file — everything lives here
├── package.json         # Dependencies and npm scripts
├── .env                 # Environment variables (PORT, TOKEN_API) — NOT committed
├── .gitignore           # Ignores node_modules and .wwebjs_auth
├── inmyheart.html       # Unused HTML prototype (Socket.io QR viewer — not wired up)
├── public/
│   └── files/           # Uploaded files are saved here by the API
└── .wwebjs_cache/       # Auto-generated WhatsApp Web HTML cache (do not delete)
```

> **`.wwebjs_auth/`** — Created automatically on first run; stores the WhatsApp session so you don't need to re-scan the QR code after a restart. It is gitignored.

---

## 3. Dependencies

| Package | Purpose |
|---|---|
| `whatsapp-web.js` | Core library — controls WhatsApp Web via Puppeteer |
| `express` | HTTP server / REST API |
| `express-fileupload` | Parses `multipart/form-data` file uploads |
| `qrcode-terminal` | Renders the WhatsApp QR code in the terminal |
| `dotenv` | Loads `.env` into `process.env` |
| `nodemon` | Restarts server on file changes (dev only) |
| `socket.io` | Listed as dependency but **currently unused** in production code |
| `qrcode` | Listed as dependency but **currently unused** (was for the HTML QR viewer) |

---

## 4. Environment Variables

Create a `.env` file in the project root:

```env
PORT=1111
TOKEN_API=your_secret_token_here
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `1000` | Port the Express server listens on |
| `TOKEN_API` | *(required)* | Secret token used to authenticate API calls |

> ⚠️ **Never commit `.env` to source control.** The file in the repo currently contains a real token — rotate it if the repo has been publicly visible.

---

## 5. How to Run

### Prerequisites

- **Node.js** v14+ (v18 recommended) — [download](https://nodejs.org/en/download/)
- **Google Chrome / Chromium** must be available on the machine (Puppeteer depends on it). On Linux servers, pass `--no-sandbox` (already configured in `index.js`).

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/PT-RMI/whatsapp-base.git
cd whatsapp-base

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env .env.example   # optional: keep an example
# Edit .env — set PORT and TOKEN_API

# 4. Start the server
npm start
# or without nodemon:
node index.js
```

### First-time WhatsApp Authentication

1. After running `node index.js` or `npm start`, a **QR code will appear in the terminal**.
2. Open WhatsApp on your phone → **Linked Devices** → **Link a Device**.
3. Scan the QR code.
4. The console will print `AUTHENTICATED` and then `Client is ready!`.
5. The HTTP server starts **only after** WhatsApp is ready.
6. The session is saved in `.wwebjs_auth/` — subsequent restarts will not ask for the QR code again.

---

## 6. API Endpoints

### Base URL

```
http://localhost:<PORT>
```

---

### `GET /`

Health check. Returns `haii`.

---

### `POST /send/:encrypt/:phone`

Send a plain text message.

| Part | Description |
|---|---|
| `:encrypt` | Must match `TOKEN_API` in `.env` |
| `:phone` | Phone number starting with country code (e.g. `6281234567890`) or a Group ID |

**Body (form-data or x-www-form-urlencoded):**

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | ✅ | Message to send |

**Routing logic:**
- If the number starts with `62` → sent as a **personal chat** (`@c.us`)
- Otherwise → sent as a **group chat** (`@g.us`)

**Example:**
```
POST /send/XjhGkWLRp5sqivC0yaT6/6281234567890
body: text=Hello from the API
```

---

### `POST /send-with-file/:encrypt/:phone`

Send a message with a media attachment (personal chats only, **not groups**).

| Part | Description |
|---|---|
| `:encrypt` | Must match `TOKEN_API` |
| `:phone` | Personal phone number starting with `62` |

**Option A — send by URL:**

| Field | Type | Description |
|---|---|---|
| `text` | string | Caption for the media |
| `file_url` | string | Publicly accessible URL of the file |

**Option B — upload the file:**

| Field | Type | Description |
|---|---|---|
| `text` | string | Caption for the media |
| `upload` | file | The file to upload (multipart/form-data) |

Uploaded files are saved to `public/files/<filename>`.

---

### `GET /test-send`

Sends a hardcoded test message to a hardcoded number. Used for quick debugging.

### `GET /test-group`

Sends a hardcoded test message to a hardcoded group ID. Used for quick debugging.

### `POST /test-send-file`

Sends a test file to a hardcoded number. Used for quick debugging.

> ⚠️ **Remove or guard test endpoints before deploying to production** — they have hardcoded phone numbers in the code.

---

## 7. Incoming Message Handling

The bot listens to all messages on the connected WhatsApp account:

| Command | Response |
|---|---|
| `!ping` | Replies `pong` to the sender |
| `!sendto <number> <message>` | Forwards the message to the given number |

All incoming messages are also logged to the console.

---

## 8. Key Architecture Notes

### Startup Order

The WhatsApp client must fully initialize before the Express server starts. The `app.listen()` and all `app.use()` / `app.post()` / `app.get()` calls are **inside the `client.on('ready', ...)` handler**. This means:

- If WhatsApp fails to authenticate, the HTTP server will never start.
- If you hit an API endpoint before WhatsApp is ready, you'll get a connection error.

### Session Persistence

`LocalAuth` saves session tokens to `.wwebjs_auth/` on disk. Do not delete this folder unless you want to re-scan the QR code.

### No Input Validation / No Auth Middleware

The only "security" is checking `req.params.encrypt === TOKEN_API`. There is no rate-limiting, no HTTPS enforcement, and no input sanitization.

### `inmyheart.html` — Unused

This file contains an HTML prototype that was meant to show the QR code in a browser via Socket.io. It is **not connected** to `index.js` (Socket.io is never initialised in the server). It can be safely ignored or removed.

---

## 9. Known Issues & Things to Improve

| Issue | Details |
|---|---|
| **Token in URL** | `TOKEN_API` is passed as a URL path segment — it appears in server access logs. Move it to a header (e.g., `Authorization: Bearer <token>`). |
| **Hardcoded test numbers** | `test-send` and `test-group` routes contain hardcoded phone numbers and should be removed in production. |
| **No HTTPS** | The server runs plain HTTP. Put it behind an Nginx/Caddy reverse proxy with TLS. |
| **No error handling** | Most functions have no try/catch — a failed WhatsApp send will crash or silently fail. |
| **Duplicate message listener** | `client.on('message', ...)` is registered **twice** — once to log, once to handle commands. Combine into one. |
| **`broadcast()` function** | Defined in `index.js` but never called anywhere. |
| **File cleanup** | Uploaded files in `public/files/` are never deleted. Disk space will grow over time. |
| **whatsapp-web.js stability** | This is an unofficial library. WhatsApp can break it at any time by updating their Web client. Watch the [whatsapp-web.js releases](https://github.com/pedroslopez/whatsapp-web.js/releases) for updates. |

---

## 10. Deployment Notes

- Run behind a **process manager** like `pm2` to keep the process alive:
  ```bash
  npm install -g pm2
  pm2 start index.js --name whatsapp-base
  pm2 save
  pm2 startup
  ```
- On headless Linux servers, Puppeteer requires additional system packages:
  ```bash
  apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
    libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 \
    libnss3 lsb-release xdg-utils wget
  ```
- The `--no-sandbox` Puppeteer flag is already set in `index.js` (required for most server environments).

---

*Generated: 2026-05-13 | Repository: PT-RMI/whatsapp-base*
