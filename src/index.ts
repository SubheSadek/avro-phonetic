/**
 * avro-phonetic
 *
 * A TypeScript/JavaScript implementation of the Avro Phonetic keyboard layout.
 * Converts English transliteration to Bangla (Bengali) Unicode text.
 *
 * @packageDocumentation
 *
 * @example Basic usage
 * ```ts
 * import { parse, toBangla, isBangla } from '@subhesadek/avro-phonetic';
 *
 * // Full result object
 * const result = parse('ami banglay gan gai');
 * console.log(result.bangla);  // আমি বাংলায় গান গাই
 * console.log(result.english); // ami banglay gan gai
 *
 * // Shorthand — Bangla string only
 * console.log(toBangla('khub bhalo')); // খুব ভালো
 *
 * // Detection helper
 * console.log(isBangla('আমি')); // true
 * console.log(isBangla('ami'));  // false
 * ```
 *
 * @example With options
 * ```ts
 * import { toBangla } from '@subhesadek/avro-phonetic';
 *
 * // Keep ASCII digits instead of Bangla digits
 * toBangla('amar 3ti boi', { banglaDigits: false });
 * // → 'আমার 3টি বই'
 *
 * // Keep the ASCII full stop instead of converting to daari (।)
 * toBangla('ami jai.', { banglaFullStop: false });
 * // → 'আমি যাই.'
 * ```
 */

export { isBangla, parse, toBangla } from './avro.js';
export { PATTERNS, SORTED_PATTERNS } from './patterns.js';
export type {
  MatchCondition,
  MatchType,
  ParseOptions,
  ParseResult,
  PatternEntry,
  PatternRule,
  Scope,
} from './types.js';
