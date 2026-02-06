const { JSDOM } = require('jsdom');
const html = `
<td>
  Parent intro
  <table>
    <tr><td>i1</td><td>i2</td></tr>
    <tr><td>i3</td><td>i4</td></tr>
  </table>
  Parent outro
</td>`;
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const document = dom.window.document;
const tempDiv = document.createElement('div');
tempDiv.innerHTML = html;
console.log('tempDiv.childElementCount=', tempDiv.childElementCount);
const outer = tempDiv.querySelector(':scope > td') || tempDiv.querySelector('td') || tempDiv;
console.log('outer.tagName=', outer.tagName);
console.log('outer.childElementCount=', outer.childElementCount);
console.log('outer.querySelectorAll td length=', outer.querySelectorAll('td').length);
console.log('outer.textContent:', JSON.stringify(outer.textContent));
console.log('outer.innerHTML:', outer.innerHTML);
