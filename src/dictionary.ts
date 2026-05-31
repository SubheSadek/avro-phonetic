/**
 * Banglish → Bangla word-level dictionary.
 *
 * The Avro Phonetic engine is purely *transliterative* — it walks the input
 * letter-by-letter and emits Bangla characters based on phonetic rules. This
 * is mechanically correct but does not match how native Bangla words are
 * actually spelled when typed informally.
 *
 * For example, `hobe` (meaning "will be") is phonetically `h + o + b + e`,
 * which the engine renders as **হোবে** (`হ + ো + ব + ে`). But the canonical
 * Bangla spelling is **হবে** (`হ + ব + ে`), where the first vowel is the
 * implicit *অ* sound that has no graphical representation.
 *
 * This dictionary lets the parser short-circuit such well-known words and
 * emit their canonical Bangla form directly, before falling back to the
 * phonetic engine for unknown tokens.
 *
 * ### Conventions
 *
 * - Keys are stored **lowercase** and matched case-insensitively (the parser
 *   lowercases each token before lookup).
 * - Values are NFC-normalised Bangla and emitted verbatim.
 * - The object is `Object.freeze`-d at module load so the default cannot be
 *   mutated at runtime. Users who want to extend the dictionary should spread
 *   it: `{ ...BANGLISH_DICTIONARY, myword: 'মাইওয়ার্ড' }`.
 *
 * ### Security
 *
 * The parser uses `Object.hasOwn()` for every lookup, so user-supplied
 * dictionary objects cannot trigger prototype-pollution access on keys like
 * `__proto__`, `constructor`, or `toString`.
 */

import type { BanglishDictionary } from './types.js';

/**
 * Default Banglish → Bangla word dictionary.
 *
 * Several hundred high-frequency words covering common pronouns, verb
 * conjugations, and everyday vocabulary. Users can extend this via the
 * `dictionary` option on {@link parse}.
 *
 * @example Extend with custom words
 * ```ts
 * import { toBangla, BANGLISH_DICTIONARY } from '@subhesadek/avro-phonetic';
 *
 * toBangla('amar bari', {
 *   dictionary: { ...BANGLISH_DICTIONARY, bari: 'বাড়ি' },
 * }); // → 'আমার বাড়ি'
 * ```
 */
// The literal is validated by `satisfies` (each value must be a string) and
// then frozen at runtime so the default cannot be mutated. The exported binding
// is widened to `BanglishDictionary` for the public API surface.
// ── Why words are in this dictionary ─────────────────────────────────────────
//
// The phonetic engine is purely transliterative. The most common reason a word
// needs to live here is the **implicit-অ problem**: in Bangla, every consonant
// carries an inherent /ɔ/ (অ) vowel that is *not* written. Banglish typists
// usually type that sound as the letter `o`, e.g. `mon` for "mind". But `o` in
// Avro Phonetic also produces the explicit ো-kaar (e.g. `jor` → জোর = force).
//
// There is no algorithmic way to decide which one a given `o` should be:
//
//   • `mon`  → মন      (implicit অ — "mind")
//   • `bon`  → বোন    (explicit ো — "sister")
//   • `ghor` → ঘর      (implicit অ — "room")
//   • `bot`  → বট      (implicit অ — "banyan")
//
// So we list the canonical spelling for each high-frequency word and fall back
// to the phonetic engine for everything else. Add entries here when a common
// word's phonetic rendering is wrong.

const DEFAULT_ENTRIES = {
  // ── Pronouns (1st person) ──────────────────────────────────────────────────
  ami: 'আমি',
  amar: 'আমার',
  amake: 'আমাকে',
  amra: 'আমরা',
  amader: 'আমাদের',

  // ── Pronouns (2nd person informal) ─────────────────────────────────────────
  tumi: 'তুমি',
  tomar: 'তোমার',
  tomake: 'তোমাকে',
  tomra: 'তোমরা',
  tomader: 'তোমাদের',
  tui: 'তুই',
  tor: 'তোর',
  toke: 'তোকে',
  tora: 'তোরা',
  toder: 'তোদের',

  // ── Pronouns (2nd person formal) ───────────────────────────────────────────
  apni: 'আপনি',
  apnar: 'আপনার',
  apnara: 'আপনারা',
  apnader: 'আপনাদের',

  // ── Pronouns (3rd person) ──────────────────────────────────────────────────
  se: 'সে',
  tar: 'তার',
  take: 'তাকে',
  tara: 'তারা',
  tader: 'তাদের',
  tini: 'তিনি',
  tahar: 'তাহার',
  tahara: 'তাহারা',
  o: 'ও',
  ora: 'ওরা',
  oder: 'ওদের',

  // ── Demonstratives / location ──────────────────────────────────────────────
  ei: 'এই',
  eta: 'এটা',
  eti: 'এটি',
  era: 'এরা',
  eder: 'এদের',
  oi: 'ঐ',
  ota: 'ওটা',
  oti: 'ওটি',
  ekhane: 'এখানে',
  okhane: 'ওখানে',
  sekhane: 'সেখানে',
  ethay: 'এথায়',

  // ── Verb হওয়া (to be) ─────────────────────────────────────────────────────
  hoy: 'হয়',
  hobe: 'হবে',
  holo: 'হলো',
  hoyeche: 'হয়েছে',
  hoyechilo: 'হয়েছিল',
  hocche: 'হচ্ছে',
  hochilo: 'হচ্ছিল',
  hoye: 'হয়ে',

  // ── Verb থাকা (to be / to stay) ────────────────────────────────────────────
  ache: 'আছে',
  achi: 'আছি',
  acho: 'আছো',
  achen: 'আছেন',
  achis: 'আছিস',
  chilo: 'ছিল',
  chilam: 'ছিলাম',
  chile: 'ছিলে',
  chilen: 'ছিলেন',
  chilis: 'ছিলিস',
  thaki: 'থাকি',
  thako: 'থাকো',
  thake: 'থাকে',
  thaken: 'থাকেন',
  thakbo: 'থাকবো',
  thakbe: 'থাকবে',
  theke: 'থেকে',

  // ── Verb যাওয়া (to go) ────────────────────────────────────────────────────
  jay: 'যায়',
  jai: 'যাই',
  jao: 'যাও',
  jan: 'যান',
  jas: 'যাস',
  jabo: 'যাবো',
  jabe: 'যাবে',
  jaben: 'যাবেন',
  jabi: 'যাবি',
  jachchi: 'যাচ্ছি',
  jachche: 'যাচ্ছে',
  gelo: 'গেল',
  gechi: 'গেছি',
  geche: 'গেছে',
  gechen: 'গেছেন',
  giye: 'গিয়ে',
  giyechi: 'গিয়েছি',
  giyeche: 'গিয়েছে',

  // ── Verb করা (to do) ───────────────────────────────────────────────────────
  kori: 'করি',
  koro: 'করো',
  kore: 'করে',
  koren: 'করেন',
  koris: 'করিস',
  korbo: 'করবো',
  korbe: 'করবে',
  korben: 'করবেন',
  korbi: 'করবি',
  korchi: 'করছি',
  korche: 'করছে',
  korchen: 'করছেন',
  korlam: 'করলাম',
  korlo: 'করল',
  korle: 'করলে',
  koreche: 'করেছে',
  korechi: 'করেছি',
  korechilo: 'করেছিল',
  korte: 'করতে',

  // ── Verb বলা (to say) ──────────────────────────────────────────────────────
  boli: 'বলি',
  bolo: 'বলো',
  bole: 'বলে',
  bolen: 'বলেন',
  bolbo: 'বলবো',
  bolbe: 'বলবে',
  bolben: 'বলবেন',
  bolchi: 'বলছি',
  bolche: 'বলছে',
  bolechi: 'বলেছি',
  boleche: 'বলেছে',
  bolte: 'বলতে',
  bollam: 'বললাম',
  bollo: 'বলল',

  // ── Verb দেখা (to see) ─────────────────────────────────────────────────────
  dekhi: 'দেখি',
  dekho: 'দেখো',
  dekhe: 'দেখে',
  dekhen: 'দেখেন',
  dekhbo: 'দেখবো',
  dekhbe: 'দেখবে',
  dekhchi: 'দেখছি',
  dekhche: 'দেখছে',
  dekhechi: 'দেখেছি',
  dekheche: 'দেখেছে',
  dekhte: 'দেখতে',
  dekha: 'দেখা',

  // ── Verb খাওয়া (to eat) ───────────────────────────────────────────────────
  khai: 'খাই',
  khao: 'খাও',
  khay: 'খায়',
  khan: 'খান',
  khabo: 'খাবো',
  khabe: 'খাবে',
  khachchi: 'খাচ্ছি',
  khachche: 'খাচ্ছে',
  khelam: 'খেলাম',
  khelo: 'খেল',
  kheyechi: 'খেয়েছি',
  kheyeche: 'খেয়েছে',
  khete: 'খেতে',

  // ── Verb আসা (to come) ─────────────────────────────────────────────────────
  ashi: 'আসি',
  asho: 'আসো',
  ase: 'আসে',
  asen: 'আসেন',
  ashbo: 'আসবো',
  ashbe: 'আসবে',
  asben: 'আসবেন',
  aschi: 'আসছি',
  asche: 'আসছে',
  eshe: 'এসে',
  eshechi: 'এসেছি',
  esheche: 'এসেছে',
  ashte: 'আসতে',

  // ── Verb দেওয়া (to give) ──────────────────────────────────────────────────
  dei: 'দেই',
  dao: 'দাও',
  dey: 'দেয়',
  den: 'দেন',
  debo: 'দেবো',
  debe: 'দেবে',
  diye: 'দিয়ে',
  diyechi: 'দিয়েছি',
  diyeche: 'দিয়েছে',
  dilam: 'দিলাম',
  dite: 'দিতে',

  // ── Verb নেওয়া (to take) ──────────────────────────────────────────────────
  nei: 'নেই',
  nao: 'নাও',
  nen: 'নেন',
  nebo: 'নেবো',
  niye: 'নিয়ে',
  niyechi: 'নিয়েছি',
  niyeche: 'নিয়েছে',
  nilam: 'নিলাম',
  nite: 'নিতে',

  // ── Verb পারা (to be able) ─────────────────────────────────────────────────
  pari: 'পারি',
  paro: 'পারো',
  pare: 'পারে',
  paren: 'পারেন',
  parbo: 'পারবো',
  parbe: 'পারবে',
  parlam: 'পারলাম',
  parchi: 'পারছি',
  parche: 'পারছে',

  // ── Verb চাওয়া (to want) ──────────────────────────────────────────────────
  chai: 'চাই',
  chao: 'চাও',
  chan: 'চান',
  cheyechi: 'চেয়েছি',
  cheyeche: 'চেয়েছে',

  // ── Verb পড়া (to read / to fall) ──────────────────────────────────────────
  // NOTE: `pore` is intentionally OMITTED — it collides with the adverb
  // `pore` (পরে = "later") which is more frequent. Type `poRe` (capital R →
  // ড়) for the verb form, or rely on the phonetic engine.
  pori: 'পড়ি',
  poro: 'পড়ো',
  poren: 'পড়েন',
  porbo: 'পড়বো',
  porbe: 'পড়বে',
  porchi: 'পড়ছি',
  porche: 'পড়ছে',
  porechi: 'পড়েছি',
  poreche: 'পড়েছে',
  porte: 'পড়তে',

  // ── Verb শোনা (to hear) ────────────────────────────────────────────────────
  shuni: 'শুনি',
  shono: 'শোনো',
  shone: 'শোনে',
  shonen: 'শোনেন',
  shunbo: 'শুনবো',
  shunbe: 'শুনবে',
  shunchi: 'শুনছি',
  shunche: 'শুনছে',
  shunechi: 'শুনেছি',
  shuneche: 'শুনেছে',
  shune: 'শুনে',

  // ── Verb বোঝা (to understand) ──────────────────────────────────────────────
  bujhi: 'বুঝি',
  bojho: 'বোঝো',
  bojhe: 'বোঝে',
  bujhechi: 'বুঝেছি',
  bujheche: 'বুঝেছে',
  bujhle: 'বুঝলে',

  // ── Question words ─────────────────────────────────────────────────────────
  ke: 'কে',
  ki: 'কি',
  kee: 'কী',
  kar: 'কার',
  kake: 'কাকে',
  kara: 'কারা',
  kader: 'কাদের',
  kothay: 'কোথায়',
  kothao: 'কোথাও',
  kemon: 'কেমন',
  keno: 'কেন',
  kobe: 'কবে',
  koto: 'কত',
  kotota: 'কতটা',
  konta: 'কোনটা',
  konti: 'কোনটি',
  kon: 'কোন',

  // ── Time / temporal ────────────────────────────────────────────────────────
  ekhon: 'এখন',
  jokhon: 'যখন',
  tokhon: 'তখন',
  aaj: 'আজ',
  ajke: 'আজকে',
  kal: 'কাল',
  kalke: 'কালকে',
  poroshu: 'পরশু',
  shokal: 'সকাল',
  dupur: 'দুপুর',
  bikel: 'বিকেল',
  shondha: 'সন্ধ্যা',
  raat: 'রাত',
  raate: 'রাতে',
  shokale: 'সকালে',
  ekhuni: 'এখুনি',
  age: 'আগে',
  pore: 'পরে',
  somoy: 'সময়',

  // ── Conjunctions / function words ──────────────────────────────────────────
  ebong: 'এবং',
  kintu: 'কিন্তু',
  ar: 'আর',
  ba: 'বা',
  othoba: 'অথবা',
  na: 'না',
  hyan: 'হ্যাঁ',
  ha: 'হ্যাঁ',
  jodi: 'যদি',
  tahole: 'তাহলে',
  tobe: 'তবে',
  karon: 'কারণ',
  jeno: 'যেন',
  jodio: 'যদিও',
  // Particles & adverbs that legitimately end in ো-kaar — these override the
  // smart-O engine rule that would otherwise strip the trailing ো.
  to: 'তো',
  hoyto: 'হয়তো',
  noyto: 'নয়তো',
  oho: 'ওহো',
  aha: 'আহা',
  mone: 'মনে',
  jonno: 'জন্য',
  jonye: 'জন্যে',
  shathe: 'সাথে',
  songe: 'সঙ্গে',
  upor: 'উপর',
  niche: 'নিচে',
  bhitor: 'ভিতর',
  baire: 'বাইরে',
  majhe: 'মাঝে',
  modhye: 'মধ্যে',

  // ── Family ─────────────────────────────────────────────────────────────────
  ma: 'মা',
  baba: 'বাবা',
  bhai: 'ভাই',
  bon: 'বোন',
  dada: 'দাদা',
  didi: 'দিদি',
  chele: 'ছেলে',
  meye: 'মেয়ে',
  baccha: 'বাচ্চা',
  nana: 'নানা',
  nani: 'নানি',
  dadi: 'দাদি',
  mama: 'মামা',
  mami: 'মামি',
  chacha: 'চাচা',
  chachi: 'চাচি',

  // ── Common ো-kaar nouns that the smart-O engine would mis-spell ───────────
  // Without these the phonetic engine would produce, e.g., সনার / লক / চর /
  // বনাস — stripping the canonical ো-kaar.
  sonar: 'সোনার',
  sona: 'সোনা',
  lok: 'লোক',
  lokjon: 'লোকজন',
  chor: 'চোর',
  bonus: 'বোনাস',
  goyenda: 'গোয়েন্দা',
  fon: 'ফোন',
  bot: 'বট',

  // ── Common nouns (implicit-অ heavy) ────────────────────────────────────────
  mon: 'মন',
  ghor: 'ঘর',
  bari: 'বাড়ি',
  desh: 'দেশ',
  bhasha: 'ভাষা',
  shahor: 'শহর',
  gram: 'গ্রাম',
  rasta: 'রাস্তা',
  gari: 'গাড়ি',
  boi: 'বই',
  kolom: 'কলম',
  khata: 'খাতা',
  kagoj: 'কাগজ',
  jol: 'জল',
  pani: 'পানি',
  bhat: 'ভাত',
  ruti: 'রুটি',
  dal: 'ডাল',
  machh: 'মাছ',
  mangsho: 'মাংস',
  doodh: 'দুধ',
  cha: 'চা',
  cini: 'চিনি',
  lobon: 'লবণ',
  tel: 'তেল',
  gach: 'গাছ',
  ful: 'ফুল',
  pata: 'পাতা',
  nodi: 'নদী',
  sagor: 'সাগর',
  pahar: 'পাহাড়',
  akash: 'আকাশ',
  surjo: 'সূর্য',
  chand: 'চাঁদ',
  // NOTE: `tara` (star) is intentionally omitted — collides with the more
  // frequent 3rd-person pronoun `tara` (তারা = "they"). Use `nokkhotro` for
  // star instead.
  nokkhotro: 'নক্ষত্র',
  megh: 'মেঘ',
  brishti: 'বৃষ্টি',
  haowa: 'হাওয়া',
  batas: 'বাতাস',
  agun: 'আগুন',
  mati: 'মাটি',
  poth: 'পথ',
  por: 'পর',
  // `jor` maps to জ্বর (fever) for the clinical use case. Type `jore` for
  // জোরে (loudly / forcefully) if you need the "force" sense.
  jor: 'জ্বর',
  bol: 'বল',
  phol: 'ফল',
  jhol: 'ঝোল',
  chokh: 'চোখ',
  mukh: 'মুখ',
  kan: 'কান',
  nak: 'নাক',
  hath: 'হাত',
  pa: 'পা',
  math: 'মাঠ',
  matha: 'মাথা',
  chul: 'চুল',
  pet: 'পেট',
  rokto: 'রক্ত',
  pran: 'প্রাণ',
  hridoy: 'হৃদয়',

  // ── Adjectives / descriptors ───────────────────────────────────────────────
  bhalo: 'ভালো',
  kharap: 'খারাপ',
  shundor: 'সুন্দর',
  boro: 'বড়',
  choto: 'ছোট',
  lomba: 'লম্বা',
  khato: 'খাটো',
  thanda: 'ঠান্ডা',
  gorom: 'গরম',
  notun: 'নতুন',
  puran: 'পুরান',
  purono: 'পুরনো',
  mishti: 'মিষ্টি',
  tito: 'তিতো',
  shoja: 'সোজা',
  shokto: 'শক্ত',
  norom: 'নরম',
  ucca: 'উচ্চ',
  nichu: 'নিচু',
  shada: 'সাদা',
  kalo: 'কালো',
  lal: 'লাল',
  nil: 'নীল',
  sobuj: 'সবুজ',
  holud: 'হলুদ',

  // ── Numbers (Banglish form) ────────────────────────────────────────────────
  // NOTE: numbers 11-18 legitimately end in ো-kaar (এগারো, বারো, …); without
  // these entries the smart-O engine rule would strip that ো and produce the
  // wrong spelling.
  ek: 'এক',
  dui: 'দুই',
  tin: 'তিন',
  char: 'চার',
  panch: 'পাঁচ',
  choy: 'ছয়',
  saat: 'সাত',
  aat: 'আট',
  noy: 'নয়',
  dosh: 'দশ',
  egaro: 'এগারো',
  baro: 'বারো',
  tero: 'তেরো',
  choddo: 'চৌদ্দ',
  ponero: 'পনেরো',
  solo: 'ষোলো',
  sotero: 'সতেরো',
  ataro: 'আঠারো',
  unish: 'উনিশ',
  bish: 'বিশ',

  // ── Emotions / abstract ────────────────────────────────────────────────────
  prem: 'প্রেম',
  bhalobasha: 'ভালোবাসা',
  ghrina: 'ঘৃণা',
  rag: 'রাগ',
  dukkho: 'দুঃখ',
  sukh: 'সুখ',
  anondo: 'আনন্দ',
  hashi: 'হাসি',
  kanna: 'কান্না',
  bhoy: 'ভয়',
  asha: 'আশা',
  shopno: 'স্বপ্ন',
  shanti: 'শান্তি',

  // ── Pleasantries / common phrases ──────────────────────────────────────────
  dhonnobad: 'ধন্যবাদ',
  shagotom: 'স্বাগতম',
  namaskar: 'নমস্কার',
  assalamualaikum: 'আসসালামু আলাইকুম',
  bangla: 'বাংলা',
  bondhu: 'বন্ধু',
  manush: 'মানুষ',
  bharat: 'ভারত',
  bangladesh: 'বাংলাদেশ',

  // ── Nature / time-of-day (ো-kaar + vowel-length words the engine can't infer)
  bhor: 'ভোর',
  bhore: 'ভোরে',
  bhorer: 'ভোরের',
  shokalbela: 'সকালবেলা',
  alo: 'আলো',
  alor: 'আলোর',
  aloy: 'আলোয়',
  adhar: 'আঁধার',
  prithibi: 'পৃথিবী',
  prithibir: 'পৃথিবীর',
  prokriti: 'প্রকৃতি',
  shishir: 'শিশির',
  bindu: 'বিন্দু',
  pakhi: 'পাখি',
  pakhir: 'পাখির',
  shobuj: 'সবুজ', // casual `sh` spelling of সবুজ (canonical key is `sobuj`)
  dak: 'ডাক',
  daak: 'ডাক',

  // ── Common verbs / forms the sample needed ─────────────────────────────────
  othe: 'ওঠে', // জেগে ওঠে
  uthe: 'উঠে',
  uthi: 'উঠি',
  jege: 'জেগে',
  chheye: 'ছেয়ে',

  // ── Everyday high-frequency words ──────────────────────────────────────────
  kotha: 'কথা',
  shuru: 'শুরু',
  shesh: 'শেষ',
  jibon: 'জীবন',
  shomoy: 'সময়', // casual `sh` spelling of সময় (canonical key is `somoy`)
  onnorokom: 'অন্যরকম',
  shomvob: 'সম্ভব',
  sombhob: 'সম্ভব',
  oshomvob: 'অসম্ভব',
  jobe: 'যবে',

  // ── "ek-" compounds & similar inherent-অ words ─────────────────────────────
  // The phonetic engine joins consecutive consonants into a conjunct (kd→ক্দ),
  // so "ekdin" → এক্দিন. These common words carry a silent অ between the
  // consonants (এক‑দিন) that only the dictionary can supply.
  ekdin: 'একদিন',
  ekbar: 'একবার',
  ekjon: 'একজন',
  ekta: 'একটা',
  ekti: 'একটি',
  ektu: 'একটু',
  ekdom: 'একদম',
  eksathe: 'একসাথে',
  eksonge: 'একসঙ্গে',
  ekebare: 'একেবারে',
  protidin: 'প্রতিদিন',
  protibar: 'প্রতিবার',
  duijon: 'দুইজন',
  tinjon: 'তিনজন',

  // ── অ-initial words ────────────────────────────────────────────────────────
  // A leading `o` always becomes the independent vowel ও in the engine, but
  // these words start with the inherent অ sound, so the engine mis-spells them
  // (e.g. "onek" → ওনেক instead of অনেক).
  onek: 'অনেক',
  onekta: 'অনেকটা',
  onno: 'অন্য',
  ortho: 'অর্থ',
  olpo: 'অল্প',
  ongsho: 'অংশ',
  otit: 'অতীত',
  odhik: 'অধিক',
  odhikar: 'অধিকার',
  obostha: 'অবস্থা',
  oporadh: 'অপরাধ',
  onurodh: 'অনুরোধ',
  onumoti: 'অনুমতি',
  onuvuti: 'অনুভূতি',
  ovinoy: 'অভিনয়',
  ovab: 'অভাব',
  oshukh: 'অসুখ',

  // ── Common sibilant / retroflex / inherent-অ words the engine can't infer ──
  // `s`↔`sh` and `t`↔`Th` are ambiguous in casual Banglish, and silent অ
  // between consonants is invisible — so these high-frequency words need
  // canonical spellings. Both `s`/`sh` spellings are listed where people type
  // either.
  thik: 'ঠিক',
  ekhono: 'এখনো',
  kokhono: 'কখনো',
  kichu: 'কিছু',
  kichui: 'কিছুই',
  shob: 'সব',
  sob: 'সব',
  shobai: 'সবাই',
  shobkichu: 'সবকিছু',
  sotti: 'সত্যি',
  shotti: 'সত্যি',
  mittha: 'মিথ্যা',
  ichcha: 'ইচ্ছা',
  chesta: 'চেষ্টা',
  jinish: 'জিনিস',
  bishoy: 'বিষয়',
  shomossa: 'সমস্যা',
  somossa: 'সমস্যা',
  shorkar: 'সরকার',
  sorkar: 'সরকার',
  shadharon: 'সাধারণ',
  shahajjo: 'সাহায্য',
  sahajjo: 'সাহায্য',
  shomporko: 'সম্পর্ক',
  jonogon: 'জনগণ',

  // ── Clinical: dose & form ──────────────────────────────────────────────────
  // Most of these are loanwords the phonetic engine renders wrongly
  // (e.g. "tablet" → তাবলেত), so they need canonical spellings.
  tablet: 'ট্যাবলেট',
  tab: 'ট্যাব',
  capsule: 'ক্যাপসুল',
  cap: 'ক্যাপ',
  syrup: 'সিরাপ',
  injection: 'ইনজেকশন',
  inhaler: 'ইনহেলার',
  drop: 'ড্রপ',
  fota: 'ফোঁটা',
  chamoch: 'চামচ',
  matra: 'মাত্রা',
  dose: 'ডোজ',
  miligram: 'মিলিগ্রাম',
  mili: 'মিলি',
  unit: 'ইউনিট',
  adha: 'আধা',
  puro: 'পুরো',
  gota: 'গোটা',
  duto: 'দুটো',

  // ── Clinical: duration & frequency ─────────────────────────────────────────
  bar: 'বার',
  din: 'দিন',
  shoptaho: 'সপ্তাহ',
  shoptahe: 'সপ্তাহে',
  mash: 'মাস',
  mashe: 'মাসে',
  bochor: 'বছর',
  ghonta: 'ঘণ্টা',
  ghontay: 'ঘণ্টায়',
  proti: 'প্রতি',
  porpor: 'পরপর',
  ektana: 'একটানা',
  niyomito: 'নিয়মিত',

  // ── Clinical: instructions (when/how to take) ──────────────────────────────
  khabar: 'খাবার',
  khabarer: 'খাবারের',
  khaowar: 'খাওয়ার',
  khali: 'খালি',
  khalipete: 'খালিপেটে',
  pete: 'পেটে',
  bhora: 'ভরা',
  khaben: 'খাবেন',
  sheban: 'সেবন',
  gile: 'গিলে',
  chibiye: 'চিবিয়ে',
  lagaben: 'লাগাবেন',
  lagano: 'লাগানো',
  byabohar: 'ব্যবহার',
  ghum: 'ঘুম',
  ghumanor: 'ঘুমানোর',
  dupure: 'দুপুরে',
  bikele: 'বিকেলে',
  rate: 'রাতে',

  // ── Clinical: comments & follow-up ─────────────────────────────────────────
  bishram: 'বিশ্রাম',
  followup: 'ফলোআপ',
  porborti: 'পরবর্তী',
  porbortite: 'পরবর্তীতে',
  proyojon: 'প্রয়োজন',
  proyojone: 'প্রয়োজনে',
  dorkar: 'দরকার',
  bondho: 'বন্ধ',
  chaliye: 'চালিয়ে',
  cholbe: 'চলবে',
  report: 'রিপোর্ট',
  test: 'টেস্ট',
  porikkha: 'পরীক্ষা',
  doctor: 'ডাক্তার',
  daktar: 'ডাক্তার',
  rogi: 'রোগী',
  rog: 'রোগ',
  oshudh: 'ওষুধ',
  oushadh: 'ঔষধ',
  hashpatal: 'হাসপাতাল',
  chikitsa: 'চিকিৎসা',
  shustho: 'সুস্থ',

  // ── Clinical: common symptoms (referenced in comments) ─────────────────────
  jwor: 'জ্বর',
  byatha: 'ব্যথা',
  kashi: 'কাশি',
  shordi: 'সর্দি',
  bomi: 'বমি',
  mathabyatha: 'মাথাব্যথা',
  durbol: 'দুর্বল',
  durbolota: 'দুর্বলতা',
  gas: 'গ্যাস',
  allergy: 'অ্যালার্জি',

  // ── Everyday: greetings, social & interjections ────────────────────────────
  accha: 'আচ্ছা',
  achcha: 'আচ্ছা',
  are: 'আরে',
  bah: 'বাহ',
  ji: 'জি',
  shuvo: 'শুভ',
  shubho: 'শুভ',
  obhinondon: 'অভিনন্দন',
  dukkhito: 'দুঃখিত',
  maf: 'মাফ',
  doya: 'দয়া',

  // ── Festivals & occasions ──────────────────────────────────────────────────
  // These carry the retroflex ষ (typed `Sh` in strict Avro) plus an implicit-অ,
  // so the lowercase phonetic spelling people actually type ("borsho") would
  // otherwise render as বর্স্হ. Canonical spellings live here instead.
  noboborsho: 'নববর্ষ', // নববর্ষ — (Bengali) New Year, e.g. "shuvo noboborsho"
  nobborsho: 'নববর্ষ', // common alternate spelling
  borsho: 'বর্ষ', // বর্ষ — year / season
  borso: 'বর্ষ', // common alternate spelling
  borsha: 'বর্ষা', // বর্ষা — monsoon

  // ── Everyday: common verbs (base + frequent forms) ─────────────────────────
  lekha: 'লেখা',
  likhi: 'লিখি',
  likhe: 'লিখে',
  likhbo: 'লিখবো',
  kena: 'কেনা',
  kini: 'কিনি',
  kine: 'কিনে',
  kinbo: 'কিনবো',
  bosha: 'বসা',
  boshi: 'বসি',
  bose: 'বসে',
  boshbo: 'বসবো',
  rakha: 'রাখা',
  rakhi: 'রাখি',
  rakhe: 'রাখে',
  rakho: 'রাখো',
  chola: 'চলা',
  choli: 'চলি',
  chole: 'চলে',
  khola: 'খোলা',
  ana: 'আনা',
  ane: 'আনে',

  // ── Everyday: common nouns & loanwords (engine mis-spells these) ───────────
  taka: 'টাকা',
  poysa: 'পয়সা',
  dokan: 'দোকান',
  bajar: 'বাজার',
  school: 'স্কুল',
  iskul: 'স্কুল',
  office: 'অফিস',
  college: 'কলেজ',
  mobile: 'মোবাইল',
  computer: 'কম্পিউটার',
  internet: 'ইন্টারনেট',
  shorir: 'শরীর',
  kaj: 'কাজ',
  khela: 'খেলা',
  gan: 'গান',
  golpo: 'গল্প',
  khobor: 'খবর',
  chithi: 'চিঠি',
  chhuti: 'ছুটি',
  jonmodin: 'জন্মদিন',
  moja: 'মজা',

  // ── Everyday: common adjectives & adverbs ──────────────────────────────────
  khub: 'খুব',
  beshi: 'বেশি',
  kom: 'কম',
  shudhu: 'শুধু',
  matro: 'মাত্র',
  abar: 'আবার',
  aro: 'আরও',
  prai: 'প্রায়',
  pray: 'প্রায়',
  joldi: 'জলদি',
  taratari: 'তাড়াতাড়ি',
  aste: 'আস্তে',
  obosshoi: 'অবশ্যই',
} satisfies Record<string, string>;

export const BANGLISH_DICTIONARY: BanglishDictionary = Object.freeze(DEFAULT_ENTRIES);
