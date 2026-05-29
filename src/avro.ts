/**
 * Core Avro Phonetic parser.
 *
 * The algorithm walks through the input string left-to-right. At every cursor
 * position it tries each pattern (longest first). When a pattern's `find`
 * matches the remaining input it evaluates the pattern's optional rules; the
 * first rule whose conditions are all satisfied wins. If no rule matches the
 * pattern's default `replace` is used.
 *
 * Scope conditions are evaluated against characters in the *original English
 * input*, not the Bangla output being built.
 */

import { BANGLISH_DICTIONARY } from './dictionary.js';
import { IMPLICIT_A_MARKER, SORTED_PATTERNS } from './patterns.js';
import type {
  BanglishDictionary,
  MatchCondition,
  ParseOptions,
  ParseResult,
  PatternEntry,
} from './types.js';
import { assertString, isBanglaConsonant, isConsonant, isPunctuation, isVowel } from './utils.js';

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns the single character immediately *before* position `pos` in `input`,
 * or an empty string `""` if `pos` is 0 (start-of-string sentinel).
 */
function charBefore(input: string, pos: number): string {
  return pos > 0 ? (input[pos - 1] ?? '') : '';
}

/**
 * Returns the single character immediately *after* the end of the match
 * (`pos + findLength`) in `input`, or `""` at end-of-string.
 */
function charAfter(input: string, pos: number, findLength: number): string {
  const idx = pos + findLength;
  return idx < input.length ? (input[idx] ?? '') : '';
}

// Unicode constants used by the auto-hasanta logic
const BENGALI_NUKTA = '়'; // ়  (nukta — combines with ড, ঢ, য to form ড়, ঢ়, য়)
const BENGALI_HASANTA = '্'; // ্  (virama / halant)

/**
 * Returns `true` if `str` ends in a bare Bangla consonant — i.e. a consonant
 * that has not yet been followed by a vowel sign or hasanta.
 *
 * Also handles the *decomposed* nukta forms that may appear during processing
 * before final NFC normalisation (e.g. ড + ় before it becomes ড়).
 */
function endsInBanglaConsonant(str: string): boolean {
  if (!str) return false;
  // `String.prototype.charAt` returns `string` (never undefined), so this is
  // typed cleanly under `noUncheckedIndexedAccess` without a non-null assertion.
  const last = str.charAt(str.length - 1);
  if (isBanglaConsonant(last)) return true;
  // Decomposed nukta: base-consonant (ড/ঢ/য) + ় → treat as consonant
  // ড (U+09A1), ঢ (U+09A2), য (U+09AF) are all in the main block, so
  // isBanglaConsonant already covers them as the second-to-last char.
  if (last === BENGALI_NUKTA && str.length >= 2) {
    return isBanglaConsonant(str.charAt(str.length - 2));
  }
  return false;
}

/**
 * Returns `true` if the replacement string starts with a Bangla consonant.
 * The first character of every consonant replacement is always the consonant
 * itself, so a simple check on index 0 is sufficient.
 */
function startsWithBanglaConsonant(str: string): boolean {
  if (!str) return false;
  return isBanglaConsonant(str.charAt(0));
}

/**
 * Tests a single {@link MatchCondition} against the input string at the
 * given cursor position.
 */
function testCondition(
  cond: MatchCondition,
  input: string,
  pos: number,
  findLength: number,
): boolean {
  const ch = cond.type === 'prefix' ? charBefore(input, pos) : charAfter(input, pos, findLength);

  let result: boolean;

  switch (cond.scope) {
    case 'vowel':
      result = isVowel(ch);
      break;
    case 'consonant':
      result = isConsonant(ch);
      break;
    case 'punctuation':
      result = isPunctuation(ch);
      break;
    case 'exact':
      result = ch === (cond.value ?? '');
      break;
    default: {
      // Exhaustiveness guard — TypeScript ensures this branch is unreachable
      /* v8 ignore next 3 */
      const _exhaustive: never = cond.scope;
      result = false;
      void _exhaustive;
    }
  }

  return cond.negative === true ? !result : result;
}

/**
 * Tries to match a single {@link PatternEntry} at cursor `pos` in `input`.
 *
 * Returns the Bangla replacement string if the pattern's `find` is present at
 * `pos` (and conditions are met), or `null` if it does not match.
 */
function tryPattern(entry: PatternEntry, input: string, pos: number): string | null {
  const { find, replace, rules } = entry;

  // Case-sensitive prefix check against the remaining input
  if (!input.startsWith(find, pos)) return null;

  // Evaluate conditional rules (first winner takes it)
  if (rules !== undefined && rules.length > 0) {
    for (const rule of rules) {
      const allMatch = rule.matches.every((cond) => testCondition(cond, input, pos, find.length));
      if (allMatch) return rule.replace;
    }
  }

  return replace;
}

// ── Phonetic core ────────────────────────────────────────────────────────────

/**
 * Runs the character-by-character Avro Phonetic engine on a string segment.
 *
 * Walks `segment` left-to-right, tries each pattern (longest first) at every
 * cursor position, and emits Bangla. The auto-hasanta logic for implicit
 * conjunct formation is scoped to a single call, so feeding the engine one
 * token at a time (as the public {@link parse} does) is safe — runs of
 * consonants never bleed across word boundaries.
 *
 * @internal
 */
function phoneticParse(segment: string, banglaDigits: boolean): string {
  let bangla = '';
  let pos = 0;

  while (pos < segment.length) {
    let matched = false;

    for (const entry of SORTED_PATTERNS) {
      const replacement = tryPattern(entry, segment, pos);

      if (replacement !== null) {
        // Resolve the effective replacement (respect banglaDigits option)
        const effective =
          !banglaDigits && /[০-৯]/u.test(replacement) ? (segment[pos] ?? '') : replacement;

        // ── Auto-hasanta ────────────────────────────────────────────────────
        // Real Avro Phonetic automatically forms a conjunct whenever two
        // consecutive consonants appear without an intervening vowel.  Explicit
        // cluster patterns (kr→ক্র, str→স্ত্র …) already embed hasanta in
        // their replacement, so they are unaffected.  This logic only fires for
        // combinations that are NOT covered by an explicit pattern — e.g.
        // 'Tr' (ট+র), 'Dr' (ড+র), 'bkr' (ব+ক্র), etc.
        if (endsInBanglaConsonant(bangla) && startsWithBanglaConsonant(effective)) {
          bangla += BENGALI_HASANTA;
        }

        bangla += effective;
        pos += entry.find.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Pass through any character that doesn't match a pattern
      bangla += segment[pos] ?? '';
      pos += 1;
    }
  }

  return bangla;
}

/**
 * Resolves the `dictionary` option into the dictionary to actually use, or
 * `null` to disable dictionary lookup entirely.
 *
 * @internal
 */
function resolveDictionary(option: ParseOptions['dictionary']): BanglishDictionary | null {
  if (option === false) return null;
  if (option === undefined || option === true) return BANGLISH_DICTIONARY;
  return option;
}

// Matches either a run of ASCII letters (a word token) or a run of anything
// else (whitespace / punctuation / digits). `g` flag drives the loop in parse.
const TOKEN_REGEX = /([A-Za-z]+)|([^A-Za-z]+)/gu;

/**
 * Looks up `key` in `dict` using `Object.hasOwn` so we never accidentally read
 * inherited properties like `__proto__`, `constructor`, or `toString`.
 * Returns the dictionary value or `null` if the key is not an own property
 * (or the value at that key is not a string).
 *
 * @internal
 */
function dictionaryLookup(dict: BanglishDictionary, key: string): string | null {
  if (!Object.hasOwn(dict, key)) return null;
  const value = dict[key];
  return typeof value === 'string' ? value : null;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Converts an English Avro Phonetic string to Bangla Unicode.
 *
 * The parser splits the input into runs of ASCII letters ("word tokens") and
 * non-letter runs. Each word token is first looked up in the
 * {@link ParseOptions.dictionary | dictionary} (case-insensitively); if found,
 * the canonical Bangla spelling is emitted. Otherwise — and for all
 * non-letter runs — the phonetic engine handles the conversion.
 *
 * @param input   - English transliteration string (e.g. `"amar sonar bangla"`)
 * @param options - Optional behaviour tweaks (see {@link ParseOptions})
 * @returns       A {@link ParseResult} with both `bangla` and `english` fields.
 *
 * @example
 * ```ts
 * import { parse } from '@subhesadek/avro-phonetic';
 *
 * const result = parse('ami banglay gan gai');
 * console.log(result.bangla); // আমি বাংলায় গান গাই
 *
 * // Dictionary handles canonical spellings the phonetic engine can't infer:
 * parse('hobe').bangla; // হবে (not হোবে)
 * ```
 */
export function parse(input: string, options: ParseOptions = {}): ParseResult {
  assertString(input);

  const { banglaDigits = true, banglaFullStop = true, dictionary } = options;

  if (input.length === 0) {
    return { bangla: '', english: input };
  }

  const dict = resolveDictionary(dictionary);
  let bangla = '';

  if (dict === null) {
    // Dictionary disabled — straight phonetic conversion of the whole input.
    bangla = phoneticParse(input, banglaDigits);
  } else {
    // Tokenise into alternating word / non-word runs. Each match is one or
    // the other, never both, so the loop concatenates the input verbatim
    // (no characters dropped or reordered).
    TOKEN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TOKEN_REGEX.exec(input)) !== null) {
      const word = match[1];
      const other = match[2];

      if (word !== undefined) {
        // `dictionaryLookup` returns `string | null`, so `??` short-circuits to
        // the phonetic fallback only when the word isn't in the dictionary.
        const hit = dictionaryLookup(dict, word.toLowerCase());
        bangla += hit ?? phoneticParse(word, banglaDigits);
      } else if (other !== undefined) {
        bangla += phoneticParse(other, banglaDigits);
      }
    }
  }

  // Post-process: replace Bangla daari (।) that was emitted for `.` but
  // should remain `.` when it's part of an ellipsis or floating-point number.
  // Also respect `banglaFullStop: false`.
  if (!banglaFullStop) {
    bangla = bangla.replace(/।/gu, '.');
  }

  // Strip implicit-অ markers (ZWNJ) emitted by the smart-O rule. They were
  // only there to prevent auto-hasanta from joining the surrounding
  // consonants; the user-facing string should not contain them.
  if (bangla.includes(IMPLICIT_A_MARKER)) {
    bangla = bangla.split(IMPLICIT_A_MARKER).join('');
  }

  // Normalise to NFC so that multi-codepoint characters like ড় (ড+়),
  // ঢ় (ঢ+়), য় (য+়) are always returned in their precomposed form.
  return { bangla: bangla.normalize('NFC'), english: input };
}

/**
 * Convenience wrapper that returns only the Bangla string.
 *
 * @param input   - English transliteration string
 * @param options - Optional behaviour tweaks (see {@link ParseOptions})
 * @returns Bangla Unicode string
 *
 * @example
 * ```ts
 * import { toBangla } from '@subhesadek/avro-phonetic';
 *
 * console.log(toBangla('khub bhalo')); // খুব ভালো
 * ```
 */
export function toBangla(input: string, options: ParseOptions = {}): string {
  return parse(input, options).bangla;
}

/**
 * Returns `true` if the provided string contains at least one Bangla Unicode
 * character (U+0980–U+09FF).
 *
 * Useful for detecting whether a string has already been converted.
 *
 * @param text - Any string
 */
export function isBangla(text: string): boolean {
  assertString(text);
  return /[ঀ-৿]/u.test(text);
}
