/**
 * Utility helpers for the Avro Phonetic matcher.
 *
 * All character-class checks operate on *English* (Latin) characters because
 * pattern matching runs against the original input string, not the Bangla output.
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
 * Validates that the input string contains only safe characters.
 * Raises a `TypeError` if the input is not a string.
 */
export function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`@subhesadek/avro-phonetic: expected a string, got ${typeof value}`);
  }
}
