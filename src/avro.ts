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

import { SORTED_PATTERNS } from './patterns.js';
import type { MatchCondition, ParseOptions, ParseResult, PatternEntry } from './types.js';
import { assertString, isConsonant, isPunctuation, isVowel } from './utils.js';

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

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Converts an English Avro Phonetic string to Bangla Unicode.
 *
 * @param input   - English transliteration string (e.g. `"amar sonar bangla"`)
 * @param options - Optional behaviour tweaks (see {@link ParseOptions})
 * @returns       A {@link ParseResult} with both `bangla` and `english` fields.
 *
 * @example
 * ```ts
 * import { parse } from 'avro-phonetic';
 *
 * const result = parse('ami banglay gan gai');
 * console.log(result.bangla); // আমি বাংলায় গান গাই
 * ```
 */
export function parse(input: string, options: ParseOptions = {}): ParseResult {
  assertString(input);

  const { banglaDigits = true, banglaFullStop = true } = options;

  if (input.length === 0) {
    return { bangla: '', english: input };
  }

  let bangla = '';
  let pos = 0;

  while (pos < input.length) {
    let matched = false;

    for (const entry of SORTED_PATTERNS) {
      const replacement = tryPattern(entry, input, pos);

      if (replacement !== null) {
        // Post-process digit replacement if caller opted out
        if (!banglaDigits && /[০-৯]/u.test(replacement)) {
          bangla += input[pos];
        } else {
          bangla += replacement;
        }

        pos += entry.find.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Pass through any character that doesn't match a pattern
      bangla += input[pos] ?? '';
      pos += 1;
    }
  }

  // Post-process: replace Bangla daari (।) that was emitted for `.` but
  // should remain `.` when it's part of an ellipsis or floating-point number.
  // Also respect `banglaFullStop: false`.
  if (!banglaFullStop) {
    bangla = bangla.replace(/।/gu, '.');
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
 * import { toBangla } from 'avro-phonetic';
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
