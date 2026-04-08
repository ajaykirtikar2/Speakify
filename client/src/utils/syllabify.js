// Syllabifier for Romanized Hindi (ITRANS-style output).
// Splits a word like "vahaan" → ["va","haan"], "jhilamila" → ["jhi","la","mi","la"]

const MULTI_VOWELS  = ['aa','ee','oo','ai','au','ri'];
const SINGLE_VOWELS = ['a','e','i','o','u'];
const CONSONANT_CLUSTERS = [
  'chh','ksh','gya','kh','gh','ch','jh','th','dh','ph','bh','sh','tr','ng','ny',
];

function matchAt(str, i, list) {
  for (const s of list) {
    if (str.startsWith(s, i)) return s.length;
  }
  return 0;
}

function isConsonant(ch) {
  return /[bcdfghjklmnpqrstvwxyz]/i.test(ch);
}

export function syllabify(word) {
  if (!word) return [''];
  const w = word.toLowerCase();
  const syllables = [];
  let i = 0;
  let buf = '';

  while (i < w.length) {
    const ch = w[i];

    // Non-letter — flush buffer and pass char through as its own token
    if (!/[a-z]/i.test(ch)) {
      if (buf) { syllables.push(buf); buf = ''; }
      syllables.push(ch);
      i++;
      continue;
    }

    // Try multi-char consonant cluster
    const clusterLen = matchAt(w, i, CONSONANT_CLUSTERS);
    if (clusterLen) {
      buf += w.slice(i, i + clusterLen);
      i += clusterLen;
      continue;
    }

    // Try multi-char vowel
    const mvLen = matchAt(w, i, MULTI_VOWELS);
    if (mvLen) {
      buf += w.slice(i, i + mvLen);
      i += mvLen;
      syllables.push(buf);
      buf = '';
      continue;
    }

    // Single vowel
    if (SINGLE_VOWELS.includes(ch)) {
      buf += ch;
      i++;
      syllables.push(buf);
      buf = '';
      continue;
    }

    // Single consonant
    buf += ch;
    i++;
  }

  // Trailing consonants (no following vowel) attach to the last syllable
  if (buf) {
    if (syllables.length > 0) syllables[syllables.length - 1] += buf;
    else syllables.push(buf);
  }

  // Restore original casing for first char
  if (syllables.length > 0 && word[0] !== word[0].toLowerCase()) {
    syllables[0] = syllables[0][0].toUpperCase() + syllables[0].slice(1);
  }

  return syllables.filter(Boolean).length > 0 ? syllables.filter(Boolean) : [word];
}

/**
 * Group an array of caption segments into utterances.
 * Segments with a gap < pauseThreshold seconds are in the same utterance.
 * Returns: Array of { segments: [...], start, end }
 */
export function groupUtterances(captions, pauseThreshold = 1.2) {
  if (!captions.length) return [];
  const groups = [];
  let current = [captions[0]];

  for (let i = 1; i < captions.length; i++) {
    const prev = captions[i - 1];
    const gap = captions[i].offset - (prev.offset + prev.duration);
    if (gap > pauseThreshold) {
      groups.push(current);
      current = [];
    }
    current.push(captions[i]);
  }
  groups.push(current);

  return groups.map((segs) => ({
    segments: segs,
    start: segs[0].offset,
    end: segs[segs.length - 1].offset + segs[segs.length - 1].duration,
  }));
}
