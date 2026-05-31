/**
 * Tests for the word-level Banglish → Bangla dictionary layer.
 *
 * The dictionary short-circuits the phonetic engine for known words so that
 * canonical Bangla spellings (e.g. হবে, আমি) are emitted instead of the
 * letter-by-letter phonetic rendering (হোবে, etc.).
 */

import { describe, expect, it } from 'vitest';
import { BANGLISH_DICTIONARY, parse, toBangla } from '../src/index.js';
import type { BanglishDictionary } from '../src/index.js';

const bn = (en: string, opts = {}): string => toBangla(en, opts).normalize('NFC');
const nfc = (s: string): string => s.normalize('NFC');

// ── Default dictionary behaviour ─────────────────────────────────────────────

describe('Default Banglish dictionary', () => {
  it('hobe → হবে (the canonical case, not হোবে)', () => {
    expect(bn('hobe')).toBe(nfc('হবে'));
  });

  it('ami → আমি (matches dictionary, not phonetic আমি anyway)', () => {
    expect(bn('ami')).toBe(nfc('আমি'));
  });

  it('korbo → করবো', () => {
    expect(bn('korbo')).toBe(nfc('করবো'));
  });

  it('dhonnobad → ধন্যবাদ', () => {
    expect(bn('dhonnobad')).toBe(nfc('ধন্যবাদ'));
  });

  // `jor` is mapped to জ্বর (fever) for the clinical use case. The raw engine
  // still produces জর (see avro.test.ts, dictionary disabled).
  it('jor → জ্বর (clinical override for fever)', () => {
    expect(bn('jor')).toBe(nfc('জ্বর'));
  });

  it('mon → মন (implicit অ)', () => {
    expect(bn('mon')).toBe(nfc('মন'));
  });

  it('bol → বল (implicit অ)', () => {
    expect(bn('bol')).toBe(nfc('বল'));
  });

  it('ghor → ঘর (implicit অ)', () => {
    expect(bn('ghor')).toBe(nfc('ঘর'));
  });

  // Counter-example: explicit ো-kaar is preserved by the dictionary when a
  // word genuinely has one (ঝোল = curry/gravy).
  it('jhol → ঝোল (dictionary-canonical, explicit ো-kaar)', () => {
    expect(bn('jhol')).toBe(nfc('ঝোল'));
  });

  // `to` is the particle "তো" (indeed) — without this dictionary entry the
  // smart-O engine rule would emit just `ত`. Locks in that the dictionary
  // wins over the engine heuristic.
  it('to → তো (dictionary overrides smart-O)', () => {
    expect(bn('to')).toBe(nfc('তো'));
  });

  it('tumi to jao → তুমি তো যাও (mixed dictionary words around `to`)', () => {
    expect(bn('tumi to jao')).toBe(nfc('তুমি তো যাও'));
  });

  it('preserves whitespace between dictionary words', () => {
    expect(bn('ami hobe')).toBe(nfc('আমি হবে'));
  });

  it('mixes dictionary words with phonetic words', () => {
    // 'xyzqq' is not in the dictionary → falls back to the phonetic engine.
    const result = bn('amar xyzqq');
    expect(result.startsWith(nfc('আমার'))).toBe(true);
    // The phonetic engine should still emit *something* Bangla — just not
    // truncated and not the English token verbatim.
    expect(result.length).toBeGreaterThan('আমার '.length);
  });

  it('dictionary applies to each word independently', () => {
    expect(bn('tumi ki acho')).toBe(nfc('তুমি কি আছো'));
  });
});

// ── Case insensitivity ──────────────────────────────────────────────────────

describe('Case-insensitive dictionary lookup', () => {
  it('Hobe (capitalised) → হবে', () => {
    expect(bn('Hobe')).toBe(nfc('হবে'));
  });

  it('HOBE (all caps) → হবে', () => {
    expect(bn('HOBE')).toBe(nfc('হবে'));
  });

  it('hObE (mixed case) → হবে', () => {
    expect(bn('hObE')).toBe(nfc('হবে'));
  });
});

// ── Punctuation handling ────────────────────────────────────────────────────

describe('Dictionary with surrounding punctuation', () => {
  it('"hobe?" splits cleanly into dictionary word + punctuation', () => {
    expect(bn('hobe?')).toBe(nfc('হবে?'));
  });

  it('"hobe." converts trailing . to । (daari) when banglaFullStop:true', () => {
    expect(bn('hobe.')).toBe(nfc('হবে।'));
  });

  it('comma between dictionary words is preserved', () => {
    expect(bn('ami, tumi')).toBe(nfc('আমি, তুমি'));
  });

  it('digits between letters split into separate tokens', () => {
    // 'ami2hobe' → 'ami' + '2' + 'hobe'
    expect(bn('ami2hobe')).toBe(nfc('আমি২হবে'));
  });
});

// ── Dictionary disabled (false) ─────────────────────────────────────────────

describe('dictionary:false disables the lookup', () => {
  it('falls back to pure phonetic conversion', () => {
    // Without the dictionary, "hobe" is phonetic:
    //   h → হ;  o → implicit অ (smart-O);  b → ব (no auto-hasanta because
    //   the ZWNJ marker sits between);  e → ে.  Result: হবে.
    expect(bn('hobe', { dictionary: false })).toBe(nfc('হবে'));
  });

  it('still applies phonetic rules and banglaDigits, banglaFullStop', () => {
    const result = toBangla('ami jai.', { dictionary: false });
    expect(result).toContain('।');
  });
});

// ── Custom dictionary ───────────────────────────────────────────────────────

describe('Custom dictionary option', () => {
  it('uses only the provided mapping when a plain object is passed', () => {
    const custom: BanglishDictionary = { foo: 'ফু' };
    expect(toBangla('foo', { dictionary: custom })).toBe(nfc('ফু'));
    // 'hobe' is no longer in the dictionary → falls back to phonetic (হবে
    // under the smart-O engine rule).
    expect(toBangla('hobe', { dictionary: custom }).normalize('NFC')).toBe(nfc('হবে'));
  });

  it('extends the default via spread', () => {
    // Use a made-up token so the test is self-contained and won't conflict
    // with future expansions of the default dictionary.
    const custom: BanglishDictionary = {
      ...BANGLISH_DICTIONARY,
      foobar: 'ফুবার',
    };
    const result = toBangla('amar foobar', { dictionary: custom }).normalize('NFC');
    expect(result).toBe(nfc('আমার ফুবার'));
  });

  it('overrides individual entries from the default', () => {
    const custom: BanglishDictionary = {
      ...BANGLISH_DICTIONARY,
      hobe: 'TESTOVERRIDE',
    };
    expect(toBangla('hobe', { dictionary: custom })).toBe('TESTOVERRIDE');
  });
});

// ── Security: prototype pollution resistance ────────────────────────────────

describe('Dictionary is prototype-pollution safe', () => {
  it('does not match inherited properties like __proto__', () => {
    // Even if someone tries to look up "__proto__" as a token, the parser
    // must not return Object.prototype — Object.hasOwn guards every lookup.
    // The phonetic engine should kick in instead.
    const result = bn('__proto__');
    // Phonetic engine would convert this somehow (underscores pass through);
    // the important thing is we don't crash and don't return [object Object].
    expect(result).not.toContain('[object');
    expect(typeof result).toBe('string');
  });

  it('does not match inherited "constructor" via the default dictionary', () => {
    // "constructor" is an inherited property of every plain object — if we
    // used a naive `dict[key]` lookup it would return Object's constructor.
    // The phonetic engine should run on this token instead.
    const result = bn('constructor');
    expect(typeof result).toBe('string');
    expect(result).not.toContain('function');
  });

  it('default dictionary is frozen at runtime', () => {
    // Mutating the default dictionary must not silently succeed —
    // Object.freeze ensures this throws in strict mode and is a no-op otherwise.
    expect(Object.isFrozen(BANGLISH_DICTIONARY)).toBe(true);
  });
});

// ── parse() interaction ─────────────────────────────────────────────────────

describe('parse() returns english unchanged and bangla with dictionary applied', () => {
  it('exposes both fields on the result', () => {
    const r = parse('hobe');
    expect(r.english).toBe('hobe');
    expect(r.bangla.normalize('NFC')).toBe(nfc('হবে'));
  });

  it('respects banglaDigits:false alongside the dictionary', () => {
    const r = parse('ami 5 ta', { banglaDigits: false });
    expect(r.bangla.normalize('NFC')).toContain('5');
    expect(r.bangla.normalize('NFC')).toContain(nfc('আমি'));
  });
});

// ── Regression fixtures ──────────────────────────────────────────────────────
// Table of real-world inputs that previously produced wrong output. Each entry
// guards a specific fix so future changes to the engine or dictionary can't
// silently regress them. Add a row here whenever a user reports a bad word.

describe('Conversion regression fixtures', () => {
  const cases: ReadonlyArray<[input: string, expected: string]> = [
    // Engine bug fixes
    ['Pakhi', 'পাখি'], // capitalised dictionary word (case-insensitive lookup)
    ['Prothom', 'প্রথম'], // uppercase fallback — no raw Latin leak (was "Pাখি"-style)
    ['chhobi', 'ছবি'], // lowercase chh → ছ (was চ্হবি)
    // Inherent-অ between consonants (was এক্দিন এক্বার)
    ['ekdin ekbar', 'একদিন একবার'],
    // অ-initial words (engine would emit ও)
    ['onek', 'অনেক'],
    ['onno', 'অন্য'],
    ['ortho', 'অর্থ'],
    ['ekhono', 'এখনো'],
    // Sibilant / retroflex disambiguation
    ['thik', 'ঠিক'],
    ['kichu', 'কিছু'],
    ['shob', 'সব'],
    ['sotti', 'সত্যি'],
    ['jonogon', 'জনগণ'],
    // ো-kaar / vowel-length words from the reported sample
    ['bhorer', 'ভোরের'],
    ['alo', 'আলো'],
    ['prithibi', 'পৃথিবী'],
    ['othe', 'ওঠে'],
    ['dak', 'ডাক'],
    ['shobuj', 'সবুজ'],
    ['shomvob', 'সম্ভব'],
    // A full phrase of dictionary words
    ['bhorer alo onek shundor', 'ভোরের আলো অনেক সুন্দর'],
    // Clinical vocabulary (dose / duration / instruction / comment)
    ['tablet', 'ট্যাবলেট'],
    ['capsule', 'ক্যাপসুল'],
    ['oshudh', 'ওষুধ'],
    ['khalipete', 'খালিপেটে'],
    ['bishram', 'বিশ্রাম'],
    ['proyojone', 'প্রয়োজনে'],
    // Prescription-style phrases composed from dictionary words
    ['khabarer por ekta tablet', 'খাবারের পর একটা ট্যাবলেট'],
    ['din e tin bar', 'দিন এ তিন বার'],
    ['khaben', 'খাবেন'],
  ];

  it.each(cases)('%s → %s', (input, expected) => {
    expect(bn(input)).toBe(nfc(expected));
  });
});
