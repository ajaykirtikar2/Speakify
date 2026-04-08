import { useState } from 'react';
import './App.css';
import URLInput from './components/URLInput.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import CaptionBar from './components/CaptionBar.jsx';
import TranscriptPanel from './components/TranscriptPanel.jsx';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [whisperMeta, setWhisperMeta] = useState(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  async function handleSubmit(url) {
    setStatus('loading');
    setError(null);
    setCaptions([]);
    setVideoId(null);
    setWhisperMeta(null);
    setPlayedSeconds(0);
    try {
      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      if (data.needsWhisper) {
        setWhisperMeta({ url, estimatedCost: data.estimatedCost });
        setVideoId(data.videoId);
        setStatus('needs_confirmation');
      } else {
        setCaptions(data.captions);
        setVideoId(data.videoId);
        setStatus('ready');
      }
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  async function handleWhisperConfirm() {
    setStatus('loading');
    try {
      const res = await fetch('/api/captions/whisper-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: whisperMeta.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Whisper failed');
      setCaptions(data.captions);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  return (
    <div>
      <header className="app-header">
        <div className="app-logo">
          <h1 className="app-title">Speak<span>ify</span></h1>
        </div>
        <p className="app-subtitle">Hindi YouTube videos → Romanized phonetic captions</p>
      </header>

      <URLInput onSubmit={handleSubmit} loading={status === 'loading'} />

      {status === 'error' && (
        <div className="error-box">{error}</div>
      )}

      {status === 'needs_confirmation' && whisperMeta && (
        <div className="confirm-box">
          <p>
            No Hindi captions found on YouTube for this video.
            Transcribing with Whisper AI will cost approximately{' '}
            <strong>{whisperMeta.estimatedCost}</strong>.
          </p>
          <p>Requires <code>OPENAI_API_KEY</code> in server environment.</p>
          <div className="confirm-actions">
            <button className="confirm-btn" onClick={handleWhisperConfirm}>
              Transcribe with Whisper
            </button>
            <button className="cancel-btn" onClick={() => setStatus('idle')}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === 'ready' && videoId && (
        <div className="player-section">
          <VideoPlayer videoId={videoId} onProgress={setPlayedSeconds} />
          <CaptionBar captions={captions} playedSeconds={playedSeconds} />

          <div className="transcript-header">
            <span className="transcript-label">Transcript</span>
            <button
              className={`transcript-toggle${transcriptOpen ? ' open' : ''}`}
              onClick={() => setTranscriptOpen((v) => !v)}
            >
              {transcriptOpen ? 'Hide' : 'Show'}
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="2,3.5 5,6.5 8,3.5" />
              </svg>
            </button>
          </div>

          {transcriptOpen && (
            <div className="transcript-panel-wrap">
              <TranscriptPanel captions={captions} playedSeconds={playedSeconds} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
