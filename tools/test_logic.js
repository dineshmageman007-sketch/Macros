// How to run: node tools/test_logic.js   (headless, no browser needed; stubs the DOM)
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'app/src/main/assets/index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];

const els = {}, store = {}, alerts = [];
const el = id => els[id] || (els[id] = {
  innerHTML: '', value: '', classList: { add() {}, remove() {}, contains() { return false; } },
  addEventListener() {}, scrollIntoView() {}, focus() {}, select() {}, click() {}, remove() {},
  querySelector() { return { value: '' }; }, files: []
});
const ctx = vm.createContext({
  document: { getElementById: el, querySelectorAll: () => [], createElement: () => el('_a'), body: { appendChild() {} } },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  window: { addEventListener() {} }, navigator: {}, alert: m => alerts.push(m), confirm: () => true,
  URL: { createObjectURL() { return ''; }, revokeObjectURL() {} }, Blob: function () {}, FileReader: function () {},
  setTimeout, console
});
vm.runInContext(script, ctx);
const run = code => vm.runInContext(code, ctx);

let failed = 0;
function check(name, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failed++; }

check('initial render works', els['tab-today'].innerHTML.includes('Corn Flakes'));
check('esc escapes html', run(`esc('<b a="1">&\\'')`) === '&lt;b a=&quot;1&quot;&gt;&amp;&#39;');
check('macros: 50g corn flakes = 189 kcal', Math.round(run(`macrosFor('cornflakes',50).kcal`)) === 189);

// streak: nothing logged -> 0; tick one food -> 1
check('streak starts at 0', run('calcStreaks().current') === 0);
run(`quickToggle('it_cornflakes','food')`);
check('streak is 1 after logging today', run('calcStreaks().current') === 1);

// markup injection through a food name must not reach the page as real tags
run(`db.push({id:'evil',name:'<img src=x onerror=alert(1)>',group:'',basis:100,kcal:1,carbs:0,protein:0,fat:0,fibre:0,note:'<b>n</b>',icon:'<i>',color:'red;x'});
     tpl.items.push({id:'it_evil',kind:'food',foodId:'evil',qty:10}); renderToday(); renderDB();`);
check('today view escapes names', !els['tab-today'].innerHTML.includes('<img src=x'));
check('database view escapes names + notes', !els['tab-db'].innerHTML.includes('<img src=x') && !els['tab-db'].innerHTML.includes('<b>n</b>'));
check('bad color is not injected into style', !els['tab-today'].innerHTML.includes('red;x'));
check('jsEsc is safe inside a double-quoted attribute', !run(`jsEsc('a"b\\'c')`).includes('"'));

// backup round trip + validation
const good = JSON.parse(run(`JSON.stringify({db,tpl,groups,logs,targets})`));
const clean = run(`sanitizeBackup(${JSON.stringify(good)})`);
check('own backup passes validation', clean.db.length === good.db.length && clean.tpl.items.length === good.tpl.items.length);
const throwsOn = obj => { try { run(`sanitizeBackup(${JSON.stringify(obj)})`); return false; } catch (e) { return true; } };
check('rejects non-backup json', throwsOn({ hello: 1 }));
check('rejects unsafe food id', throwsOn({ db: [{ id: "x'),alert(1);('", name: 'a' }], tpl: { items: [] } }));
check('rejects unsafe item id', throwsOn({ db: [], tpl: { items: [{ id: 'a"b', kind: 'food' }] } }));
const dirty = run(`sanitizeBackup(${JSON.stringify({ db: [{ id: 'a1', name: 'N', basis: 7, kcal: 'abc', carbs: -5, color: 'url(x)' }], tpl: { items: [] }, logs: { 'bad-date': {}, '2026-01-02': { checked: { a1: 1 } } }, targets: { kcal: 'x' } })})`);
check('numbers/basis/color are coerced', dirty.db[0].kcal === 0 && dirty.db[0].carbs === 0 && dirty.db[0].basis === 100 && dirty.db[0].color === '');
check('bad log dates dropped, good kept', !('bad-date' in dirty.logs) && dirty.logs['2026-01-02'].checked.a1 === true);
check('empty targets become null', dirty.targets === null);

console.log(failed ? `\n${failed} FAILED` : '\nAll tests passed');
process.exit(failed ? 1 : 0);
