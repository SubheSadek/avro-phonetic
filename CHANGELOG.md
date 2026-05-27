# Changelog

All notable changes to **@subhesadek/avro-phonetic** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.3]: https://github.com/subhesadek/avro-phonetic/releases/tag/v1.0.3
[1.0.0]: https://github.com/subhesadek/avro-phonetic/releases/tag/v1.0.0
