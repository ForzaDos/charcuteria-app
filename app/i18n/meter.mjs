// Uso: node app/i18n/meter.mjs  (después de agregar textos nuevos con tx() y sus traducciones en en.json / de.json)
// Mete en.json y de.json en index.html entre los marcadores I18N.
// Las claves con espacios al principio o al final (" · sin precio") se arman desde la versión recortada.
import fs from 'fs';
const D = new URL('./', import.meta.url);
const F = new URL('../index.html', import.meta.url);
let t = fs.readFileSync(F, 'utf8');
const crlf = t.includes('\r\n');
if (crlf) t = t.replace(/\r\n/g, '\n');
const des = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
const js = t.slice(t.indexOf('<script>'), t.indexOf('/* ===== I18N-DICCIONARIOS ===== */'));
const claves = new Set(JSON.parse(fs.readFileSync(new URL('claves.json', D), 'utf8')));
for (const m of js.matchAll(/\btx\('((?:[^'\\]|\\.)*)'/g)) claves.add(des(m[1]));
const AJUSTES = { en: {}, de: {} };
function bloque(idioma) {
  const d = Object.assign(JSON.parse(fs.readFileSync(new URL(idioma + '.json', D), 'utf8')), AJUSTES[idioma]);
  const sal = {};
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  const faltan = [];
  for (const k of claves) {
    let v = d[k];
    if (v === undefined) {
      const r = k.replace(/^\s+|\s+$/g, '');
      if (d[r] !== undefined) {
        const ini = k.match(/^\s*/)[0], fin = k.match(/\s*$/)[0];
        v = ini + d[r].replace(/^\s+|\s+$/g, '') + fin;
      }
    }
    if (v === undefined) { faltan.push(k); continue; }
    if (vars(k) !== vars(v)) { console.log(idioma + ' variables distintas: ' + k + ' => ' + v); continue; }
    sal[k] = v;
  }
  console.log(idioma + ': ' + Object.keys(sal).length + ' entradas; sin traducción: ' + faltan.length, faltan.slice(0, 20));
  const lineas = Object.keys(sal).map((k) => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(sal[k]));
  return '  I18N.' + idioma + ' = {\n' + lineas.join(',\n') + '\n  };\n';
}
const a = '  /* ===== I18N-DICCIONARIOS ===== */\n';
const b = '  /* ===== I18N-FIN ===== */';
const i = t.indexOf(a), j = t.indexOf(b);
if (i < 0 || j < 0) throw new Error('faltan marcadores');
t = t.slice(0, i + a.length) + bloque('en') + bloque('de') + t.slice(j);
fs.writeFileSync(F, crlf ? t.replace(/\n/g, '\r\n') : t);
console.log('listo');
