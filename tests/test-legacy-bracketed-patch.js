/*/*

 * Test that LEGACY:bracketed placeholders are prevented in table contexts * Test that LEGACY:bracketed placeholders are prevented in table contexts

 */ */



const fs = require('fs');const { JSDOM } = require("jsdom");

const fs = require('fs');

// Load the patch code

const patchCode = fs.readFileSync('./Web-2-Notion/popup/shim/legacy-bracketed-patch.js', 'utf8');const fs = require('fs');



console.log("🧪 Testing LEGACY:bracketed Prevention Patch\n");// Load the patch



// Test 1: Check that the patch code contains the expected logic// Set up global DOM

console.log("Test 1: Patch contains table context detection");

const hasTableDetection = patchCode.includes('isInTableContext') || patchCode.includes('table');const globalDom = new JSDOM("<!doctype html><html><body></body></html>");const { JSDOM } = require("jsdom");const patchCode = fs.readFileSync('./Web-2-Notion/popup/shim/legacy-bracketed-patch.js', 'utf8');

const hasMutationObserver = patchCode.includes('MutationObserver');

const hasBracketedPrevention = patchCode.includes('[alt]') || patchCode.includes('bracketed');global.window = globalDom.window;



console.log("  Table context detection:", hasTableDetection ? "✅" : "❌");global.document = globalDom.window.document;const fs = require('fs');

console.log("  MutationObserver usage:", hasMutationObserver ? "✅" : "❌");

console.log("  Bracketed prevention logic:", hasBracketedPrevention ? "✅" : "❌");global.Node = globalDom.window.Node;



if (hasTableDetection && hasMutationObserver && hasBracketedPrevention) {// Test HTML with table containing images

  console.log("  ✅ PASSED - Patch contains expected logic\n");

} else {// Load the patch

  console.log("  ❌ FAILED - Missing expected logic\n");

}const patchCode = fs.readFileSync('./Web-2-Notion/popup/shim/legacy-bracketed-patch.js', 'utf8');// Set up global DOMconst testHtml = `



// Test 2: Check that patch is loaded in HTML

console.log("Test 2: Patch is loaded in popup HTML");

const htmlContent = fs.readFileSync('./Web-2-Notion/popup/index.html', 'utf8');console.log("🧪 Testing LEGACY:bracketed Prevention Patch\n");const globalDom = new JSDOM("<!doctype html><html><body></body></html>");<table>

const hasPatchScript = htmlContent.includes('legacy-bracketed-patch.js');

const hasMainJsAfter = htmlContent.indexOf('legacy-bracketed-patch.js') < htmlContent.indexOf('main.js');



console.log("  Patch script included:", hasPatchScript ? "✅" : "❌");// Test 1: Table context should prevent [alt] placeholdersglobal.window = globalDom.window;  <tr>

console.log("  Patch loads before main.js:", hasMainJsAfter ? "✅" : "❌");

console.log("Test 1: Table context prevents [alt] placeholders");

if (hasPatchScript && hasMainJsAfter) {

  console.log("  ✅ PASSED - Patch properly integrated\n");const testHtml1 = '<table><tr><td><img src="test.png" alt="Automate IT service" />Some text</td></tr></table>';global.document = globalDom.window.document;    <td>

} else {

  console.log("  ❌ FAILED - Patch not properly integrated\n");const dom1 = new JSDOM(testHtml1, {

}

  runScripts: 'dangerously',global.Node = globalDom.window.Node;      <img src="test.png" alt="Automate IT service" />

// Test 3: Check that dev-tools copy exists

console.log("Test 3: Dev-tools copy exists");  resources: 'usable'

const devToolsExists = fs.existsSync('./dev-tools/legacy-bracketed-patch.js');

});      Some text

console.log("  Dev-tools copy exists:", devToolsExists ? "✅" : "❌");



if (devToolsExists) {

  console.log("  ✅ PASSED - Dev-tools copy available\n");const document1 = dom1.window.document;// Load the patch    </td>

} else {

  console.log("  ❌ FAILED - Dev-tools copy missing\n");

}

// Load the patchconst patchCode = fs.readFileSync('./Web-2-Notion/popup/shim/legacy-bracketed-patch.js', 'utf8');  </tr>

console.log("✅ LEGACY:bracketed prevention patch validation completed!");
const script1 = document1.createElement('script');

script1.textContent = patchCode;</table>

document1.head.appendChild(script1);

console.log("🧪 Testing LEGACY:bracketed Prevention Patch\n");`;

// Simulate the main.js processing that would create [alt] placeholders

const img1 = document1.querySelector('img');

const alt1 = img1.getAttribute('alt');

const td1 = img1.parentElement;// Test 1: Table context should prevent [alt] placeholdersdescribe('LEGACY:bracketed Prevention Patch', () => {



// Simulate what the CN(image) path might do - replace img with [alt]console.log("Test 1: Table context prevents [alt] placeholders");  let dom;

img1.remove();

td1.insertBefore(document1.createTextNode('[' + alt1 + ']'), td1.firstChild);const dom1 = new JSDOM(`  let window;



// Check if the patch prevented the [alt] placeholder  <table>  let document;

const bracketedText1 = td1.textContent.match(/\[([^\]]+)\]/);

const hasImage1 = td1.querySelector('img') !== null;    <tr>



console.log("  Bracketed text found:", bracketedText1 ? bracketedText1[0] : "none");      <td>  beforeEach(() => {

console.log("  Image preserved:", hasImage1);

        <img src="test.png" alt="Automate IT service" />    dom = new JSDOM(testHtml, {

if (!bracketedText1 && hasImage1) {

  console.log("  ✅ PASSED - LEGACY:bracketed prevented in table context\n");        Some text      runScripts: 'dangerously',

} else {

  console.log("  ❌ FAILED - LEGACY:bracketed not prevented\n");      </td>      resources: 'usable'

  console.log("    Expected: no bracketed text, image preserved");

  console.log("    Got: bracketed=" + (bracketedText1 ? "yes" : "no") + ", image=" + (hasImage1 ? "yes" : "no"));    </tr>    });

}

  </table>    window = dom.window;

// Test 2: Non-table context should allow [alt] placeholders

console.log("Test 2: Non-table context allows [alt] placeholders");`, {    document = window.document;

const testHtml2 = '<div><img src="test.png" alt="Normal image" /></div>';

const dom2 = new JSDOM(testHtml2, {  runScripts: 'dangerously',

  runScripts: 'dangerously',

  resources: 'usable'  resources: 'usable'    // Load the patch

});

});    const script = document.createElement('script');

const document2 = dom2.window.document;

    script.textContent = patchCode;

// Load the patch

const script2 = document2.createElement('script');const document1 = dom1.window.document;    document.head.appendChild(script);

script2.textContent = patchCode;

document2.head.appendChild(script2);  });



// Simulate replacement// Load the patch

const img2 = document2.querySelector('img');

const alt2 = img2.getAttribute('alt');const script1 = document1.createElement('script');  test('should prevent [alt] placeholders in table contexts', () => {

const div2 = img2.parentElement;

script1.textContent = patchCode;    // Simulate the main.js processing that would create [alt] placeholders

img2.remove();

div2.insertBefore(document2.createTextNode('[' + alt2 + ']'), div2.firstChild);document1.head.appendChild(script1);    const img = document.querySelector('img');



// Should still have [alt] text in non-table context    const alt = img.getAttribute('alt');

const bracketedText2 = div2.textContent.match(/\[([^\]]+)\]/);

// Simulate the main.js processing that would create [alt] placeholders

console.log("  Bracketed text found:", bracketedText2 ? bracketedText2[0] : "none");

const img1 = document1.querySelector('img');    // Simulate what the CN(image) path might do - replace img with [alt]

if (bracketedText2 && bracketedText2[1] === 'Normal image') {

  console.log("  ✅ PASSED - LEGACY:bracketed allowed in non-table context\n");const alt1 = img1.getAttribute('alt');    const td = img.parentElement;

} else {

  console.log("  ❌ FAILED - LEGACY:bracketed incorrectly prevented\n");const td1 = img1.parentElement;    img.remove();

}

    td.insertBefore(document.createTextNode(`[${alt}]`), td.firstChild);

console.log("✅ LEGACY:bracketed prevention patch test completed!");
// Simulate what the CN(image) path might do - replace img with [alt]

img1.remove();    // The patch should have intercepted this and preserved the image

td1.insertBefore(document1.createTextNode(`[${alt1}]`), td1.firstChild);    const bracketedText = td.textContent.match(/\[([^\]]+)\]/);

    expect(bracketedText).toBeNull(); // Should not have [alt] text

// Check if the patch prevented the [alt] placeholder

const bracketedText1 = td1.textContent.match(/\[([^\]]+)\]/);    // Should still have the image or a marker

const hasImage1 = td1.querySelector('img') !== null;    const hasImage = td.querySelector('img') !== null;

const hasMarker1 = td1.getAttribute && td1.getAttribute('data-stn-prevent-bracketed') === 'true';    const hasMarker = td.getAttribute('data-stn-prevent-bracketed') === 'true';

    expect(hasImage || hasMarker).toBe(true);

console.log("  Bracketed text found:", bracketedText1 ? bracketedText1[0] : "none");  });

console.log("  Image preserved:", hasImage1);

console.log("  Prevention marker:", hasMarker1);  test('should allow [alt] in non-table contexts', () => {

    // Create a non-table context

if (!bracketedText1 && (hasImage1 || hasMarker1)) {    const div = document.createElement('div');

  console.log("  ✅ PASSED - LEGACY:bracketed prevented in table context\n");    div.innerHTML = '<img src="test.png" alt="Normal image" />';

} else {    document.body.appendChild(div);

  console.log("  ❌ FAILED - LEGACY:bracketed not prevented\n");

  process.exit(1);    const img = div.querySelector('img');

}    const alt = img.getAttribute('alt');



// Test 2: Non-table context should allow [alt] placeholders    // Simulate replacement

console.log("Test 2: Non-table context allows [alt] placeholders");    img.remove();

const dom2 = new JSDOM(`    div.insertBefore(document.createTextNode(`[${alt}]`), div.firstChild);

  <div>

    <img src="test.png" alt="Normal image" />    // Should still have [alt] text in non-table context

  </div>    const bracketedText = div.textContent.match(/\[([^\]]+)\]/);

`, {    expect(bracketedText).toBeTruthy();

  runScripts: 'dangerously',    expect(bracketedText[1]).toBe('Normal image');

  resources: 'usable'  });

});});

const document2 = dom2.window.document;

// Load the patch
const script2 = document2.createElement('script');
script2.textContent = patchCode;
document2.head.appendChild(script2);

// Simulate replacement
const img2 = document2.querySelector('img');
const alt2 = img2.getAttribute('alt');
const div2 = img2.parentElement;

img2.remove();
div2.insertBefore(document2.createTextNode(`[${alt2}]`), div2.firstChild);

// Should still have [alt] text in non-table context
const bracketedText2 = div2.textContent.match(/\[([^\]]+)\]/);

console.log("  Bracketed text found:", bracketedText2 ? bracketedText2[0] : "none");

if (bracketedText2 && bracketedText2[1] === 'Normal image') {
  console.log("  ✅ PASSED - LEGACY:bracketed allowed in non-table context\n");
} else {
  console.log("  ❌ FAILED - LEGACY:bracketed incorrectly prevented\n");
  process.exit(1);
}

console.log("✅ All LEGACY:bracketed prevention tests PASSED!");