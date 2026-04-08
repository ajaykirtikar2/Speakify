import express from 'express';
import cors from 'cors';
import { extractVideoId, fetchHindiCaptions } from './services/youtubeService.js';
import { transliterateCaptions } from './services/transliterationService.js';
import { estimateWhisperCost, transcribeWithWhisper } from './services/whisperService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

/**
 * POST /api/captions
 * Body: { url: string }
 *
 * Tries YouTube captions first (free).
 * If none found, returns needsWhisper: true with cost estimate.
 * If found, returns transliterated captions.
 */
app.post('/api/captions', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let videoId;
  try {
    videoId = extractVideoId(url);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    const raw = await fetchHindiCaptions(videoId);

    if (!raw) {
      // No captions found — estimate Whisper cost and ask user
      // We don't know duration yet without downloading, estimate 10 min as placeholder
      const estimatedMinutes = 10;
      const cost = estimateWhisperCost(estimatedMinutes);
      return res.json({
        needsWhisper: true,
        videoId,
        url,
        estimatedCost: `$${cost}`,
        note: 'No Hindi captions found on YouTube. Whisper transcription will be needed.',
      });
    }

    const captions = transliterateCaptions(raw);
    return res.json({ captions, videoId });
  } catch (e) {
    console.error('Caption fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch captions: ' + e.message });
  }
});

/**
 * POST /api/captions/whisper-confirm
 * Body: { url: string }
 *
 * Called only after user confirms they want to use paid Whisper API.
 */
app.post('/api/captions/whisper-confirm', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let videoId;
  try {
    videoId = extractVideoId(url);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    const captions = await transcribeWithWhisper(url);
    return res.json({ captions, videoId });
  } catch (e) {
    console.error('Whisper error:', e);
    return res.status(500).json({ error: 'Whisper transcription failed: ' + e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Speakify server running on http://localhost:${PORT}`);
});
