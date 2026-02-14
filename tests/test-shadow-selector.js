const { JSDOM } = require('jsdom');

// Create DOM for the test
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

console.log('🧪 Testing shadow-selector helper...');

const helper = require('../Web-2-Notion/shadow-selector.js');

let pass = 0;
let fail = 0;

function ok(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    pass++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   ${err && err.message}`);
    fail++;
  }
}

ok('querySelectorDeep finds element inside a shadow root', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const sr = host.attachShadow({ mode: 'open' });
  const span = document.createElement('span');
  span.className = 'inside';
  sr.appendChild(span);

  const found = helper.querySelectorDeep('.inside');
  if (!found || found.className !== 'inside') throw new Error('did not find .inside in shadow root');
});

ok('querySelectorAllDeep returns matches across nested shadow roots', () => {
  const hostA = document.createElement('div');
  document.body.appendChild(hostA);
  const srA = hostA.attachShadow({ mode: 'open' });

  const child = document.createElement('div');
  child.className = 'deep';
  srA.appendChild(child);

  const hostB = document.createElement('div');
  child.appendChild(hostB);
  const srB = hostB.attachShadow({ mode: 'open' });
  const inner = document.createElement('span');
  inner.className = 'deep';
  srB.appendChild(inner);

  const all = helper.querySelectorAllDeep('.deep');
  if (!Array.isArray(all) || all.length < 2) throw new Error('expected >=2 matches for .deep');
});

ok('invalid selector returns null/empty without throwing', () => {
  const bad = helper.querySelectorDeep('***invalid$$$');
  if (bad !== null) throw new Error('expected null for invalid selector');
  const badAll = helper.querySelectorAllDeep('***invalid$$$');
  if (!Array.isArray(badAll) || badAll.length !== 0) throw new Error('expected empty array for invalid selector');
});

ok('attaches helper to window', () => {
  if (typeof window.querySelectorDeep !== 'function') throw new Error('window.querySelectorDeep missing');
  if (typeof window.querySelectorAllDeep !== 'function') throw new Error('window.querySelectorAllDeep missing');
});

console.log('');
console.log(`Passed: ${pass}, Failed: ${fail}`);
if (fail > 0) process.exit(1);
process.exit(0);
