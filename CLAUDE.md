# Speakify

React + Node.js app that fetches Hindi YouTube captions and displays them as Romanized Hindi (Hinglish) with synced word highlighting and video playback.

## Dev
- `cd server && node index.js`   → Express on :3001
- `cd client && npm run dev`     → React (Vite) on :5173

## Rules
- Keep all work scoped to this `/speakify` folder — do not access files outside it
- Always ask clarifying questions before proceeding with ambiguous tasks

## Architecture

```
speakify/
├── client/src/
│   ├── App.jsx / App.css        # Main layout, state machine (idle → loading → ready)
│   ├── index.css                # Global styles, CSS variables, Google Fonts
│   └── components/
│       ├── URLInput.jsx         # URL input form
│       ├── VideoPlayer.jsx      # ReactPlayer YouTube embed (progressInterval 100ms)
│       ├── CaptionBar.jsx       # Live word-highlighted caption bar
│       ├── CaptionBar.css       # Animations: word glow + line fade-in
│       └── TranscriptPanel.jsx  # Scrollable transcript, grouped by utterance
│   └── utils/
│       └── syllabify.js         # Romanized Hindi syllabifier + utterance grouper
└── server/
    ├── index.js                 # Express routes: POST /api/captions, /whisper-confirm
    └── services/
        ├── youtubeService.js    # InnerTube API → json3 captions with word-level timestamps
        ├── transliterationService.js  # Devanagari → Romanized Hindi (custom, zero deps)
        └── whisperService.js    # OpenAI Whisper fallback (only if no YouTube captions)
```

## Key decisions

### Caption source
- Uses YouTube's **json3 caption format** via the InnerTube API — same source YouTube uses internally for word highlighting
- Returns per-word timestamps (`tStartMs` + `tOffsetMs`) — no guessing or proportional distribution
- Falls back to OpenAI Whisper only if no Hindi captions exist on YouTube
- **Always ask user to confirm before calling Whisper** — show estimated cost first

### Timing
- Word offsets come directly from YouTube's json3 data — trusted as-is, no manual advance applied
- Each segment's duration is capped to the next segment's start time to prevent overlap
- Noise segments (`[संगीत]` music, `[प्रशंसा]` applause) are filtered server-side

### Caption display
- One segment shown at a time (line by line, matching YouTube CC behavior)
- Active word glows in amber (`--accent: #F0A030`), spoken words turn gray
- `key={activeIdx}` on the caption container restarts the CSS fade-in animation on each new line

### Design system
- CSS variables in `index.css` (`--accent`, `--surface`, `--border`, `--text-1/2/3`, etc.)
- Fonts: `Fraunces` (display title), `DM Sans` (body), `DM Mono` (timestamps, URL input)
- Accent: warm amber/saffron `#F0A030` — culturally resonant with Hindi/Bollywood aesthetics
- No DB — all processing is stateless per request

### Transliteration
- Custom zero-dependency Devanagari → Romanized Hindi mapping in `transliterationService.js`
- `transliterateText(str)` exported for per-word use (used by `youtubeService.js`)
- `transliterateCaptions(arr)` for bulk segment processing (used by Whisper fallback)

### Cost guardrail
- `OPENAI_API_KEY` only required for Whisper fallback
- Server returns `{ needsWhisper: true, estimatedCost }` before any audio download
- Whisper is never called without explicit user confirmation in the UI

## Environment
```bash
# server/.env  (only needed for Whisper fallback)
OPENAI_API_KEY=sk-...
PORT=3001
```
