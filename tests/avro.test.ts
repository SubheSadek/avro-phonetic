/**
 * @subhesadek/avro-phonetic — unit & integration tests
 *
 * Test cases are derived from the Avro Phonetic specification and the
 * jsAvroPhonetic reference implementation.
 */

import { describe, expect, it } from 'vitest';
import { isBangla, parse, toBangla } from '../src/index.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert and return NFC-normalised Bangla.
 * NFC ensures ড় (ড+়), য় (য+়) etc. are always precomposed, regardless of
 * how the expected strings were typed in this file.
 */
const bn = (en: string, opts = {}): string => toBangla(en, opts).normalize('NFC');

/** NFC-normalise an expected string from this file (handles any source encoding). */
const nfc = (s: string): string => s.normalize('NFC');

// ── parse() ──────────────────────────────────────────────────────────────────

describe('parse()', () => {
  it('returns an object with bangla and english fields', () => {
    const result = parse('ami');
    expect(result).toHaveProperty('bangla');
    expect(result).toHaveProperty('english');
    expect(result.english).toBe('ami');
  });

  it('handles empty string', () => {
    const result = parse('');
    expect(result.bangla).toBe('');
    expect(result.english).toBe('');
  });

  it('throws TypeError when input is not a string', () => {
    // @ts-expect-error — intentional type violation for runtime test
    expect(() => parse(42)).toThrow(TypeError);
    // @ts-expect-error
    expect(() => parse(null)).toThrow(TypeError);
    // @ts-expect-error
    expect(() => parse(undefined)).toThrow(TypeError);
  });
});

// ── Vowels ───────────────────────────────────────────────────────────────────

describe('Vowels — independent form (start of word / after vowel / after punctuation)', () => {
  it('a → আ', () => expect(bn('a')).toBe('আ'));
  it('aa → আ', () => expect(bn('aa')).toBe('আ'));
  it('i → ই', () => expect(bn('i')).toBe('ই'));
  it('ee → ঈ', () => expect(bn('ee')).toBe('ঈ'));
  it('ii → ঈ', () => expect(bn('ii')).toBe('ঈ'));
  it('u → উ', () => expect(bn('u')).toBe('উ'));
  it('uu → ঊ', () => expect(bn('uu')).toBe('ঊ'));
  it('e → এ', () => expect(bn('e')).toBe('এ'));
  it('oi → ঐ', () => expect(bn('oi')).toBe('ঐ'));
  it('o → ও', () => expect(bn('o')).toBe('ও'));
  it('ou → ঔ', () => expect(bn('ou')).toBe('ঔ'));
  it('rri → ঋ', () => expect(bn('rri')).toBe('ঋ'));
});

describe('Vowels — dependent/matra form (after consonant)', () => {
  it('ka → কা', () => expect(bn('ka')).toBe('কা'));
  it('ki → কি', () => expect(bn('ki')).toBe('কি'));
  it('ku → কু', () => expect(bn('ku')).toBe('কু'));
  it('ke → কে', () => expect(bn('ke')).toBe('কে')); // ক + ে (e-kaar U+09C7)

  // Smart-O: `o` after a consonant is the inherent অ (silent), matching how
  // people actually type Banglish. ZWNJ is emitted internally to prevent
  // auto-hasanta from joining the surrounding consonants, then stripped.
  it('ko → ক (smart-O at word end)', () => expect(bn('ko')).toBe('ক'));
  it('bo → ব (smart-O at word end)', () => expect(bn('bo')).toBe('ব'));
  it('mo → ম (smart-O at word end)', () => expect(bn('mo')).toBe('ম'));
  it('jo → জ (smart-O at word end)', () => expect(bn('jo')).toBe('জ'));
  it('ko ami → ক আমি (smart-O fires before whitespace)', () =>
    expect(bn('ko ami')).toBe(nfc('ক আমি')));
  it('kob → কব (smart-O mid-word, no auto-hasanta between ক and ব)', () =>
    expect(bn('kob')).toBe(nfc('কব')));
  it('bosen → বসেন (mid-word smart-O preserves syllable break)', () =>
    expect(bn('bosen')).toBe(nfc('বসেন')));
  it('kor → কর (smart-O mid-word)', () => expect(bn('kor')).toBe(nfc('কর')));
  it('bostro → বস্ত্র (smart-O does not block the str cluster)', () =>
    expect(bn('bostro')).toBe(nfc('বস্ত্র')));

  it('kii → কী', () => expect(bn('kii')).toBe('কী'));
  it('kuu → কূ', () => expect(bn('kuu')).toBe('কূ'));
  it('koi → কৈ', () => expect(bn('koi')).toBe('কৈ'));
  it('kou → কৌ', () => expect(bn('kou')).toBe('কৌ'));
  it('krri → কৃ', () => expect(bn('krri')).toBe('কৃ'));
});

// ── Basic consonants ─────────────────────────────────────────────────────────

describe('Single consonants', () => {
  const cases: Array<[string, string]> = [
    ['k', 'ক'],
    ['kh', 'খ'],
    ['g', 'গ'],
    ['gh', 'ঘ'],
    ['ch', 'চ'],
    ['Ch', 'ছ'],
    ['j', 'জ'],
    ['jh', 'ঝ'],
    ['T', 'ট'],
    ['Th', 'ঠ'],
    ['D', 'ড'],
    ['Dh', 'ঢ'],
    ['N', 'ণ'],
    ['t', 'ত'],
    ['th', 'থ'],
    ['d', 'দ'],
    ['dh', 'ধ'],
    ['n', 'ন'],
    ['p', 'প'],
    ['ph', 'ফ'],
    ['b', 'ব'],
    ['bh', 'ভ'],
    ['m', 'ম'],
    ['z', 'য'],
    ['r', 'র'],
    ['l', 'ল'],
    ['sh', 'শ'],
    ['Sh', 'ষ'],
    ['s', 'স'],
    ['h', 'হ'],
    ['R', 'ড়'],
    ['Rh', 'ঢ়'],
    ['y', 'য়'],
    ['f', 'ফ'],
    ['v', 'ভ'],
  ];

  it.each(cases)('%s → %s', (input, expected) => {
    // nfc() normalises the expected string so the comparison is encoding-agnostic
    // (e.g. ড় may be stored as U+09DC or as ড+়  depending on the text editor).
    expect(bn(input)).toBe(nfc(expected));
  });
});

// ── Consonant conjuncts ───────────────────────────────────────────────────────

describe('Conjunct consonants — explicit cluster patterns', () => {
  it('kta → ক্তা', () => expect(bn('kta')).toBe('ক্তা'));
  it('kSh → ক্ষ', () => expect(bn('kSh')).toBe('ক্ষ'));
  it('bhl → ভ্ল', () => expect(bn('bhl')).toBe('ভ্ল'));
  it('shr → শ্র', () => expect(bn('shr')).toBe('শ্র'));
  it('skr → স্ক্র', () => expect(bn('skr')).toBe('স্ক্র'));
  it('str → স্ত্র', () => expect(bn('str')).toBe('স্ত্র'));
  it('khr → খ্র', () => expect(bn('khr')).toBe('খ্র'));
  it('ghr → ঘ্র', () => expect(bn('ghr')).toBe('ঘ্র'));
  it('bhr → ভ্র', () => expect(bn('bhr')).toBe('ভ্র'));
  it('phr → ফ্র', () => expect(bn('phr')).toBe('ফ্র'));
  it('thr → থ্র', () => expect(bn('thr')).toBe('থ্র'));
  it('dhr → ধ্র', () => expect(bn('dhr')).toBe('ধ্র'));
});

// ── Auto-hasanta (implicit conjunct formation) ────────────────────────────────
// When two consecutive consonants appear without an intervening vowel and there
// is no explicit cluster pattern for that pair, the parser inserts ্ (hasanta)
// automatically — matching the behaviour of the real Avro Phonetic keyboard.

describe('Auto-hasanta — implicit conjunct formation', () => {
  // Uppercase retroflex consonants + ra (no explicit 'Tr'/'Dr'/'Nr' patterns)
  it('Tr → ট্র', () => expect(bn('Tr')).toBe(nfc('ট্র')));
  it('Dr → ড্র', () => expect(bn('Dr')).toBe(nfc('ড্র')));
  it('Nr → ণ্র', () => expect(bn('Nr')).toBe(nfc('ণ্র')));

  // Uppercase + la
  it('Tl → ট্ল', () => expect(bn('Tl')).toBe(nfc('ট্ল')));
  it('Dl → ড্ল', () => expect(bn('Dl')).toBe(nfc('ড্ল')));

  // h-clusters (হ + consonant)
  it('hr → হ্র', () => expect(bn('hr')).toBe(nfc('হ্র')));
  it('hl → হ্ল', () => expect(bn('hl')).toBe(nfc('হ্ল')));
  it('hm → হ্ম', () => expect(bn('hm')).toBe(nfc('হ্ম')));
  it('hn → হ্ন', () => expect(bn('hn')).toBe(nfc('হ্ন')));

  // Multi-consonant chain: auto-hasanta fires for each consecutive consonant
  it('bkr → ব্ক্র (three-consonant conjunct)', () => expect(bn('bkr')).toBe(nfc('ব্ক্র')));
  it('bkra → ব্ক্রা', () => expect(bn('bkra')).toBe(nfc('ব্ক্রা')));

  // Explicit cluster patterns are unaffected — no double hasanta
  it('kr → ক্র (explicit pattern, no double hasanta)', () => expect(bn('kr')).toBe(nfc('ক্র')));
  it('kra → ক্রা', () => expect(bn('kra')).toBe(nfc('ক্রা')));

  // Smart-O breaks the would-be conjunct (no ো-kaar emitted, but no
  // hasanta either — the ZWNJ marker keeps ক/জ separate from the next
  // consonant). Dictionary disabled to test the pure engine.
  it('jor → জর (phonetic engine: smart-O, no conjunct)', () =>
    expect(toBangla('jor', { dictionary: false }).normalize('NFC')).toBe(nfc('জর')));
  // `tora` (lowercase) lives in the default dictionary as তোরা (2nd person
  // informal plural), and dictionary lookup is case-insensitive — so the
  // uppercase `T` doesn't escape it. Disable the dictionary to test the
  // pure phonetic engine here.
  it('Tora → টরা (T + implicit-অ + r + a-kaar, no conjunct)', () =>
    expect(toBangla('Tora', { dictionary: false }).normalize('NFC')).toBe(nfc('টরা')));

  // Conjunct followed by vowel
  it('Tra → ট্রা', () => expect(bn('Tra')).toBe(nfc('ট্রা')));
  it('Dra → ড্রা', () => expect(bn('Dra')).toBe(nfc('ড্রা')));
});

// ── Special mappings ─────────────────────────────────────────────────────────

describe('Special characters', () => {
  it('ng before consonant → ং (anusvara)', () => expect(bn('bang')).toContain('ং'));
  it('ng before vowel → ঙ্গ (conjunct)', () => expect(bn('anga')).toContain('ঙ্গ'));
  it('^^ → ্ (hasanta)', () => expect(bn('k^^t')).toContain('্'));
  it(': → ঃ (bisarga)', () => expect(bn('duhkha:')).toContain('ঃ'));
  it('. → । (daari)', () => expect(bn('ami jai.')).toContain('।'));
  it('. stays . before another .', () => expect(bn('ami...')).not.toContain('।।'));
});

// ── Digit conversion ─────────────────────────────────────────────────────────

describe('Digit conversion', () => {
  it('converts 0-9 to ০-৯ by default', () => {
    expect(bn('1234567890')).toBe('১২৩৪৫৬৭৮৯০');
  });

  it('keeps ASCII digits when banglaDigits:false', () => {
    expect(bn('5', { banglaDigits: false })).toBe('5');
  });
});

// ── Full sentences ────────────────────────────────────────────────────────────

describe('Full sentence conversion', () => {
  it('ami banglay gan gai → আমি বাংলায় গান গাই', () => {
    // nfc() on the expected value handles the য় encoding difference
    expect(bn('ami banglay gan gai')).toBe(nfc('আমি বাংলায় গান গাই'));
  });

  it('amar sonar bangla → আমার সোনার বাংলা', () => {
    expect(bn('amar sonar bangla')).toBe(nfc('আমার সোনার বাংলা'));
  });

  it('khub bhalo → খুব ভালো', () => {
    expect(bn('khub bhalo')).toBe(nfc('খুব ভালো'));
  });

  it('apni ki khaichen?', () => {
    // With the default Banglish dictionary in place, "apni" → আপনি (the
    // canonical word for "you" formal) — the dictionary is the correction
    // layer the README/CHANGELOG referenced as future work.
    //
    // "khaichen" is NOT in the dictionary, so the phonetic engine still runs
    //   ch → চ    (to get ছ the user must type "Ch" or "chh")
    // — that's still correct algorithmic behaviour for unknown words.
    const result = bn('apni ki khaichen?');
    expect(result).toContain(nfc('আপনি'));
    expect(result).toContain(nfc('কি'));
    expect(result).toContain('?');
  });

  it('apni ki khaichen? — with dictionary disabled falls back to phonetic conjuncts', () => {
    // Sanity check: when the dictionary is off, "apni" → আপ্নি (pn→প্ন).
    const result = toBangla('apni ki khaichen?', { dictionary: false }).normalize('NFC');
    expect(result).toContain(nfc('আপ্নি'));
  });

  it('handles whitespace correctly', () => {
    const result = bn('a b c');
    // spaces are passed through unchanged
    expect(result.includes(' ')).toBe(true);
  });
});

// ── isBangla() ────────────────────────────────────────────────────────────────

describe('isBangla()', () => {
  it('returns true for Bangla strings', () => {
    expect(isBangla('আমি')).toBe(true);
    expect(isBangla('ক')).toBe(true);
    expect(isBangla('বাংলা')).toBe(true);
  });

  it('returns false for English strings', () => {
    expect(isBangla('ami')).toBe(false);
    expect(isBangla('hello')).toBe(false);
    expect(isBangla('')).toBe(false);
  });

  it('returns true for mixed strings containing Bangla', () => {
    expect(isBangla('ami আমি')).toBe(true);
  });

  it('throws TypeError for non-strings', () => {
    // @ts-expect-error
    expect(() => isBangla(42)).toThrow(TypeError);
  });
});

// ── ParseOptions ─────────────────────────────────────────────────────────────

describe('ParseOptions', () => {
  it('banglaFullStop:false keeps ASCII .', () => {
    const result = toBangla('ami jai.', { banglaFullStop: false });
    expect(result).toContain('.');
    expect(result).not.toContain('।');
  });

  it('banglaFullStop:true (default) converts . to ।', () => {
    const result = toBangla('ami jai.');
    expect(result).toContain('।');
  });

  it('banglaDigits defaults to true', () => {
    expect(toBangla('1')).toBe('১');
  });

  it('banglaDigits:false keeps Arabic numerals', () => {
    expect(toBangla('1', { banglaDigits: false })).toBe('1');
  });
});

// ── 'x' pattern — scope: 'punctuation' condition ─────────────────────────────
// The 'x' pattern is the only one with a `scope: 'punctuation'` rule condition.
// These two cases together cover:
//   • avro.ts  — the `case 'punctuation':` branch in testCondition()
//   • utils.ts — the short-circuit branch of `!isVowel(ch) && !isConsonant(ch)`
//                when ch IS a vowel (isPunctuation returns false early)

describe("'x' pattern (punctuation-scope condition)", () => {
  it('x at start of word → এক্স (punctuation prefix rule fires)', () => {
    // charBefore is "" (start-of-string sentinel), isPunctuation("") === true
    // → the prefix-punctuation rule fires → replace = এ + ক্স
    expect(bn('x')).toBe(nfc('এক্স'));
  });

  it('x after a vowel → ক্স only (punctuation prefix rule does NOT fire)', () => {
    // charBefore is 'a' (a vowel), isPunctuation('a') === false (short-circuit)
    // → rule condition fails → falls through to default replace = ক্স
    expect(bn('ax')).toBe(nfc('আক্স'));
  });
});

// ── Uppercase / alternative inputs ───────────────────────────────────────────

describe('Uppercase and alternative consonant inputs', () => {
  it('I → ঈ (capital I = long i)', () => expect(bn('I')).toBe('ঈ'));
  it('U → ঊ (capital U = long u)', () => expect(bn('U')).toBe('ঊ'));
  it('S → শ', () => expect(bn('S')).toBe('শ'));
  it('q → ক', () => expect(bn('q')).toBe('ক'));
  it('f → ফ', () => expect(bn('f')).toBe('ফ'));
  it('v → ভ', () => expect(bn('v')).toBe('ভ'));
});
