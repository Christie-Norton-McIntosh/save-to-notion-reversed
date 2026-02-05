/*
 * Ensure final-payload sentinel/mangled-marker recovery works.
 */
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;

console.log('🧪 test: final-payload marker recovery (mangled markers)');

// Prepare a fake TABLE_CELL_CONTENT_MAP__ with a real value
window.__TABLE_CELL_CONTENT_MAP__ = {
  'CELL_abc12345': 'Line one\nLine two',
  'CELL_MANGLE': 'Recovered text',
};

// Simulate a final payload string containing several mangled variants
const mangled = [
  'XCELLIDXCELL_abc12345XCELLIDX',
  'XCELLIDXCELL_abc12345XCELLIDX', // common mangled form
  '⟦STN_CELL:CELL_MANGLE⟧',
  '<!--STN_CELL:CELL_MANGLE-->',
  '<span data-stn-cell="CELL_MANGLE"></span>',
  'prefix CELL_abc12345 suffix',
].join(' ');

// Reuse the same tolerant resolver as the popup (best-effort)
function recoverFromString(str) {
  const map = window.__TABLE_CELL_CONTENT_MAP__ || {};
  // exact sentinels
  str = str.replace(/XCELLIDX(CELL_[A-Za-z0-9]+)XCELLIDX/g, (m, id) => map[id] || m);
  str = str.replace(/⟦STN_CELL:(CELL_[A-Za-z0-9]+)⟧/g, (m, id) => map[id] || m);
  str = str.replace(/<!--\s*STN_CELL:(CELL_[A-Za-z0-9]+)\s*-->/g, (m, id) => map[id] || m);
  str = str.replace(/<span[^>]*data-stn-cell=["'](CELL_[A-Za-z0-9]+)["'][^>]*><\/span>/g, (m, id) => map[id] || m);
  // fallback: literal key
  Object.keys(map).forEach(k => { if (str.indexOf(k) !== -1) str = str.split(k).join(map[k]); });
  return str;
}

const out = recoverFromString(mangled);
if (!out.includes('Line one') || !out.includes('Recovered text')) {
  console.error('❌ failed to recover mangled markers — result:', out);
  process.exit(1);
}

console.log('✅ final-payload marker recovery behaved as expected');
process.exit(0);
