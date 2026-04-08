export default function CaptionOverlay({ text }) {
  if (!text) return null;

  return (
    <div style={styles.overlay}>
      <span style={styles.text}>{text}</span>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    bottom: '48px',
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: '90%',
    textAlign: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  },
  text: {
    display: 'inline-block',
    padding: '0.3rem 0.8rem',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    fontSize: '1.15rem',
    fontWeight: 500,
    borderRadius: '4px',
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
};
