// Uso: node app/i18n/claves.mjs  -> regenera claves.json con todos los textos a traducir
// Junta todas las claves a traducir: tx('...'), textos fijos del HTML, tablas de etiquetas y textos de la hoja impresa.
import fs from 'fs';
const F = new URL('../index.html', import.meta.url);
const t = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
const claves = new Map();
const add = (s, origen) => { s = s.replace(/^\s+|\s+$/g, ''); if (!s || !/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(s)) return; if (!claves.has(s)) claves.set(s, origen); };
const des = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
const ini = t.indexOf('<script>');
const html = t.slice(t.indexOf('<body>'), ini);
const js = t.slice(ini, t.indexOf('/* ===== I18N-DICCIONARIOS ===== */'));
// HTML: texto entre etiquetas (fuera de <svg>) y atributos
const htmlSinSvg = html.replace(/<svg[\s\S]*?<\/svg>/g, '');
for (const m of htmlSinSvg.matchAll(/>([^<]+)</g)) add(m[1].replace(/\s+/g, ' '), 'html');
for (const m of htmlSinSvg.matchAll(/(?:placeholder|aria-label|title)="([^"]+)"/g)) add(m[1], 'attr');
// JS: tx('...')
for (const m of js.matchAll(/\btx\('((?:[^'\\]|\\.)*)'/g)) add(des(m[1]), 'tx');
// tx({...}[k] || '...')
for (const m of js.matchAll(/tx\(\{([^}]*)\}\[[^\]]+\] \|\| '((?:[^'\\]|\\.)*)'\)/g)) {
  for (const v of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) if (!/^[a-z]+$/.test(v[1])) add(des(v[1]), 'mapa');
  add(des(m[2]), 'mapa');
}
// tablas de etiquetas
const tabla = (re) => { const m = js.match(re); if (m) for (const v of m[1].matchAll(/:\s*'((?:[^'\\]|\\.)*)'/g)) add(des(v[1]), 'tabla'); };
tabla(/var TIPOS = \{([^}]*)\}/); tabla(/var ESTADOS_LOTE = \{([^}]*)\}/); tabla(/var GRUPOS_STOCK = \{([^}]*)\}/);
tabla(/var TIPOS_MOV = \{([\s\S]*?)\};/);
{ const m = js.match(/var TIPOS_TRIPA = \[([^\]]*)\]/); for (const v of m[1].matchAll(/'([^']*)'/g)) add(v[1], 'tabla'); }
for (const m of js.matchAll(/(?:papel|red|hilo|clip): \{ nombre: '([^']*)'/g)) add(m[1], 'tabla');
for (const m of js.matchAll(/cura[12]: \{ nombre: '([^']*)'/g)) add(m[1], 'tabla');
add('sin cura', 'tabla');
for (const m of js.matchAll(/\{ k: '[a-z]+', t: '([^']*)' \}/g)) add(m[1], 'filtro');
for (const m of js.matchAll(/\{ key: '[a-z]+', label: '([^']*)' \}/g)) add(m[1], 'cat');
for (const m of js.matchAll(/\['[a-z]+', '([A-ZÁÉÍÓÚ][^']*)'\]/g)) add(m[1], 'cat');
for (const m of js.matchAll(/vacio: '([^']*)'/g)) add(m[1], 'vacio');
for (const m of js.matchAll(/titulo: '([^']*)', rol:/g)) add(m[1], 'print');
// Hoja impresa: textos fijos dentro de literales HTML y rótulos de tablas
const desdeImp = js.slice(js.indexOf('function tablaImpresion'), js.indexOf('function abrirImpresion'));
for (const m of desdeImp.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
  const lit = des(m[1]);
  for (const x of lit.matchAll(/>([^<>]+)</g)) add(x[1], 'print');
}
for (const m of desdeImp.matchAll(/label: '([^']*)'/g)) add(m[1], 'print');
for (const m of desdeImp.matchAll(/\['([A-ZÁÉÍÓÚ][^']*)', /g)) add(m[1], 'print');
for (const m of desdeImp.matchAll(/stats\.push\(\['([^']*)'|\], \['([^']*)'/g)) add(m[1] || m[2], 'print');
const lista = [...claves.keys()];
fs.writeFileSync(new URL('claves.json', import.meta.url), JSON.stringify(lista, null, 1));
const cuenta = {};
for (const o of claves.values()) cuenta[o] = (cuenta[o] || 0) + 1;
console.log('claves: ' + lista.length, cuenta);
