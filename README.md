# @subhesadek/avro-phonetic

> Convert English transliteration to Bangla (Bengali) Unicode text using the Avro Phonetic keyboard layout.
> Supports all vowels, consonants, conjuncts, special characters — and ships
> with a built-in ~670-word dictionary plus a "smart-O" engine rule so common
> Banglish words like `bosen` → বসেন, `mon` → মন, `kor` → কর just work.

[![npm version](https://img.shields.io/npm/v/%40subhesadek%2Favro-phonetic?style=flat-square)](https://www.npmjs.com/package/@subhesadek/avro-phonetic)
[![CI](https://img.shields.io/github/actions/workflow/status/subhesadek/avro-phonetic/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/subhesadek/avro-phonetic/actions)
[![Coverage](https://img.shields.io/codecov/c/github/subhesadek/avro-phonetic?style=flat-square)](https://codecov.io/gh/subhesadek/avro-phonetic)
[![License](https://img.shields.io/npm/l/%40subhesadek%2Favro-phonetic?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-7c6af7?style=flat-square)](https://avro-phonetic.vercel.app/)

**▶ [Try the live playground](https://avro-phonetic.vercel.app/)** — type Banglish, see Bangla in real time.

---

## Features

- **Full Avro Phonetic support** — all vowels, consonants, conjuncts, and special characters
- **Smart-O for real-world Banglish** — `o` after a consonant is treated as the inherent অ that Bangla never writes (so `bosen` → বসেন, `kor` → কর, `hobe` → হবে) — see [Smart-O & the Dictionary](#smart-o--the-dictionary) below
- **Built-in word dictionary** — ~670 canonical spellings for high-frequency words (pronouns, verb conjugations, family terms, numbers, everyday vocabulary, and clinical/prescription terms) with the ability to extend or replace
- **TypeScript-first** — written in TypeScript with strict types and bundled `.d.ts` declarations
- **Dual package** — ships both ESM (`import`) and CommonJS (`require`) builds
- **Zero dependencies** — tiny, self-contained, tree-shakeable
- **Configurable** — toggle Bangla digit / full-stop conversion, swap or disable the dictionary
- **Well-tested** — comprehensive Vitest test suite

---

## Installation

```bash
npm install @subhesadek/avro-phonetic
# or
yarn add @subhesadek/avro-phonetic
# or
pnpm add @subhesadek/avro-phonetic
```

---

## Quick Start

```ts
import { parse, toBangla, isBangla } from '@subhesadek/avro-phonetic';

// Full result object
const result = parse('ami banglay gan gai');
console.log(result.bangla);  // আমি বাংলায় গান গাই
console.log(result.english); // ami banglay gan gai

// Convenience helper — Bangla string only
console.log(toBangla('amar sonar bangla')); // আমার সোনার বাংলা
console.log(toBangla('khub bhalo'));        // খুব ভালো

// Detection helper
console.log(isBangla('আমি')); // true
console.log(isBangla('ami'));  // false
```

### CommonJS

```js
const { toBangla } = require('@subhesadek/avro-phonetic');
console.log(toBangla('ami'));
```

---

## Examples

```ts
import { toBangla } from '@subhesadek/avro-phonetic';

// Common greetings
toBangla('namaskar');             // নমস্কার
toBangla('assalamualaikum');      // আসসালামু আলাইকুম

// Full sentences
toBangla('amar naam rohim.');     // আমার নাম রহিম।
toBangla('tumi ki bhalo acho?');  // তুমি কি ভালো আছো?
toBangla('ami bose achi.');       // আমি বসে আছি।

// Smart-O — `o` after a consonant is the inherent অ
toBangla('mon');                  // মন
toBangla('bosen');                // বসেন
toBangla('kor');                  // কর
toBangla('bondhu');               // বন্ধু

// Words with genuine ো-kaar live in the dictionary
toBangla('sonar bangla');         // সোনার বাংলা
toBangla('amar fon');             // আমার ফোন
toBangla('baro');                 // বারো

// Numbers (use `Ta` — capital T — for the টা counter)
toBangla('ami 5 Ta boi porechi'); // আমি ৫ টা বই পড়েছি

// Keep ASCII digits
toBangla('chapter 3', { banglaDigits: false }); // চাপ্তের 3

// Conjunct consonants
toBangla('bangladesh');           // বাংলাদেশ
toBangla('prothom');              // প্রথম
toBangla('bostro');               // বস্ত্র
toBangla('bijNGan');              // বিজ্ঞান   (use NG → জ্ঞ)
toBangla('bidzaloy');             // বিদ্যালয় (use z → য)
```

---

## Phonetic Layout Reference

### Vowels

| Input | Output | Name |
|-------|--------|------|
| `a` / `aa` | আ / া | Aa |
| `i` | ই / ি | Hraswa i |
| `ii` / `ee` | ঈ / ী | Dirgha i |
| `u` | উ / ু | Hraswa u |
| `uu` / `oo` | ঊ / ূ | Dirgha u |
| `rri` | ঋ / ৃ | Ri |
| `e` | এ / ে | E |
| `oi` / `OI` | ঐ / ৈ | Oi |
| `o` | ও / *(silent অ)* | O — see note below |
| `ou` / `OU` | ঔ / ৌ | Ou |

> Vowels produce the independent form (আ, ই…) when they appear at the start of a word, after another vowel, or after punctuation. After a consonant they produce the dependent matra form (া, ি…).
>
> **`o` is the exception.** After a consonant it represents the *inherent অ*
> that every Bangla consonant carries silently (e.g. `mon` → মন, `bosen` →
> বসেন, `kor` → কর). Words that genuinely carry ো-kaar — বোন, তো, দেখো,
> বারো, সোনার, ফোন — live in the bundled dictionary and override the
> engine. See [Smart-O & the Dictionary](#smart-o--the-dictionary).

### Consonants

| Input | Output | Input | Output | Input | Output |
|-------|--------|-------|--------|-------|--------|
| `k` | ক | `kh` | খ | `g` | গ |
| `gh` | ঘ | `Ng` | ঙ | `ch` | চ |
| `Ch` | ছ | `j` | জ | `jh` | ঝ |
| `NG` | ঞ | `T` | ট | `Th` | ঠ |
| `D` | ড | `Dh` | ঢ | `N` | ণ |
| `t` | ত | `th` | থ | `d` | দ |
| `dh` | ধ | `n` | ন | `p` | প |
| `ph` / `f` | ফ | `b` | ব | `bh` / `v` | ভ |
| `m` | ম | `z` | য | `r` | র |
| `l` | ল | `sh` / `S` | শ | `Sh` | ষ |
| `s` | স | `h` | হ | `R` | ড় |
| `Rh` | ঢ় | `y` | য় | `q` | ক |
| `w` | ও | `x` | ক্স | | |

### Special Combinations

| Input | Output | Description |
|-------|--------|-------------|
| `kSh` / `ksh` | ক্ষ | Ksha conjunct |
| `GNG` / `jNG` | জ্ঞ | Gya conjunct |
| `ng` | ং | Anusvara (before consonant) |
| `^^` | ্ | Hasanta (explicit virama) |
| `,,` | ঁ | Chandrabindu |
| `^` | ঁ | Chandrabindu (short form) |
| `:` | ঃ | Bisarga / Visarga |
| `.` | । | Daari (Bengali full stop) |

### Digits

| Input | Output |
|-------|--------|
| `0` – `9` | `০` – `৯` |

---

## API Reference

### `parse(input, options?)`

Converts an English Avro Phonetic string to Bangla Unicode.

```ts
function parse(input: string, options?: ParseOptions): ParseResult;
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `input` | `string` | English transliteration string |
| `options` | `ParseOptions` | Optional configuration (see below) |

**Returns** `ParseResult`:

```ts
interface ParseResult {
  bangla: string;   // The converted Bangla Unicode string
  english: string;  // The original input (unchanged)
}
```

---

### `toBangla(input, options?)`

Convenience wrapper that returns only the Bangla string.

```ts
function toBangla(input: string, options?: ParseOptions): string;
```

---

### `isBangla(text)`

Returns `true` if the string contains at least one Bangla Unicode character (U+0980–U+09FF).

```ts
function isBangla(text: string): boolean;
```

---

### `ParseOptions`

```ts
interface ParseOptions {
  /**
   * When true, ASCII digits 0–9 are converted to Bangla digits ০–৯.
   * @default true
   */
  banglaDigits?: boolean;

  /**
   * When true, a trailing `.` is converted to the Bangla daari (।).
   * @default true
   */
  banglaFullStop?: boolean;

  /**
   * Word-level overrides applied BEFORE the phonetic engine.
   *
   *  - `true`  (default) — use the bundled `BANGLISH_DICTIONARY`
   *  - `false`           — disable the dictionary; pure phonetic conversion
   *  - object            — use the provided mapping instead of the default;
   *                        spread `BANGLISH_DICTIONARY` to extend
   *
   * @default true
   */
  dictionary?: boolean | BanglishDictionary;
}

type BanglishDictionary = Readonly<Record<string, string>>;
```

---

### Advanced — Custom Patterns

The `PATTERNS` and `SORTED_PATTERNS` arrays are exported for advanced use cases
(e.g. building a custom IME or extending the ruleset):

```ts
import { SORTED_PATTERNS } from '@subhesadek/avro-phonetic';
import type { PatternEntry } from '@subhesadek/avro-phonetic';

const custom: PatternEntry[] = [
  ...SORTED_PATTERNS,
  { find: 'xyz', replace: 'ক্ষ্য', rules: [] },
];
```

---

## Smart-O & the Dictionary

Banglish — Bengali typed in Latin letters — has one structural ambiguity that
plain transliteration can't resolve: **the inherent অ**. Every Bangla
consonant carries a silent /ɔ/ that is never written, but Banglish typists
encode that sound with the letter `o`. The same `o` is also used for the
explicit ো-kaar. So a strict phonetic engine cannot tell `mon` (মন, "mind",
implicit অ) apart from `bon` (বোন, "sister", explicit ো-kaar) — both look
like `Co<n>` in the input.

This package solves the ambiguity with two cooperating layers:

### 1. The smart-O engine rule

Whenever `o` follows a consonant — anywhere in the word — the phonetic engine
emits an internal Zero-Width Non-Joiner (`U+200C`) marker instead of ো-kaar.
The marker is invisible, blocks the auto-hasanta logic from forming an
unwanted conjunct between the surrounding consonants, and is stripped from
the output before NFC normalisation.

```ts
toBangla('bosen');  // বসেন
toBangla('mon');    // মন
toBangla('kor');    // কর
toBangla('hobe');   // হবে   (engine output now matches the canonical spelling)
toBangla('bostro'); // বস্ত্র (the str cluster still works)
```

This is a deliberate deviation from strict Avro Phonetic. To get the original
behaviour (`bo` → বো from the engine), pass `dictionary: false` *and* opt out
of smart-O by overriding the `o` pattern — see *Custom Patterns* above.

### 2. The word-level dictionary

A bundled `BANGLISH_DICTIONARY` of ~670 high-frequency words is consulted
**before** the engine runs and short-circuits known canonical spellings. It
also restores the ো-kaar for words that legitimately have one:

```ts
toBangla('hobe');   // হবে    (dict: হবে — not the engine's হোবে)
toBangla('to');     // তো    (dict overrides smart-O)
toBangla('dekho');  // দেখো  (dict overrides smart-O — imperative)
toBangla('sonar');  // সোনার  (dict — keeps the explicit ো-kaar)
toBangla('baro');   // বারো  (dict — number 12)
```

#### Extending the dictionary

Spread the default and add your own entries:

```ts
import { toBangla, BANGLISH_DICTIONARY } from '@subhesadek/avro-phonetic';

toBangla('amar kompani', {
  dictionary: { ...BANGLISH_DICTIONARY, kompani: 'কোম্পানি' },
});
// → আমার কোম্পানি
```

#### Replacing the dictionary

Pass a plain object to use only your own mapping:

```ts
toBangla('greeting friend', {
  dictionary: { greeting: 'হ্যালো', friend: 'বন্ধু' },
});
// → হ্যালো বন্ধু
```

#### Disabling the dictionary

```ts
toBangla('hobe', { dictionary: false }); // হবে (engine only, no dict)
```

Dictionary lookup is **case-insensitive**, keys are stored in lowercase, and
the lookup uses `Object.hasOwn` so custom dictionaries can't be exploited via
prototype pollution (`__proto__`, `constructor`, …).

---

## Development

```bash
# Install dependencies
npm install

# Type-check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Watch mode
npm run build:watch
```

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please make sure your PR:
- Passes all existing tests
- Adds tests for new functionality
- Follows the existing code style (run `npm run lint && npm run format:check`)

---

## Credits

This package is a TypeScript port and modernisation of
[jsAvroPhonetic](https://github.com/torifat/jsAvroPhonetic) by
[Rifat Nabi](https://github.com/torifat), which is itself a JavaScript
implementation of the
[Avro Keyboard](https://www.omicronlab.com/avro-keyboard.html) phonetic layout
by [OmicronLab](https://www.omicronlab.com/).

---

## License

[Mozilla Public License 2.0](./LICENSE) — © 2024 Sadek
