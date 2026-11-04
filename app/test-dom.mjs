import fs from 'node:fs';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];

const idsHtml = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const unicos = [...new Set(idsHtml)];
const duplicados = idsHtml.filter((id, i) => idsHtml.indexOf(id) !== i);
const idsJs = [...new Set([...script.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]))];
const faltantes = idsJs.filter((id) => !idsHtml.includes(id));

let fallos = 0;
function ok(cond, msg, extra) {
  if (cond) console.log('  ok  ' + msg);
  else { fallos++; console.log('FALLA ' + msg + (extra ? ' -> ' + JSON.stringify(extra) : '')); }
}

console.log('\n== IDs ==');
console.log('  HTML: ' + idsHtml.length + ' (únicos: ' + unicos.length + ') · usados en JS: ' + idsJs.length);
ok(duplicados.length === 0, 'sin IDs duplicados', duplicados);
ok(faltantes.length === 0, 'todos los IDs que usa el JS existen en el HTML', faltantes);

const selectores = [
  '#tipos [data-tipo]',
  '#curas [data-cura]',
  '.tabbar [data-vista]',
  '#ingredientes .ing-g',
  '.ing-name',
  '.view',
  '.tabbar',
  '.toast',
  '.tabbar button[data-vista]'
];
selectores.forEach((sel) => {
  const base = sel.split(' ')[0].replace(/[.#]/g, '');
  ok(html.includes(base), 'existe el selector base ' + base);
});

console.log('\n== Referencias entre HTML y JS ==');
['view-lotes', 'view-receta', 'view-curado', 'view-procesos', 'view-compras', 'view-stock', 'view-recetario'].forEach((v) => {
  ok(html.includes('id="' + v + '"') && script.includes("'view-' + v"), 'vista ' + v + ' enlazada');
});
ok((html.match(/class="view/g) || []).length === 7, 'siete vistas declaradas');
ok((html.match(/data-vista=/g) || []).length === 4, 'cuatro botones de pestaña');
ok(html.includes('id="tipos"') && (html.match(/data-tipo=/g) || []).length === 5, 'cinco tipos de preparación (con embutido fresco)');
ok((html.match(/data-cura=/g) || []).length === 3, 'tres opciones de cura');
ok(html.includes('id="lista-recetario"'), 'lista del recetario');
ok(html.includes('id="procesos"') && html.includes('id="add-paso"'), 'editor de procesos');
ok(html.includes('id="nuevo-tipo"') && html.includes('value="carnico"'), 'alta de ingrediente con tipo cárnico');
ok(html.includes('id="lista-compras"') && html.includes('id="lista-prep"') && html.includes('id="lista-proc"'), 'lista de compras y lotes por estado');
ok(html.includes('id="lista-movs"') && html.includes('id="mov-overlay"') && html.includes('id="elaborar-overlay"'), 'movimientos, compras y elaborar');
ok(html.includes('id="datos-json"') && html.includes('id="datos-importar"'), 'respaldo: exportar e importar');
ok(!html.includes('stock-minimo'), 'sin stock mínimo');
ok(html.includes('id="compra-total"') && html.includes('id="compra-usado"') && html.includes('id="compra-falta"'), 'resumen de costos de compras');
ok(html.includes('id="lista-stock"') && html.includes('id="btn-existencia"') && html.includes('id="mov-total"'), 'stock con Cargar existencia y costo total');

console.log('\n== Offline y metadatos ==');
ok(!/<script[^>]+src=/.test(html), 'sin scripts externos');
ok(!/<link[^>]+href="http/.test(html), 'sin hojas de estilo externas');
ok(html.includes('name="viewport"'), 'viewport para móvil');
ok(html.includes('lang="es"'), 'idioma español');
ok(!/<img[^>]+src="http/.test(html), 'sin imágenes externas');

console.log('\n== Estructura ==');
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
ok((style.match(/{/g) || []).length === (style.match(/}/g) || []).length, 'llaves CSS balanceadas');
ok((html.match(/<div[\s>]/g) || []).length === (html.match(/<\/div>/g) || []).length, 'divs balanceados');
ok((html.match(/<button[\s>]/g) || []).length === (html.match(/<\/button>/g) || []).length, 'botones balanceados');
ok((style.match(/@media/g) || []).length >= 2, 'reglas responsive');
ok(html.includes('position:fixed') && html.includes('env(safe-area-inset-bottom)'), 'barra inferior fija con safe-area');

console.log('\n' + (fallos ? 'FALLOS: ' + fallos : 'TODO OK'));
process.exit(fallos ? 1 : 0);
