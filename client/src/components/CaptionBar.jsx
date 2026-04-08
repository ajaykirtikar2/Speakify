import './CaptionBar.css';

export default function CaptionBar({ captions, playedSeconds }) {
  const activeIdx = captions.findIndex(
    (s) => playedSeconds >= s.offset && playedSeconds < s.offset + s.duration
  );
  const seg = activeIdx >= 0 ? captions[activeIdx] : null;

  if (!seg) {
    return (
      <div style={styles.wrapper}>
        <span style={styles.rest}>♪</span>
      </div>
    );
  }

  const hasWordTiming = Array.isArray(seg.words) && seg.words.length > 0;

  // Build display words with their active/spoken/upcoming state
  const displayWords = hasWordTiming
    ? seg.words.map((w) => ({
        text: w.text,
        isActive: playedSeconds >= w.offset && playedSeconds < w.offset + w.duration,
        isSpoken: playedSeconds >= w.offset + w.duration,
      }))
    : seg.text.split(' ').filter(Boolean).map((text, i, arr) => {
        const wordDur = seg.duration / arr.length;
        const wordStart = seg.offset + i * wordDur;
        const wordEnd = wordStart + wordDur;
        return {
          text,
          isActive: playedSeconds >= wordStart && playedSeconds < wordEnd,
          isSpoken: playedSeconds >= wordEnd,
        };
      });

  return (
    <div style={styles.wrapper}>
      <div key={activeIdx} className="caption-utterance" style={styles.line}>
        {displayWords.map(({ text, isActive, isSpoken }, i) => {
          let cls = 'syl';
          if (isActive)      cls += ' active';
          else if (isSpoken) cls += ' spoken';
          return (
            <span key={i}>
              {i > 0 && <span className="syl spoken"> </span>}
              <span className={cls}>{text}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: '0.75rem',
    minHeight: '4.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 2rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  line: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '1.35rem',
    fontWeight: 400,
    lineHeight: 1.7,
    textAlign: 'center',
    letterSpacing: '0.02em',
  },
  rest: {
    color: 'var(--text-3)',
    fontSize: '1.1rem',
  },
};
