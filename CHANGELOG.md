# Changelog

All notable changes to **@subhesadek/avro-phonetic** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.1] — 2026-06-01

### Changed

- **Playground script extracted to `playground.js`.** The inline `<script type="module">` block in `playground.html` is now a standalone file, making it easier to lint, test, and cache independently.
- **Vercel deployment config added (`vercel.json`).** The playground can now be deployed to Vercel with a single push — the build step compiles the library, assembles `public/`, and serves it with strict CSP, `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers.

---

## [2.1.0] — 2026-05-31

### Added

- **Default dictionary expanded from ~250 to ~670 entries.** New coverage:
  - **Clinical / prescription vocabulary** for dose, form, duration,
    frequency, instructions, follow-up, and symptoms — e.g. `tablet` →
    ট্যাবলেট, `capsule` → ক্যাপসুল, `oshudh` → ওষুধ, `khalipete` →
    খালিপেটে, `bishram` → বিশ্রাম, `proyojone` → প্রয়োজনে, `khaben` →
    খাবেন.
  - **অ-initial words** the engine would otherwise start with ও — `onek` →
    অনেক, `onno` → অন্য, `ortho` → অর্থ, `ekhono` → এখনো.
  - **Sibilant / retroflex disambiguations** — `thik` → ঠিক, `kichu` →
    কিছু, `shob` → সব, `sotti` → সত্যি, `jonogon` → জনগণ.
  - **`ek-` compounds and counters** — `ekdin` → একদিন, `ekbar` → একবার,
    `ekta` → একটা, `ektu` → একটু (the engine emits valid conjuncts like
    এক্‌দিন; these entries restore the separate-syllable spelling).
  - **Everyday vocabulary** — greetings, common verbs, loanwords, and
    adverbs: `taka` → টাকা, `dokan` → দোকান, `school` / `iskul` → স্কুল,
    `chithi` → চিঠি, `taratari` → তাড়াতাড়ি, `obosshoi` → অবশ্যই.
- **Regression-fixture test table** in `tests/dictionary.test.ts` — a
  table-driven `it.each` block that pins real-world inputs which previously
  rendered wrong. Add a row whenever a user reports a bad word.

### Fixed

- **Uppercase Latin leak in the phonetic engine.** Words whose leading
  capital is not a meaningful Avro capital used to leak the raw Latin letter
  into the output (e.g. `Prothom` → `P্রথম`-style). The engine now falls
  back to the lowercase pattern for non-significant capitals, so `Prothom` →
  প্রথম and `Pakhi` → পাখি. Meaningful Avro capitals (T D N R S C O A E I U)
  already match patterns and are unaffected.
- **Missing `chh` → ছ mapping.** Lowercase `chh` now maps to ছ (tried before
  `ch` → চ via longest-match), so `chhobi` → ছবি (was চ্হবি).

### Changed

- **`jor` now maps to জ্বর (fever)** instead of জর, for the clinical use
  case. Type `jore` for জোরে ("loudly / forcefully"). The phonetic engine
  (`dictionary: false`) still produces জর.

---

## [2.0.0] — 2026-05-29

### Breaking

- **Smart-O engine rule.** The single-character `o` after a consonant no
  longer emits ো-kaar. Instead it emits a Zero-Width Non-Joiner (U+200C)
  as an "implicit অ" marker, which is stripped before the final NFC
  output. This deliberately deviates from strict Avro Phonetic to match
  real-world Banglish typing conventions:
  - `bo` → ব (was বো)
  - `bosen` → বসেন (was বোসেন)
  - `kor` → কর (was কোর)
  - `hobe` (with `dictionary: false`) → হবে (was হোবে)

  The ZWNJ marker also blocks the auto-hasanta logic from forming
  unintended conjuncts between the surrounding consonants — so `bosen`
  becomes বসেন, not ব্সেন.

  Words that legitimately carry ো-kaar (বোন, তো, দেখো, বারো, সোনার,
  বোনাস, …) are handled by the word-level dictionary, which takes
  precedence over the engine.

### Added

- **Massively expanded default dictionary.** Grown from ~55 to ~250
  entries covering:
  - Verb conjugations for করা / বলা / দেখা / খাওয়া / আসা / দেওয়া /
    নেওয়া / পারা / পড়া / শোনা / বোঝা / যাওয়া / থাকা / হওয়া.
  - Pronouns and demonstratives (informal/formal, all persons).
  - Question words, time words, conjunctions, family terms, common
    nouns, adjectives, emotions, and pleasantries.
  - Numbers 1–20, with explicit ো-kaar entries for 11–18.
  - Particles and adverbs that genuinely end in ো-kaar (`to` → তো,
    `hoyto` → হয়তো, `noyto` → নয়তো, `oho`, `aha`).
  - Common ো-kaar nouns that the smart-O engine would otherwise
    mis-spell (`sonar`, `sona`, `lok`, `lokjon`, `chor`, `bonus`,
    `goyenda`, `fon`).
- `IMPLICIT_A_MARKER` exported from `patterns.ts` for advanced use cases
  (custom pattern tables that want to participate in the smart-O scheme).

### Changed

- Phonetic-engine tests now bypass the dictionary where appropriate
  (`{ dictionary: false }`) so they assert the engine's own behaviour
  rather than the dictionary's overrides.
- Existing phonetic tests updated for the new smart-O behaviour:
  `ko` → ক, `kob` → কব, `jor` → জর, `Tora` → টরা, `hobe` → হবে.

### Migration

Most users will *gain* correct output for free — common Banglish words
like `bosen`, `kor`, `bole`, `mone` now render correctly without needing
dictionary entries. If your code relied on strict Avro Phonetic output
(e.g. `bo` → বো from the phonetic engine), either:

1. Add the word to the dictionary with its canonical spelling, or
2. For tests/snapshots that pin engine output, update the expected
   values to match the new smart-O behaviour.

---

## [1.0.3] — 2026-05-27

### Fixed

- Fixed branch coverage threshold by adding tests for the `x` pattern.
- Added `/* v8 ignore */` on unreachable TypeScript exhaustiveness guard.

### Changed
- `make check` now includes coverage report (`test-cov` instead of `test`).

---

## [1.0.0] — 2024-01-01

### Added

- Initial release of `@subhesadek/avro-phonetic`.
- Full TypeScript implementation of the Avro Phonetic keyboard layout.
- `parse(input, options?)` — returns `{ bangla, english }` result object.
- `toBangla(input, options?)` — convenience helper returning the Bangla string directly.
- `isBangla(text)` — detects whether a string contains Bangla Unicode characters.
- `ParseOptions` — configurable behaviour for digit and full-stop conversion:
  - `banglaDigits` (default `true`): converts ASCII `0–9` to Bangla `০–৯`.
  - `banglaFullStop` (default `true`): converts `.` to `।` (daari) at sentence end.
- Full ESM + CommonJS dual-package output via `tsup`.
- TypeScript declaration files (`.d.ts`) bundled in `dist/`.
- Comprehensive Vitest test suite with ≥ 90% coverage target.
- GitHub Actions CI workflow (Node 18, 20, 22 matrix).
- GitHub Actions publish workflow (automated npm publish on GitHub Release).
- MIT-compatible Mozilla Public License 2.0.

---

[2.1.1]: https://github.com/subhesadek/avro-phonetic/releases/tag/v2.1.1
[2.1.0]: https://github.com/subhesadek/avro-phonetic/releases/tag/v2.1.0
[2.0.0]: https://github.com/subhesadek/avro-phonetic/releases/tag/v2.0.0
[1.0.3]: https://github.com/subhesadek/avro-phonetic/releases/tag/v1.0.3
[1.0.0]: https://github.com/subhesadek/avro-phonetic/releases/tag/v1.0.0
