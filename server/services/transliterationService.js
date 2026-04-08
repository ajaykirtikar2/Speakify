// Custom Devanagari → Romanized Hindi (Hinglish) transliteration
// No external dependencies — uses a direct character mapping table.

const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri',
  'अं': 'an', 'अः': 'ah',
};

const VOWEL_SIGNS = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
  'ं': 'n', 'ः': 'h', 'ँ': 'n',
};

const CONSONANTS = {
  'क': 'k',  'ख': 'kh', 'ग': 'g',  'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh','ज': 'j',  'झ': 'jh', 'ञ': 'ny',
  'ट': 't',  'ठ': 'th', 'ड': 'd',  'ढ': 'dh', 'ण': 'n',
  'त': 't',  'थ': 'th', 'द': 'd',  'ध': 'dh', 'न': 'n',
  'प': 'p',  'फ': 'ph', 'ब': 'b',  'भ': 'bh', 'म': 'm',
  'य': 'y',  'र': 'r',  'ल': 'l',  'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's',  'ह': 'h',
  'क्ष': 'ksh','त्र': 'tr', 'ज्ञ': 'gya',
  // Nukta variants (borrowed sounds)
  'क़': 'q',  'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh',
  'फ़': 'f',  'य़': 'y',
};

const MISC = {
  '।': '.', '॥': '.', '०': '0', '१': '1', '२': '2', '३': '3',
  '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '\u094D': '', // halant (virama) — suppress inherent 'a'
};

const HALANT = '\u094D'; // ्

/**
 * Transliterate a Devanagari string to Romanized Hinglish.
 */
function romanize(text) {
  if (!text || !text.trim()) return text;

  // Decode common HTML entities
  const cleaned = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  // If no Devanagari characters, return as-is
  if (!/[\u0900-\u097F]/.test(cleaned)) return cleaned;

  let result = '';
  let i = 0;
  const chars = [...cleaned]; // Unicode-safe split

  while (i < chars.length) {
    const ch = chars[i];

    // Check two-char consonant clusters first
    const twoChar = ch + (chars[i + 1] || '');
    if (CONSONANTS[twoChar]) {
      result += CONSONANTS[twoChar];
      i += 2;
      // Check for vowel sign after
      const next = chars[i] || '';
      if (next === HALANT) {
        i++; // suppress inherent vowel
      } else if (VOWEL_SIGNS[next]) {
        result += VOWEL_SIGNS[next];
        i++;
      } else if (/[\u0900-\u097F]/.test(next) && !VOWEL_SIGNS[next]) {
        result += 'a'; // inherent vowel before next consonant
      } else {
        result += 'a'; // inherent vowel at end
      }
      continue;
    }

    if (CONSONANTS[ch]) {
      result += CONSONANTS[ch];
      i++;
      const next = chars[i] || '';
      if (next === HALANT) {
        i++; // halant suppresses inherent 'a'
      } else if (VOWEL_SIGNS[next]) {
        result += VOWEL_SIGNS[next];
        i++;
      } else if (CONSONANTS[next] || VOWELS[next]) {
        result += 'a'; // inherent vowel before next consonant/vowel
      } else {
        result += 'a'; // word-final inherent vowel
      }
      continue;
    }

    if (VOWELS[ch]) {
      result += VOWELS[ch];
      i++;
      continue;
    }

    if (VOWEL_SIGNS[ch]) {
      result += VOWEL_SIGNS[ch];
      i++;
      continue;
    }

    if (MISC[ch] !== undefined) {
      result += MISC[ch];
      i++;
      continue;
    }

    // Non-Devanagari character (space, punctuation, Latin) — pass through
    result += ch;
    i++;
  }

  // Clean up: collapse multiple spaces, trim
  result = result.replace(/\s+/g, ' ').trim();

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/** Transliterate a single word or phrase. */
export function transliterateText(text) {
  return romanize(text);
}

/**
 * Transliterate all caption segments.
 * Input/output shape: [{ text, offset, duration }]
 */
export function transliterateCaptions(captions) {
  return captions.map((seg) => ({
    ...seg,
    text: romanize(seg.text),
  }));
}
