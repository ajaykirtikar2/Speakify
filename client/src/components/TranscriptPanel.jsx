import { useEffect, useRef, useMemo } from 'react';
import { groupUtterances } from '../utils/syllabify.js';

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TranscriptPanel({ captions, playedSeconds }) {
  const utterances = useMemo(() => groupUtterances(captions), [captions]);

  const activeSegIndex = captions.findIndex(
    (s) => playedSeconds >= s.offset && playedSeconds < s.offset + s.duration
  );
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSegIndex]);

  if (!captions.length) return null;

  return (
    <div style={styles.container}>
      {utterances.map((utt, ui) => (
        <div key={ui} style={styles.utterance}>
          {utt.segments.map((seg, si) => {
            const globalIdx = captions.indexOf(seg);
            const isActive = globalIdx === activeSegIndex;
            return (
              <div
                key={si}
                ref={isActive ? activeRef : null}
                style={isActive ? { ...styles.row, ...styles.activeRow } : styles.row}
              >
                <span style={styles.timestamp}>{formatTime(seg.offset)}</span>
                <span style={isActive ? styles.activeText : styles.text}>{seg.text}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    maxHeight: '380px',
    overflowY: 'auto',
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    padding: '0.25rem 0',
    marginTop: '0.5rem',
  },
  utterance: {
    borderBottom: '1px solid var(--border)',
    paddingBottom: '0.2rem',
    marginBottom: '0.2rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    padding: '0.45rem 1rem',
    transition: 'background 0.15s',
  },
  activeRow: {
    background: 'var(--accent-dim)',
    borderLeft: '2px solid var(--accent)',
    paddingLeft: 'calc(1rem - 2px)',
  },
  timestamp: {
    color: 'var(--text-3)',
    fontSize: '0.75rem',
    minWidth: '3rem',
    paddingTop: '3px',
    fontFamily: "'DM Mono', monospace",
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  },
  text: {
    color: 'var(--text-2)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  activeText: {
    color: 'var(--accent)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    fontWeight: 500,
  },
};
