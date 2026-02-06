/**
 * DIAGNOSTIC: Run this in browser console on ServiceNow page to check extension state
 * 
 * 1. Open https://www.servicenow.com/docs/r/it-service-management/service-operations-workspace/start-conference-call-telephony.html
 * 2. Open browser DevTools console (F12)
 * 3. Paste this entire script and run it
 * 4. Share the output with developer
 */

console.log('🔍 ServiceNow Page Diagnostic - Save to Notion Extension');
console.log('='.repeat(80));

// Check 1: Extension is loaded
console.log('\n1️⃣  Checking if extension is loaded...');
if (typeof window.__imageUrlArray !== 'undefined') {
  console.log('   ✅ Extension globals detected');
} else {
  console.log('   ❌ Extension globals NOT found - extension may not be loaded');
}

// Check 2: Find tables with menucascade
console.log('\n2️⃣  Checking for menucascade elements...');
const menucascades = document.querySelectorAll('.ph.menucascade');
console.log(`   Found ${menucascades.length} menucascade elements`);
menucascades.forEach((el, i) => {
  const text = el.textContent.trim();
  const hasGt = text.includes('>');
  const hasSpaces = text.includes(' > ');
  console.log(`   [${i}] Text: "${text.substring(0, 100)}"`);
  console.log(`       Has '>': ${hasGt}, Has spaces: ${hasSpaces}`);
  
  // Check abbr element
  const abbr = el.querySelector('abbr');
  if (abbr) {
    console.log(`       <abbr> content: "${abbr.textContent}"`);
    console.log(`       <abbr> HTML: ${abbr.innerHTML}`);
  }
});

// Check 3: Find images in anchors
console.log('\n3️⃣  Checking for images in anchors...');
const imagesInAnchors = document.querySelectorAll('a img');
console.log(`   Found ${imagesInAnchors.length} images inside anchors`);
imagesInAnchors.forEach((img, i) => {
  const anchor = img.closest('a');
  const src = img.getAttribute('src') || img.src;
  const alt = img.getAttribute('alt');
  const anchorHref = anchor ? anchor.href : 'N/A';
  
  console.log(`   [${i}] Image:`);
  console.log(`       src: ${src.substring(0, 70)}...`);
  console.log(`       alt: "${alt}"`);
  console.log(`       anchor href: ${anchorHref.substring(0, 70)}...`);
  console.log(`       src type: ${src.startsWith('data:') ? 'BASE64' : src.startsWith('http') ? 'HTTP' : 'OTHER'}`);
  
  if (src.startsWith('data:') && anchorHref.includes('/viewer/attachment/')) {
    console.log(`       ⚠️  This is a BASE64 image with viewer/attachment anchor`);
    console.log(`       ⚠️  Extension should use anchor href: ${anchorHref.substring(0, 100)}`);
  }
});

// Check 4: Simulate table cell processing
console.log('\n4️⃣  Simulating table cell processing...');
const tables = document.querySelectorAll('table');
console.log(`   Found ${tables.length} tables`);

if (tables.length > 0) {
  const firstTable = tables[0];
  const firstCell = firstTable.querySelector('td');
  if (firstCell) {
    console.log('   Testing first table cell:');
    const clone = firstCell.cloneNode(true);
    
    // Check for images
    const imgs = clone.querySelectorAll('img');
    console.log(`   - Contains ${imgs.length} images`);
    
    // Check text content
    const text = clone.textContent;
    console.log(`   - Text content: "${text.substring(0, 150).replace(/\s+/g, ' ')}..."`);
    console.log(`   - Has ' > ': ${text.includes(' > ')}`);
    
    // Check for preserved images
    const preservedImgs = clone.querySelectorAll('img[data-stn-preserve="1"]');
    console.log(`   - Preserved images: ${preservedImgs.length}`);
  }
}

// Check 5: Extension version/file check
console.log('\n5️⃣  Extension file check...');
console.log('   To verify extension is up to date:');
console.log('   1. Go to chrome://extensions/');
console.log('   2. Find "Save to Notion"');
console.log('   3. Click "Reload" button (circular arrow)');
console.log('   4. Check "Last updated" timestamp');
console.log('   5. Re-run this diagnostic');

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY:');
console.log('   - Extension loaded:', typeof window.__imageUrlArray !== 'undefined' ? '✅' : '❌');
console.log('   - Menucascade elements:', menucascades.length);
console.log('   - Images in anchors:', imagesInAnchors.length);
console.log('   - Tables:', tables.length);
console.log('\n💡 Next steps:');
console.log('   1. Reload extension in chrome://extensions/');
console.log('   2. Refresh this page');
console.log('   3. Open extension popup and try saving');
console.log('   4. Check if issues persist');
console.log('='.repeat(80));
