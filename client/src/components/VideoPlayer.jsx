import { useRef } from 'react';
import ReactPlayer from 'react-player/youtube';

export default function VideoPlayer({ videoId, onProgress }) {
  const playerRef = useRef(null);

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div style={styles.playerContainer}>
      <ReactPlayer
        ref={playerRef}
        url={youtubeUrl}
        width="100%"
        height="100%"
        controls
        style={styles.player}
        onProgress={({ playedSeconds }) => onProgress(playedSeconds)}
        progressInterval={100}
        config={{
          youtube: {
            playerVars: { cc_load_policy: 0, hl: 'en' },
          },
        }}
      />
    </div>
  );
}

const styles = {
  playerContainer: {
    position: 'relative',
    paddingTop: '56.25%',
    background: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  player: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
};
