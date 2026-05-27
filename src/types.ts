/**
 * Scope types used in pattern rule matching.
 *
 * - `vowel`       – the character at the check position is an English vowel (a, e, i, o, u)
 * - `consonant`   – the character is an English consonant letter
 * - `punctuation` – the character is non-alphabetic (space, digit, symbol, or start/end of string)
 * - `exact`       – the surrounding text matches a specific string value
 */
export type Scope = 'vowel' | 'consonant' | 'punctuation' | 'exact';

/**
 * Direction of a rule match condition.
 *
 * - `prefix` – check characters *before* the current match position
 * - `suffix` – check characters *after* the current match position
 */
export type MatchType = 'prefix' | 'suffix';

/**
 * A single match condition for a pattern rule.
 */
export interface MatchCondition {
  /** Which direction to check (before or after the matched text). */
  type: MatchType;
  /** What the character(s) at that position should (or should not) be. */
  scope: Scope;
  /**
   * Used only when `scope` is `'exact'`.
   * The literal string that must appear at that position.
   */
  value?: string;
  /**
   * When `true`, the condition is negated — it passes only if the scope does NOT match.
   * @default false
   */
  negative?: boolean;
}

/**
 * A conditional rule inside a pattern entry.
 * When all `matches` conditions are satisfied the rule's `replace` is emitted
 * instead of the pattern's default replacement.
 */
export interface PatternRule {
  /** All conditions that must pass simultaneously. */
  matches: MatchCondition[];
  /** The Bangla string to emit when this rule fires. */
  replace: string;
}

/**
 * A single Avro Phonetic pattern entry.
 */
export interface PatternEntry {
  /**
   * The English key sequence to look for (case-sensitive in the matcher).
   * Patterns are tried longest-first at every cursor position.
   */
  find: string;
  /** Default Bangla output when no conditional rule matches. */
  replace: string;
  /** Optional ordered list of conditional rules (checked before the default). */
  rules?: PatternRule[];
}

/**
 * Options for the {@link parse} function.
 */
export interface ParseOptions {
  /**
   * When `true`, Bangla digits (০–৯) are used instead of ASCII digits (0–9).
   * @default true
   */
  banglaDigits?: boolean;

  /**
   * When `true`, the Bangla sentence-ending punctuation `।` (daari) is used
   * in place of a literal full stop `.` that is followed by whitespace or
   * end-of-string.
   * @default true
   */
  banglaFullStop?: boolean;
}

/**
 * The result produced by {@link parse}.
 */
export interface ParseResult {
  /** The converted Bangla Unicode string. */
  bangla: string;
  /** The original English input string (unchanged). */
  english: string;
}
