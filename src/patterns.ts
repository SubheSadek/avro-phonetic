/**
 * Avro Phonetic pattern data.
 *
 * Based on the Avro Keyboard phonetic layout by OmicronLab
 * (https://www.omicronlab.com/avro-keyboard.html) and the original
 * jsAvroPhonetic implementation by Rifat Nabi
 * (https://github.com/torifat/jsAvroPhonetic).
 *
 * Patterns are sorted by `find` length (descending) so that the greedy
 * matcher always tries longer sequences first.
 *
 * Rule evaluation order inside each entry:
 *  1. Try each `rule` (in array order); the first matching rule wins.
 *  2. If no rule matches (or there are no rules), emit the entry's `replace`.
 *
 * Scope semantics (checked against the *English* input character):
 *  - `vowel`       – character is a, e, i, o, u (any case)
 *  - `consonant`   – character is a Latin letter that is not a vowel
 *  - `punctuation` – character is non-alphabetic OR is the start/end sentinel ("")
 *  - `exact`       – character(s) match the literal `value` string
 */

import type { PatternEntry } from './types.js';

// ── Bangla Unicode constants ─────────────────────────────────────────────────
// Independent vowel letters
const B = {
  // Vowels (independent / স্বরবর্ণ)
  A: 'আ', // আ
  I: 'ই', // ই
  II: 'ঈ', // ঈ
  U: 'উ', // উ
  UU: 'ঊ', // ঊ
  RRI: 'ঋ', // ঋ
  E: 'এ', // এ
  OI: 'ঐ', // ঐ
  O: 'ও', // ও
  OU: 'ঔ', // ঔ

  // Vowel signs (dependent / কার)
  AA_KAR: 'া', // া  U+09BE
  I_KAR: 'ি', // ি  U+09BF
  II_KAR: 'ী', // ী  U+09C0
  U_KAR: 'ু', // ু  U+09C1
  UU_KAR: 'ূ', // ূ  U+09C2
  RRI_KAR: 'ৃ', // ৃ  U+09C3
  E_KAR: 'ে', // ে  U+09CB — e-kaar (used after consonant for /e/ sound)
  OI_KAR: 'ৈ', // ৈ  U+09C8
  O_KAR: 'ো', // ো  U+09CB — o-kaar (= ে + া)
  OU_KAR: 'ৌ', // ৌ  U+09CC
  E_MATRA: 'ে', // ে  U+09CB — alias for E_KAR

  // Consonants
  K: 'ক', // ক
  KH: 'খ', // খ
  G: 'গ', // গ
  GH: 'ঘ', // ঘ
  NG_LETTER: 'ঙ', // ঙ
  CH: 'চ', // চ
  CHH: 'ছ', // ছ
  J: 'জ', // জ
  JH: 'ঝ', // ঝ
  NYA: 'ঞ', // ঞ
  TT: 'ট', // ট
  TTH: 'ঠ', // ঠ
  DD: 'ড', // ড
  DDH: 'ঢ', // ঢ
  NN: 'ণ', // ণ
  T: 'ত', // ত
  TH: 'থ', // থ
  D: 'দ', // দ
  DH: 'ধ', // ধ
  N: 'ন', // ন
  P: 'প', // প
  PH: 'ফ', // ফ
  B: 'ব', // ব
  BH: 'ভ', // ভ
  M: 'ম', // ম
  Z: 'য', // য
  R: 'র', // র
  L: 'ল', // ল
  SH: 'শ', // শ
  SSH: 'ষ', // ষ
  S: 'স', // স
  H: 'হ', // হ
  RR: 'ড়', // ড়
  RRH: 'ঢ়', // ঢ়
  Y: 'য়', // য়
  KSH: 'ক্ষ', // ক্ষ
  GNG: 'জ্ঞ', // জ্ঞ

  // Special
  HASANTA: '্', // ্ (virama/halant)
  ANUSVAR: 'ং', // ং
  BISARGA: 'ঃ', // ঃ
  CHANDRABINDU: 'ঁ', // ঁ
  DAARI: '।', // ।

  // Bangla digits
  D0: '০', // ০
  D1: '১', // ১
  D2: '২', // ২
  D3: '৩', // ৩
  D4: '৪', // ৪
  D5: '৫', // ৫
  D6: '৬', // ৬
  D7: '৭', // ৭
  D8: '৮', // ৮
  D9: '৯', // ৯
} as const;

// Shorthand helpers
const H = B.HASANTA; // ্

/** Builds a consonant cluster string: left + hasanta + right */
function conj(left: string, right: string): string {
  return `${left}${H}${right}`;
}

// ── Vowel rule helpers ───────────────────────────────────────────────────────
/**
 * Creates a standard vowel pattern entry.
 * - After a consonant in the input → use the dependent vowel sign (matra/kaar).
 * - Otherwise (start of word, after another vowel, after punctuation) → use
 *   the independent vowel letter.
 */
function vowelEntry(find: string, independent: string, dependent: string): PatternEntry {
  return {
    find,
    replace: independent,
    rules: [
      {
        matches: [{ type: 'prefix', scope: 'consonant' }],
        replace: dependent,
      },
    ],
  };
}

// ── Pattern table ────────────────────────────────────────────────────────────
// Sorted longest → shortest. Within the same length, more specific patterns
// should come before more general ones so that rules are not shadowed.

export const PATTERNS: readonly PatternEntry[] = [
  // ── 4-char sequences ──────────────────────────────────────────────────────
  // kSh + vowel combos
  { find: 'kkha', replace: conj(B.K, B.KH) + B.AA_KAR, rules: [] },
  { find: 'kSha', replace: B.KSH + B.AA_KAR, rules: [] },
  { find: 'kShi', replace: B.KSH + B.I_KAR, rules: [] },
  { find: 'kShu', replace: B.KSH + B.U_KAR, rules: [] },
  { find: 'kShe', replace: B.KSH + B.E_MATRA, rules: [] },
  { find: 'kSho', replace: B.KSH + B.O_KAR, rules: [] },
  { find: 'rrai', replace: B.RRI, rules: [] },
  { find: 'rrhi', replace: B.RRI, rules: [] },

  // [consonant]rri → consonant + ৃ (rri-kaar / vocalic-R sign)
  // These MUST come before the 2-char kr/gr/pr/etc. cluster patterns so that
  // "krri" is consumed as a 4-char unit (কৃ) rather than "kr"(ক্র) + "ri"(রি).
  { find: 'krri', replace: B.K + B.RRI_KAR, rules: [] },
  { find: 'grri', replace: B.G + B.RRI_KAR, rules: [] },
  { find: 'trri', replace: B.T + B.RRI_KAR, rules: [] },
  { find: 'drri', replace: B.D + B.RRI_KAR, rules: [] },
  { find: 'nrri', replace: B.N + B.RRI_KAR, rules: [] },
  { find: 'prri', replace: B.P + B.RRI_KAR, rules: [] },
  { find: 'brri', replace: B.B + B.RRI_KAR, rules: [] },
  { find: 'mrri', replace: B.M + B.RRI_KAR, rules: [] },
  { find: 'hrri', replace: B.H + B.RRI_KAR, rules: [] },
  { find: 'lrri', replace: B.L + B.RRI_KAR, rules: [] },
  { find: 'zrri', replace: B.Z + B.RRI_KAR, rules: [] },
  { find: 'srri', replace: B.S + B.RRI_KAR, rules: [] },

  // ── 3-char sequences ──────────────────────────────────────────────────────
  // Vowels
  vowelEntry('rri', B.RRI, B.RRI_KAR),
  vowelEntry('oou', B.UU, B.UU_KAR),

  // Consonant clusters (3-char)
  { find: 'kSh', replace: B.KSH, rules: [] },
  { find: 'ksh', replace: B.KSH, rules: [] },
  { find: 'GNG', replace: B.GNG, rules: [] },
  { find: 'jNG', replace: B.GNG, rules: [] },
  { find: 'bhl', replace: conj(B.BH, B.L), rules: [] },
  { find: 'phl', replace: conj(B.PH, B.L), rules: [] },
  { find: 'shr', replace: conj(B.SH, B.R), rules: [] },
  { find: 'skr', replace: conj(B.S, conj(B.K, B.R)), rules: [] },
  { find: 'spr', replace: conj(B.S, conj(B.P, B.R)), rules: [] },
  { find: 'str', replace: conj(B.S, conj(B.T, B.R)), rules: [] },
  { find: 'sth', replace: conj(B.S, B.TH), rules: [] },
  { find: 'skl', replace: conj(B.S, conj(B.K, B.L)), rules: [] },
  { find: 'spl', replace: conj(B.S, conj(B.P, B.L)), rules: [] },
  { find: 'Shr', replace: conj(B.SH, B.R), rules: [] },
  { find: 'Ngr', replace: conj(B.NG_LETTER, B.R), rules: [] },
  { find: 'ndr', replace: conj(B.N, conj(B.D, B.R)), rules: [] },
  { find: 'ntr', replace: conj(B.N, conj(B.T, B.R)), rules: [] },
  { find: 'mpr', replace: conj(B.M, conj(B.P, B.R)), rules: [] },
  { find: 'thr', replace: conj(B.TH, B.R), rules: [] },
  { find: 'dhr', replace: conj(B.DH, B.R), rules: [] },
  { find: 'khr', replace: conj(B.KH, B.R), rules: [] },
  { find: 'ghr', replace: conj(B.GH, B.R), rules: [] },
  { find: 'bhr', replace: conj(B.BH, B.R), rules: [] },
  { find: 'phr', replace: conj(B.PH, B.R), rules: [] },
  { find: 'mhr', replace: conj(B.M, B.R), rules: [] },
  { find: 'lhr', replace: conj(B.L, B.R), rules: [] },
  { find: 'Thr', replace: conj(B.TTH, B.R), rules: [] },
  { find: 'Dhr', replace: conj(B.DDH, B.R), rules: [] },
  { find: 'NGr', replace: conj(B.NYA, B.R), rules: [] },
  { find: 'ngh', replace: conj(B.N, B.GH), rules: [] },
  { find: 'nkh', replace: conj(B.N, B.KH), rules: [] },
  { find: 'nth', replace: conj(B.N, B.TH), rules: [] },
  { find: 'ndh', replace: conj(B.N, B.DH), rules: [] },
  { find: 'nch', replace: conj(B.N, B.CH), rules: [] },
  { find: 'njh', replace: conj(B.N, B.JH), rules: [] },
  { find: 'nsh', replace: conj(B.N, B.SH), rules: [] },
  { find: 'mth', replace: conj(B.M, B.TH), rules: [] },
  { find: 'mtr', replace: conj(B.M, conj(B.T, B.R)), rules: [] },
  { find: 'mbh', replace: conj(B.M, B.BH), rules: [] },
  { find: 'mph', replace: conj(B.M, B.PH), rules: [] },

  // ── 2-char sequences ──────────────────────────────────────────────────────
  // Vowel digraphs
  vowelEntry('aa', B.A, B.AA_KAR),
  vowelEntry('ii', B.II, B.II_KAR),
  vowelEntry('ee', B.II, B.II_KAR),
  vowelEntry('uu', B.UU, B.UU_KAR),
  vowelEntry('oo', B.UU, B.UU_KAR),
  vowelEntry('oi', B.OI, B.OI_KAR),
  vowelEntry('ou', B.OU, B.OU_KAR),
  vowelEntry('OI', B.OI, B.OI_KAR),
  vowelEntry('OU', B.OU, B.OU_KAR),

  // 2-char consonant digraphs
  { find: 'kh', replace: B.KH, rules: [] },
  { find: 'gh', replace: B.GH, rules: [] },
  { find: 'Ng', replace: B.NG_LETTER, rules: [] },
  { find: 'ch', replace: B.CH, rules: [] },
  { find: 'Ch', replace: B.CHH, rules: [] },
  { find: 'jh', replace: B.JH, rules: [] },
  { find: 'NG', replace: B.NYA, rules: [] },
  { find: 'Th', replace: B.TTH, rules: [] },
  { find: 'Dh', replace: B.DDH, rules: [] },
  { find: 'th', replace: B.TH, rules: [] },
  { find: 'dh', replace: B.DH, rules: [] },
  { find: 'ph', replace: B.PH, rules: [] },
  { find: 'bh', replace: B.BH, rules: [] },
  { find: 'sh', replace: B.SH, rules: [] },
  { find: 'Sh', replace: B.SSH, rules: [] },
  { find: 'Rh', replace: B.RRH, rules: [] },

  // 2-char consonant clusters
  { find: 'kt', replace: conj(B.K, B.T), rules: [] },
  { find: 'kk', replace: conj(B.K, B.K), rules: [] },
  { find: 'kn', replace: conj(B.K, B.N), rules: [] },
  { find: 'km', replace: conj(B.K, B.M), rules: [] },
  { find: 'kl', replace: conj(B.K, B.L), rules: [] },
  { find: 'kr', replace: conj(B.K, B.R), rules: [] },
  { find: 'ks', replace: conj(B.K, B.S), rules: [] },
  { find: 'gn', replace: conj(B.G, B.N), rules: [] },
  { find: 'gm', replace: conj(B.G, B.M), rules: [] },
  { find: 'gl', replace: conj(B.G, B.L), rules: [] },
  { find: 'gr', replace: conj(B.G, B.R), rules: [] },
  { find: 'gg', replace: conj(B.G, B.G), rules: [] },
  { find: 'gd', replace: conj(B.G, B.D), rules: [] },
  { find: 'gt', replace: conj(B.G, B.T), rules: [] },
  { find: 'gj', replace: conj(B.G, B.J), rules: [] },
  { find: 'jj', replace: conj(B.J, B.J), rules: [] },
  { find: 'jn', replace: conj(B.J, B.N), rules: [] },
  { find: 'jm', replace: conj(B.J, B.M), rules: [] },
  { find: 'jl', replace: conj(B.J, B.L), rules: [] },
  { find: 'jr', replace: conj(B.J, B.R), rules: [] },
  { find: 'jb', replace: conj(B.J, B.B), rules: [] },
  { find: 'nk', replace: conj(B.N, B.K), rules: [] },
  // 'ng' → ং (anusvara) by default.
  // When followed by a vowel it becomes ন্গ (conjunct) so that "manga" → মান্গা.
  // At end of word or before consonant it stays ং (e.g. "bangla" → বাংলা).
  { find: 'ng', replace: B.ANUSVAR, rules: [
    { matches: [{ type: 'suffix', scope: 'vowel' }], replace: conj(B.NG_LETTER, B.G) },
  ]},
  { find: 'nn', replace: conj(B.N, B.N), rules: [] },
  { find: 'nm', replace: conj(B.N, B.M), rules: [] },
  { find: 'nl', replace: conj(B.N, B.L), rules: [] },
  { find: 'nr', replace: conj(B.N, B.R), rules: [] },
  { find: 'nd', replace: conj(B.N, B.D), rules: [] },
  { find: 'nt', replace: conj(B.N, B.T), rules: [] },
  { find: 'np', replace: conj(B.N, B.P), rules: [] },
  { find: 'nb', replace: conj(B.N, B.B), rules: [] },
  { find: 'nc', replace: conj(B.N, B.CH), rules: [] },
  { find: 'nj', replace: conj(B.N, B.J), rules: [] },
  { find: 'ns', replace: conj(B.N, B.S), rules: [] },
  { find: 'pt', replace: conj(B.P, B.T), rules: [] },
  { find: 'pk', replace: conj(B.P, B.K), rules: [] },
  { find: 'pp', replace: conj(B.P, B.P), rules: [] },
  { find: 'pn', replace: conj(B.P, B.N), rules: [] },
  { find: 'pm', replace: conj(B.P, B.M), rules: [] },
  { find: 'pl', replace: conj(B.P, B.L), rules: [] },
  { find: 'pr', replace: conj(B.P, B.R), rules: [] },
  { find: 'ps', replace: conj(B.P, B.S), rules: [] },
  { find: 'bt', replace: conj(B.B, B.T), rules: [] },
  { find: 'bk', replace: conj(B.B, B.K), rules: [] },
  { find: 'bb', replace: conj(B.B, B.B), rules: [] },
  { find: 'bn', replace: conj(B.B, B.N), rules: [] },
  { find: 'bm', replace: conj(B.B, B.M), rules: [] },
  { find: 'bl', replace: conj(B.B, B.L), rules: [] },
  { find: 'br', replace: conj(B.B, B.R), rules: [] },
  { find: 'bd', replace: conj(B.B, B.D), rules: [] },
  { find: 'bj', replace: conj(B.B, B.J), rules: [] },
  { find: 'mk', replace: conj(B.M, B.K), rules: [] },
  { find: 'mg', replace: conj(B.M, B.G), rules: [] },
  { find: 'mm', replace: conj(B.M, B.M), rules: [] },
  { find: 'mn', replace: conj(B.M, B.N), rules: [] },
  { find: 'ml', replace: conj(B.M, B.L), rules: [] },
  { find: 'mr', replace: conj(B.M, B.R), rules: [] },
  { find: 'mb', replace: conj(B.M, B.B), rules: [] },
  { find: 'ms', replace: conj(B.M, B.S), rules: [] },
  { find: 'mp', replace: conj(B.M, B.P), rules: [] },
  { find: 'mt', replace: conj(B.M, B.T), rules: [] },
  { find: 'md', replace: conj(B.M, B.D), rules: [] },
  { find: 'lk', replace: conj(B.L, B.K), rules: [] },
  { find: 'lg', replace: conj(B.L, B.G), rules: [] },
  { find: 'll', replace: conj(B.L, B.L), rules: [] },
  { find: 'ln', replace: conj(B.L, B.N), rules: [] },
  { find: 'lm', replace: conj(B.L, B.M), rules: [] },
  { find: 'lp', replace: conj(B.L, B.P), rules: [] },
  { find: 'lb', replace: conj(B.L, B.B), rules: [] },
  { find: 'ld', replace: conj(B.L, B.D), rules: [] },
  { find: 'lt', replace: conj(B.L, B.T), rules: [] },
  { find: 'ls', replace: conj(B.L, B.S), rules: [] },
  { find: 'lr', replace: conj(B.L, B.R), rules: [] },
  { find: 'rk', replace: conj(B.R, B.K), rules: [] },
  { find: 'rg', replace: conj(B.R, B.G), rules: [] },
  { find: 'rn', replace: conj(B.R, B.N), rules: [] },
  { find: 'rm', replace: conj(B.R, B.M), rules: [] },
  { find: 'rl', replace: conj(B.R, B.L), rules: [] },
  { find: 'rr', replace: B.RR, rules: [] },
  { find: 'rb', replace: conj(B.R, B.B), rules: [] },
  { find: 'rd', replace: conj(B.R, B.D), rules: [] },
  { find: 'rt', replace: conj(B.R, B.T), rules: [] },
  { find: 'rs', replace: conj(B.R, B.S), rules: [] },
  { find: 'rp', replace: conj(B.R, B.P), rules: [] },
  { find: 'sk', replace: conj(B.S, B.K), rules: [] },
  { find: 'sg', replace: conj(B.S, B.G), rules: [] },
  { find: 'sn', replace: conj(B.S, B.N), rules: [] },
  { find: 'sm', replace: conj(B.S, B.M), rules: [] },
  { find: 'sl', replace: conj(B.S, B.L), rules: [] },
  { find: 'sb', replace: conj(B.S, B.B), rules: [] },
  { find: 'sd', replace: conj(B.S, B.D), rules: [] },
  { find: 'st', replace: conj(B.S, B.T), rules: [] },
  { find: 'sp', replace: conj(B.S, B.P), rules: [] },
  { find: 'ss', replace: conj(B.S, B.S), rules: [] },
  { find: 'sr', replace: conj(B.S, B.R), rules: [] },
  { find: 'tk', replace: conj(B.T, B.K), rules: [] },
  { find: 'tg', replace: conj(B.T, B.G), rules: [] },
  { find: 'tn', replace: conj(B.T, B.N), rules: [] },
  { find: 'tm', replace: conj(B.T, B.M), rules: [] },
  { find: 'tl', replace: conj(B.T, B.L), rules: [] },
  { find: 'tb', replace: conj(B.T, B.B), rules: [] },
  { find: 'td', replace: conj(B.T, B.D), rules: [] },
  { find: 'tt', replace: conj(B.T, B.T), rules: [] },
  { find: 'tp', replace: conj(B.T, B.P), rules: [] },
  { find: 'tr', replace: conj(B.T, B.R), rules: [] },
  { find: 'ts', replace: conj(B.T, B.S), rules: [] },
  { find: 'dk', replace: conj(B.D, B.K), rules: [] },
  { find: 'dg', replace: conj(B.D, B.G), rules: [] },
  { find: 'dn', replace: conj(B.D, B.N), rules: [] },
  { find: 'dm', replace: conj(B.D, B.M), rules: [] },
  { find: 'dl', replace: conj(B.D, B.L), rules: [] },
  { find: 'db', replace: conj(B.D, B.B), rules: [] },
  { find: 'dd', replace: conj(B.D, B.D), rules: [] },
  { find: 'dp', replace: conj(B.D, B.P), rules: [] },
  { find: 'dr', replace: conj(B.D, B.R), rules: [] },
  { find: 'ds', replace: conj(B.D, B.S), rules: [] },
  { find: 'dt', replace: conj(B.D, B.T), rules: [] },

  // Special characters
  { find: '^^', replace: H, rules: [] },          // explicit hasanta
  { find: ',,', replace: B.CHANDRABINDU, rules: [] },

  // ── 1-char sequences ──────────────────────────────────────────────────────
  // Vowels (single-char)
  vowelEntry('a', B.A, B.AA_KAR),
  vowelEntry('i', B.I, B.I_KAR),
  vowelEntry('u', B.U, B.U_KAR),
  vowelEntry('e', B.E, B.E_KAR), // ে (e-kaar)
  vowelEntry('o', B.O, B.O_KAR),

  // Uppercase vowels → always independent form
  { find: 'A', replace: B.A, rules: [] },
  { find: 'I', replace: B.II, rules: [] },        // capital I → ঈ
  { find: 'U', replace: B.UU, rules: [] },         // capital U → ঊ
  { find: 'E', replace: B.E, rules: [] },
  { find: 'O', replace: B.O, rules: [] },

  // Consonants (single-char)
  { find: 'k', replace: B.K, rules: [] },
  { find: 'g', replace: B.G, rules: [] },
  { find: 'j', replace: B.J, rules: [] },
  { find: 'T', replace: B.TT, rules: [] },
  { find: 'D', replace: B.DD, rules: [] },
  { find: 'N', replace: B.NN, rules: [] },
  { find: 't', replace: B.T, rules: [] },
  { find: 'd', replace: B.D, rules: [] },
  { find: 'n', replace: B.N, rules: [] },
  { find: 'p', replace: B.P, rules: [] },
  { find: 'b', replace: B.B, rules: [] },
  { find: 'm', replace: B.M, rules: [] },
  { find: 'z', replace: B.Z, rules: [] },
  { find: 'r', replace: B.R, rules: [] },
  { find: 'l', replace: B.L, rules: [] },
  { find: 's', replace: B.S, rules: [] },
  { find: 'h', replace: B.H, rules: [] },
  { find: 'R', replace: B.RR, rules: [] },
  { find: 'y', replace: B.Y, rules: [] },
  { find: 'S', replace: B.SH, rules: [] },        // S → শ (common alternative)
  { find: 'f', replace: B.PH, rules: [] },        // f → ফ
  { find: 'v', replace: B.BH, rules: [] },        // v → ভ
  { find: 'q', replace: B.K, rules: [] },         // q → ক (no native Bangla)
  { find: 'w', replace: B.O, rules: [] },         // w → ও (approximation)
  { find: 'x', replace: conj(B.K, B.S), rules: [
    { matches: [{ type: 'prefix', scope: 'punctuation' }], replace: `${B.E}${conj(B.K, B.S)}` },
  ]},
  // 'c' → স by default (e.g. "peace" → পিস). 'ch' is already handled by the
  // 2-char 'ch' pattern which fires before single 'c' due to greedy ordering.
  { find: 'c', replace: B.S, rules: [] },

  // Special symbols
  { find: '^', replace: B.CHANDRABINDU, rules: [] },
  { find: ':', replace: B.BISARGA, rules: [] },

  // Bangla digits
  { find: '0', replace: B.D0, rules: [] },
  { find: '1', replace: B.D1, rules: [] },
  { find: '2', replace: B.D2, rules: [] },
  { find: '3', replace: B.D3, rules: [] },
  { find: '4', replace: B.D4, rules: [] },
  { find: '5', replace: B.D5, rules: [] },
  { find: '6', replace: B.D6, rules: [] },
  { find: '7', replace: B.D7, rules: [] },
  { find: '8', replace: B.D8, rules: [] },
  { find: '9', replace: B.D9, rules: [] },

  // Sentence-ending full stop → Bangla daari (handled specially in parse)
  { find: '.', replace: B.DAARI, rules: [
    { matches: [{ type: 'suffix', scope: 'exact', value: '.' }], replace: '.' },
  ]},
];

/** The patterns pre-sorted by `find` length descending (longest-match-first). */
export const SORTED_PATTERNS: readonly PatternEntry[] = [...PATTERNS].sort(
  (a, b) => b.find.length - a.find.length,
);
