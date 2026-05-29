/**
 * Utility helpers for the Avro Phonetic matcher.
 *
 * Character-class checks come in two flavours:
 *  - Latin helpers (isVowel, isConsonant, isPunctuation) — operate on the
 *    *English* input, because pattern matching runs against the original string.
 *  - Bangla helper (isBanglaConsonant) — operates on the *Bangla output* and
 *    is used by the auto-hasanta logic in the parser.
 */

/** English vowel characters (lower and upper). */
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);

/**
 * Returns `true` if `ch` is an English vowel.
 * An empty string (start-of-string sentinel) is treated as **not** a vowel.
 */
export function isVowel(ch: string): boolean {
  return VOWELS.has(ch);
}

/**
 * Returns `true` if `ch` is an English consonant letter (a–z or A–Z, but not a vowel).
 * An empty string (start-of-string sentinel) is treated as **not** a consonant.
 */
export function isConsonant(ch: string): boolean {
  if (ch.length === 0) return false;
  const code = ch.charCodeAt(0);
  const isAlpha =
    (code >= 0x41 && code <= 0x5a) || // A-Z
    (code >= 0x61 && code <= 0x7a); // a-z
  return isAlpha && !VOWELS.has(ch);
}

/**
 * Returns `true` if `ch` is a "punctuation" character in Avro's sense:
 * anything that is NOT an English letter (consonant or vowel).
 * The empty string (start/end-of-string sentinel) is also treated as punctuation.
 */
export function isPunctuation(ch: string): boolean {
  return !isVowel(ch) && !isConsonant(ch);
}

/**
 * Returns `true` if `ch` is a Bangla consonant Unicode character.
 *
 * Covers:
 *  - Main consonants  ক–হ   (U+0995–U+09B9)
 *  - Khanda Ta        ৎ     (U+09CE)
 *  - Rra              ড়    (U+09DC)
 *  - Rha              ঢ়    (U+09DD)
 *  - Antahstha Yya    য়   (U+09DF)
 *
 * Used by the parser to decide whether automatic hasanta insertion is needed
 * when two consecutive consonant replacements appear in the Bangla output.
 */
export function isBanglaConsonant(ch: string): boolean {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x0995 && cp <= 0x09b9) || // ক–হ (main consonant block)
    cp === 0x09ce || // ৎ  khanda ta
    cp === 0x09dc || // ড়  rra  (precomposed)
    cp === 0x09dd || // ঢ়  rha  (precomposed)
    cp === 0x09df //  য়  yya (precomposed)
  );
}

/**
 * Validates that the input string contains only safe characters.
 * Raises a `TypeError` if the input is not a string.
 */
export function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`@subhesadek/avro-phonetic: expected a string, got ${typeof value}`);
  }
}
