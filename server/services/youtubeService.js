import { transliterateText } from './transliterationService.js';

// Devanagari bracketed labels YouTube inserts for non-speech audio
const NOISE_PATTERN = /^\s*\[[\u0900-\u097F\s]+\]\s*$/;

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const CLIENT_VERSION = '20.10.38';
const USER_AGENT = `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)`;

/**
 * Extract YouTube video ID from any common URL format.
 */
export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  throw new Error('Could not extract video ID from URL');
}

/**
 * Call InnerTube API to get the Hindi caption track baseUrl.
 */
async function getCaptionTrackUrl(videoId) {
  const res = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      context: { client: { clientName: 'ANDROID', clientVersion: CLIENT_VERSION } },
      videoId,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  // Prefer exact 'hi', then any Hindi variant
  const track =
    tracks.find((t) => t.languageCode === 'hi') ??
    tracks.find((t) => t.languageCode?.startsWith('hi'));

  return track?.baseUrl ?? null;
}

/**
 * Fetch the json3 caption format (word-level timestamps).
 * Returns raw events array or null.
 */
async function fetchJson3(baseUrl) {
  // Remove any existing fmt param and request json3
  const url = baseUrl.replace(/[?&]fmt=[^&]*/g, '') + '&fmt=json3';
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.events ?? null;
}

/**
 * Parse json3 events into caption segments with per-word timestamps.
 * Each segment: { text, offset (s), duration (s), words: [{text, offset, duration}] }
 */
function parseJson3(events) {
  const segments = [];

  for (const event of events) {
    // Skip window/non-caption events
    if (!event.segs || !event.tStartMs) continue;

    const startMs = event.tStartMs;
    const durMs   = event.dDurationMs ?? 2000;

    // Skip full-event noise (music, applause, etc.)
    const rawFull = event.segs.map((s) => s.utf8 ?? '').join('').trim();
    if (!rawFull || NOISE_PATTERN.test(rawFull)) continue;

    // Parse word-level segs
    const words = [];
    let prevOffsetMs = 0;

    for (let i = 0; i < event.segs.length; i++) {
      const seg = event.segs[i];
      const raw = (seg.utf8 ?? '').replace(/\n/g, ' ').trim();
      if (!raw) continue;
      if (NOISE_PATTERN.test(raw)) continue;

      const wOffsetMs = seg.tOffsetMs !== undefined ? seg.tOffsetMs : prevOffsetMs;
      prevOffsetMs = wOffsetMs;

      // Duration = gap to the next seg that has its own tOffsetMs, or event end
      const nextTimed = event.segs.slice(i + 1).find((s) => s.tOffsetMs !== undefined);
      const wDurMs = Math.max(80, (nextTimed?.tOffsetMs ?? durMs) - wOffsetMs);

      const transliterated = transliterateText(raw).trim();
      if (!transliterated) continue;

      words.push({
        text: transliterated,
        offset:   (startMs + wOffsetMs) / 1000,
        duration: wDurMs / 1000,
      });
    }

    if (!words.length) continue;

    segments.push({
      text:     words.map((w) => w.text).join(' '),
      offset:   startMs / 1000,
      duration: durMs / 1000,
      words,                   // ← word-level timing for client
    });
  }

  // Cap each segment's duration to the next segment start (prevents overlap)
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].offset - segments[i].offset;
    if (gap > 0 && gap < segments[i].duration) {
      segments[i] = { ...segments[i], duration: gap };
    }
  }

  return segments;
}

/**
 * Fetch Hindi captions with word-level timestamps.
 * Returns array of { text, offset, duration, words } or null.
 */
export async function fetchHindiCaptions(videoId) {
  try {
    const baseUrl = await getCaptionTrackUrl(videoId);
    if (!baseUrl) {
      console.log('[captions] No Hindi caption track found via InnerTube');
      return null;
    }

    const events = await fetchJson3(baseUrl);
    if (!events?.length) {
      console.log('[captions] json3 returned no events');
      return null;
    }

    const segments = parseJson3(events);
    console.log(`[captions] ${segments.length} segments, word timing: ${segments[0]?.words?.length ?? 0} words in first seg`);
    return segments.length ? segments : null;
  } catch (err) {
    console.error('[captions] Error fetching captions:', err.message);
    return null;
  }
}

/**
 * Get video duration in minutes from caption data.
 */
export function estimateDurationMinutes(captions) {
  if (!captions?.length) return 0;
  const last = captions[captions.length - 1];
  return (last.offset + last.duration) / 60;
}
