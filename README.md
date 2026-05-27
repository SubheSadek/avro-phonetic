# avro-phonetic

> Convert English transliteration to Bangla (Bengali) Unicode text using the Avro Phonetic keyboard layout. 
> Supports all vowels, consonants, conjuncts, and special characters.

[![npm version](https://img.shields.io/npm/v/avro-phonetic?style=flat-square)](https://www.npmjs.com/package/avro-phonetic)
[![CI](https://img.shields.io/github/actions/workflow/status/subhesadek/avro-phonetic/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/subhesadek/avro-phonetic/actions)
[![Coverage](https://img.shields.io/codecov/c/github/subhesadek/avro-phonetic?style=flat-square)](https://codecov.io/gh/subhesadek/avro-phonetic)
[![License](https://img.shields.io/npm/l/avro-phonetic?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## Features

- **Full Avro Phonetic support** — all vowels, consonants, conjuncts, and special characters
- **TypeScript-first** — written in TypeScript with strict types and bundled `.d.ts` declarations
- **Dual package** — ships both ESM (`import`) and CommonJS (`require`) builds
- **Zero dependencies** — tiny, self-contained, tree-shakeable
- **Configurable** — toggle Bangla digit / full-stop conversion
- **Well-tested** — comprehensive Vitest test suite

---

## Installation

```bash
npm install avro-phonetic
# or
yarn add avro-phonetic
# or
pnpm add avro-phonetic
```

---

## Quick Start

```ts
import { parse, toBangla, isBangla } from 'avro-phonetic';

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
const { toBangla } = require('avro-phonetic');
console.log(toBangla('ami'));
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
| `o` | ও / ো | O |
| `ou` / `OU` | ঔ / ৌ | Ou |

> Vowels produce the independent form (আ, ই…) when they appear at the start of a word, after another vowel, or after punctuation. After a consonant they produce the dependent matra form (া, ি…).

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
}
```

---

### Advanced — Custom Patterns

The `PATTERNS` and `SORTED_PATTERNS` arrays are exported for advanced use cases
(e.g. building a custom IME or extending the ruleset):

```ts
import { SORTED_PATTERNS } from 'avro-phonetic';
import type { PatternEntry } from 'avro-phonetic';

const custom: PatternEntry[] = [
  ...SORTED_PATTERNS,
  { find: 'xyz', replace: 'ক্ষ্য', rules: [] },
];
```

---

## Examples

```ts
import { toBangla } from 'avro-phonetic';

// Common greetings
toBangla('assalamu alaikum');   // আস্সালামু আলাইকুম
toBangla('namaskar');           // নমস্কার

// Full sentences
toBangla('amar naam Rahim.');   // আমার নাম রহিম।
toBangla('tumi ki bhalo acho?');// তুমি কি ভালো আছো?

// Numbers
toBangla('ami 5 ta boi porechi'); // আমি ৫ তা বই পড়েছি

// Keep ASCII digits
toBangla('chapter 3', { banglaDigits: false }); // চাপ্তের 3

// Conjunct consonants
toBangla('bidyalay');  // বিদ্যালয়
toBangla('bangladesh');// বাংলাদেশ
toBangla('prothom');   // প্রথম
toBangla('biggyan');   // বিজ্ঞান
```

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
