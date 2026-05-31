// Avro Phonetic Playground logic.
//
// Imports from the self-hosted build (`./dist/index.js`). On Vercel the build
// step compiles the library and copies `dist/` next to this file, so there is
// no third-party CDN dependency at runtime. To run locally, build the library
// (`pnpm build`) and serve the folder over http (ESM cannot load over file://).
import { toBangla } from './dist/index.js';

const examples = [
  // Dictionary-backed canonical spellings
  'hobe',
  'ami hobe',
  'tumi kemon acho',
  'apni ki korben',
  'dhonnobad bondhu',
  // Classic phonetic-engine examples
  'amar sonar bangla',
  'ami banglay gan gai',
  'khub bhalo',
  'Dhaka Bangladesh'
];

const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const digitsEl = document.getElementById('banglaDigits');
const stopEl = document.getElementById('banglaFullStop');
const dictEl = document.getElementById('useDictionary');
const chipsEl = document.getElementById('chips');

function convert() {
  const text = inputEl.value;
  if (!text.trim()) {
    outputEl.textContent = 'output will appear here…';
    outputEl.classList.add('empty');
    statusEl.textContent = 'ready';
    statusEl.className = 'status';
    return;
  }
  try {
    const result = toBangla(text, {
      banglaDigits: digitsEl.checked,
      banglaFullStop: stopEl.checked,
      dictionary: dictEl.checked,
    });
    outputEl.textContent = result;
    outputEl.classList.remove('empty');
    statusEl.textContent =
      `${text.length} chars → ${result.length} chars` +
      (dictEl.checked ? '' : '  ·  dictionary off');
    statusEl.className = 'status';
  } catch (err) {
    statusEl.textContent = err instanceof Error ? err.message : String(err);
    statusEl.className = 'status error';
  }
}

inputEl.addEventListener('input', convert);
digitsEl.addEventListener('change', convert);
stopEl.addEventListener('change', convert);
dictEl.addEventListener('change', convert);

// Build example chips
for (const ex of examples) {
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.textContent = ex;
  chip.addEventListener('click', () => {
    inputEl.value = ex;
    convert();
    inputEl.focus();
  });
  chipsEl.appendChild(chip);
}
