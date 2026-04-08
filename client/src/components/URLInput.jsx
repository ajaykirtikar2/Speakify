import { useState } from 'react';

export default function URLInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a Hindi YouTube URL…"
        disabled={loading}
        className="url-input"
        autoFocus
      />
      <button type="submit" disabled={loading || !url.trim()} className="url-btn">
        {loading ? (
          <span className="loading-dots">
            <span /><span /><span />
          </span>
        ) : 'Get Captions'}
      </button>
    </form>
  );
}
