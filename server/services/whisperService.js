import { execSync } from 'child_process';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { transliterateCaptions } from './transliterationService.js';

const WHISPER_COST_PER_MINUTE = 0.006; // USD

export function estimateWhisperCost(durationMinutes) {
  return (durationMinutes * WHISPER_COST_PER_MINUTE).toFixed(2);
}

/**
 * Download audio from a YouTube URL using yt-dlp and transcribe with Whisper.
 * Returns transliterated caption segments.
 */
export async function transcribeWithWhisper(url) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Cannot use Whisper fallback.');
  }

  const tmpDir = join(tmpdir(), 'speakify');
  mkdirSync(tmpDir, { recursive: true });
  const audioPath = join(tmpDir, `audio_${Date.now()}.mp3`);

  try {
    // Download audio only with yt-dlp
    execSync(
      `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 -o "${audioPath}" "${url}"`,
      { timeout: 120000 }
    );

    if (!existsSync(audioPath)) {
      throw new Error('Audio download failed — yt-dlp produced no output file.');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Request Hindi transcription with word-level timestamps
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: 'whisper-1',
      language: 'hi',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Map Whisper segments to our caption shape (offset/duration in ms)
    const rawCaptions = (response.segments || []).map((seg) => ({
      text: seg.text.trim(),
      offset: Math.round(seg.start * 1000),
      duration: Math.round((seg.end - seg.start) * 1000),
    }));

    return transliterateCaptions(rawCaptions);
  } finally {
    if (existsSync(audioPath)) {
      try { unlinkSync(audioPath); } catch { /* ignore cleanup errors */ }
    }
  }
}
