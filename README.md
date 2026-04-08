# Speakify
<<<<<<< HEAD

Hindi YouTube videos → Romanized phonetic captions (Hinglish).

Paste any Hindi YouTube URL and get the video with synced captions transliterated into Roman script — readable by anyone who can't read Devanagari.

## Setup

### Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### Run

Open two terminals:

```bash
# Terminal 1 — server (port 3001)
cd server && node index.js

# Terminal 2 — client (port 5173)
cd client && npm run dev
```

Then open `http://localhost:5173`.

## Usage

1. Paste a Hindi YouTube URL into the input field
2. Click **Get Captions**
3. Watch the video with Romanized Hindi captions overlaid
4. Toggle the **Transcript** tab for a full scrollable transcript

## Whisper Fallback (optional)

If a video has no Hindi captions on YouTube, the app can transcribe the audio using OpenAI Whisper. This costs ~$0.006/minute and requires an API key.

The app will show you the estimated cost and ask for confirmation before spending anything.

To enable it, copy the example env file and add your key:

```bash
cp server/.env.example server/.env
# then edit server/.env and set OPENAI_API_KEY=sk-...
```

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Captions:** `youtube-transcript` (free, no API key)
- **Transliteration:** `sanscript` (free, local)
- **Whisper fallback:** OpenAI `whisper-1` (paid, optional)
=======
Hindi YouTube videos → Romanized phonetic captions
>>>>>>> 98c18f704a6c182f659eb29a517eece3745ed4fe
