import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

// 1) compilar el script completo (detecta errores de sintaxis sin ejecutarlo)
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error('Se esperaba un solo <script>, hay ' + scripts.length);
new Function(scripts[0][1]);

// 2) aislar el bloque de cálculo puro
const ini = html.indexOf('/* ===== CALC-INICIO ===== */');
const fin = html.indexOf('/* ===== CALC-FIN ===== */');
if (ini < 0 || fin < 0) throw new Error('No encontré los marcadores CALC');
const ctx = vm.createContext({});
vm.runInContext(html.slice(ini, fin), ctx);
const compute = ctx.compute;
const RECETAS = ctx.RECETAS;

let fallos = 0;
function ok(cond, msg, extra) {
  if (cond) {
    console.log('  ok  ' + msg);
  } else {
    fallos++;
    console.log('FALLA ' + msg + (extra === undefined ? '' : ' -> ' + JSON.stringify(extra)));
  }
}
function cerca(a, b, tol, msg) {
  ok(Math.abs(a - b) <= tol, msg + ' (' + a + ' ≈ ' + b + ')', { obtenido: a, esperado: b });
}
function estadoDe(id, extra = {}) {
  const r = RECETAS[id];
  return {
    tipo: r.tipo,
    kg: 1,
    merma: r.merma,
    calibre: r.calibre || 40,
    curaTipo: r.curaTipo,
    curaPct: r.curaPct,
    ingredientes: (r.ingredientes || []).map((x) => ({ ...x })),
    brine: r.brine ? { ...r.brine } : { litros: 1, salPct: 10 },
    costoCarne: 0,
    costoOtros: 0,
    ...extra
  };
}
function alertaBad(r) {
  return r.alertas.some((a) => a.tone === 'bad');
}
function textos(r) {
  return r.alertas.map((a) => a.texto).join(' | ');
}

console.log('\n== Salame Tandil 1 kg (cura #2 0,25 %) ==');
{
  const r = compute(estadoDe('salame'));
  cerca(r.salPct, 2.46875, 0.0001, 'sal total %');
  cerca(r.nitritoPpm, 156.25, 0.01, 'nitrito ppm');
  cerca(r.nitratoPpm, 156.25, 0.01, 'nitrato ppm');
  cerca(r.azucarPct, 0.5, 0.0001, 'azúcar %');
  cerca(r.componentesG, 933.97, 0.01, 'componentes de carne g');
  cerca(r.carnicosG, 747.17, 0.01, 'cárnicos g');
  cerca(r.grasaG, 186.79, 0.01, 'tocino g');
  cerca(r.componentesPct, 100, 0.01, 'composición total %');
  cerca(r.carnicosPct, 80, 0.01, 'cárnicos %');
  cerca(r.grasaPct, 20, 0.01, 'tocino %');
  cerca(r.insumosG, 66.03, 0.01, 'insumos g');
  cerca(r.pesoMezclaKg, 1.0, 0.0001, 'mezcla kg');
  cerca(r.pesoFinalKg, 0.65, 0.00001, 'peso final kg');
  cerca(r.kgPorMetro, 1.3823, 0.001, 'kg/m calibre 40');
  cerca(r.metros, 0.72343, 0.001, 'metros de tripa');
  ok(r.tonos.sal === 'ok', 'semáforo de sal en verde');
  ok(!alertaBad(r), 'sin alertas rojas', textos(r));
}

console.log('\n== Salame Tandil 8 kg (receta de la tabla) ==');
{
  const r = compute(estadoDe('salame', { kg: 8 }));
  cerca(r.ing[0].g, 4109.46, 0.01, 'carne de cerdo g');
  cerca(r.ing[1].g, 1867.94, 0.01, 'carne de vaca g');
  cerca(r.ing[2].g, 1494.35, 0.01, 'tocino g');
  cerca(r.componentesG, 7471.75, 0.01, 'componentes g');
  cerca(r.carnicosG, 5977.40, 0.01, 'cárnicos g');
  cerca(r.grasaG, 1494.35, 0.01, 'tocino g');
  cerca(r.componentesPct, 100, 0.01, 'componentes %');
  cerca(r.carnicosPct, 80, 0.01, 'cárnicos %');
  cerca(r.grasaPct, 20, 0.01, 'tocino %');
  cerca(r.insumosG, 528.25, 0.01, 'insumos g');
  cerca(r.pesoMezclaKg, 8.0, 0.0001, 'mezcla kg');
  cerca(r.salPct, 2.46875, 0.0001, 'sal total %');
  cerca(r.nitritoPpm, 156.25, 0.01, 'nitrito ppm');
  cerca(r.pesoFinalKg, 5.2, 0.0001, 'peso final kg');
}

console.log('\n== Composición que no suma 100 % ==');
{
  const base = estadoDe('salame');
  base.ingredientes[0].pct = 50;
  const r = compute(base);
  ok(textos(r).includes('composición'), 'avisa que la composición no suma 100 %', textos(r));
}

console.log('\n== Cura #1: no aporta nitrato ==');
{
  const r = compute(estadoDe('salame', { curaTipo: 'cura1' }));
  cerca(r.nitritoPpm, 156.25, 0.01, 'nitrito ppm');
  cerca(r.nitratoPpm, 0, 0.0001, 'nitrato 0 ppm');
  ok(alertaBad(r), 'cura #1 en un fermentado es alerta roja (botulismo)', textos(r));
  ok(textos(r).includes('botulismo') && textos(r).includes('cura #2'), 'explica el riesgo y pide cura #2');
}

console.log('\n== Dosis excesiva de cura ==');
{
  const r = compute(estadoDe('salame', { curaPct: 0.5 }));
  cerca(r.nitritoPpm, 312.5, 0.01, 'nitrito 312,5 ppm');
  ok(alertaBad(r), 'marca alerta roja');
}

console.log('\n== Sin cura en un fermentado ==');
{
  const r = compute(estadoDe('salame', { curaTipo: 'ninguna', curaPct: 0 }));
  ok(alertaBad(r), 'marca riesgo de botulismo');
}

console.log('\n== Sin cura pero con dosis vieja guardada ==');
{
  const r = compute(estadoDe('salame', { curaTipo: 'ninguna', curaPct: 2 }));
  ok(!textos(r).includes('Dosis de cura'), 'no alerta dosis si la cura está desactivada', textos(r));
  ok(alertaBad(r), 'igual avisa por falta de cura');
}

console.log('\n== Dosis de cura demasiado baja ==');
{
  const r = compute(estadoDe('salame', { curaPct: 0.05 }));
  ok(textos(r).includes('0,1 %'), 'avisa dosis baja', textos(r));
}

console.log('\n== Bondiola Casera: entero ==');
{
  const r = compute(estadoDe('bondiola'));
  cerca(r.salPct, 2.71875, 0.0001, 'sal total %');
  // Entero: 1 kg de carne + 3,91 % de aditivos y cura = 1,0391 kg de mezcla.
  cerca(r.pesoFinalKg, 1.0391 * 0.62, 0.0001, 'peso final 38 % de merma (la carne más los aditivos)');
  ok(r.aw > 0.88 && r.aw < 0.90, 'aw estimado ~0,894');
  ok(r.tonos.sal === 'ok', 'sal en verde');
}

console.log('\n== Panceta Curada al 28 % de merma ==');
{
  const r = compute(estadoDe('panceta'));
  cerca(r.salPct, 2.71875, 0.0001, 'sal total %');
  cerca(r.azucarPct, 1.2, 0.0001, 'azúcar %');
  cerca(r.aw, 0.914, 0.0001, 'aw estimado');
  ok(!alertaBad(r), 'sin alertas rojas', textos(r));
}

console.log('\n== Embutido fresco y cocido: cura #1, nunca #2 ==');
{
  const fresco = compute(estadoDe('leberwurst', { tipo: 'fresco', curaTipo: 'cura1', precioTripa: 100 }));
  ok(!alertaBad(fresco), 'fresco con cura #1: sin alertas rojas', textos(fresco));
  ok(fresco.costoTripa > 0 && Math.abs(fresco.costoTripa - fresco.metros * 100) < 1e-6, 'el fresco lleva tripa: metros y costo');
  cerca(fresco.pesoMezclaKg, 1, 0.0001, 'en el fresco los kg son la mezcla total');
  const mal = compute(estadoDe('leberwurst', { tipo: 'fresco', curaTipo: 'cura2' }));
  ok(alertaBad(mal) && textos(mal).includes('nitrosaminas'), 'fresco con cura #2: alerta roja por nitrosaminas', textos(mal));
  const coc = compute(estadoDe('leberwurst', { curaTipo: 'cura2' }));
  ok(alertaBad(coc) && textos(coc).includes('nitrosaminas'), 'cocido con cura #2: alerta roja por nitrosaminas', textos(coc));
  const ent = compute(estadoDe('bondiola', { curaTipo: 'cura1' }));
  ok(alertaBad(ent) && textos(ent).includes('botulismo'), 'entero con cura #1: alerta roja por botulismo', textos(ent));
}

console.log('\n== Leberwurst 1 kg (cocido, cura #1) ==');
{
  const r = compute(estadoDe('leberwurst'));
  cerca(r.componentesG, 925.50, 0.01, 'componentes g');
  cerca(r.componentesPct, 100, 0.01, 'componentes %');
  cerca(r.carnicosPct, 65, 0.01, 'cárnicos %');
  cerca(r.grasaPct, 35, 0.01, 'tocino %');
  cerca(r.salPct, 2.234375, 0.0001, 'sal total %');
  cerca(r.nitritoPpm, 156.25, 0.01, 'nitrito ppm');
  cerca(r.nitratoPpm, 0, 0.0001, 'nitrato 0 ppm');
  cerca(r.azucarPct, 0, 0.0001, 'azúcar %');
  cerca(r.pesoMezclaKg, 1.0, 0.0001, 'mezcla kg');
  ok(!alertaBad(r), 'sin alertas rojas', textos(r));
}

console.log('\n== Salmuera 10 % sobre agua, 1 kg + 1 L ==');
{
  const r = compute(estadoDe('salmuera10'));
  cerca(r.salG, 100, 0.0001, 'sal g');
  cerca(r.salPct, 5, 0.0001, 'sal total % sobre carne + agua');
  cerca(r.baume, 9.57, 0.02, 'grados Baumé');
  ok(r.diasBrine === 2, 'tiempo orientativo 2 días');
  ok(!alertaBad(r), 'sin alertas rojas', textos(r));
  ok(r.alertas.length === 0, 'inmersión corta sin cura: sin advertencias', textos(r));
}

console.log('\n== Salmuera 10 % con cura #2 ==');
{
  const r = compute(estadoDe('salmuera10', { curaTipo: 'cura2', curaPct: 0.25 }));
  cerca(r.nitritoPpm, 78.125, 0.01, 'nitrito sobre carne + agua');
  ok(!alertaBad(r), 'sin alertas rojas', textos(r));
}

console.log('\n== Salmuera equilibrio 5 % sobre agua ==');
{
  const r = compute(estadoDe('salmueraEq'));
  cerca(r.salPct, 2.5, 0.0001, 'sal total %');
  cerca(r.baume, 4.84, 0.05, 'grados Baumé');
  ok(r.diasBrine === 7, 'equilibrio: 7 días orientativos');
  ok(textos(r).includes('botulismo'), 'avisa por inmersión larga sin cura', textos(r));
}

console.log('\n== Costos por ingrediente ==');
{
  const r = compute(estadoDe('salame', {
    precios: {
      'Carne de cerdo': 5000,
      'Carne de vaca': 6000,
      'Tocino': 3000,
      'Sal fina / entrefina': 1000,
      'Cura #2': 20000
    },
    precioTripa: 100
  }));
  cerca(r.costoIngredientes, 4550.76, 0.01, 'costo de ingredientes');
  cerca(r.costoCura, 46.70, 0.01, 'costo de cura');
  cerca(r.costoTripa, 72.34, 0.02, 'costo de tripa');
  cerca(r.costoTotal, 4669.80, 0.1, 'costo total con precios');
  const r2 = compute(estadoDe('salame', {
    costoCarne: 8000, costoOtros: 500,
    precios: { 'Carne de cerdo': 5000 }
  }));
  cerca(r2.costoTotal, 2568.41, 0.01, 'los precios pisan el costo manual');
}

console.log('\n== Casos borde ==');
{
  const r0 = compute({ ...estadoDe('salame'), kg: 0 });
  ok(Number.isFinite(r0.pesoFinalKg) && Number.isFinite(r0.nitritoPpm), 'kg = 0 no genera NaN');
  const rVacio = compute({ tipo: 'fermentado', kg: 1, ingredientes: [], curaTipo: 'ninguna', curaPct: 0, merma: 35 });
  ok(Number.isFinite(rVacio.salPct) && Number.isFinite(rVacio.pesoFinalKg), 'estado vacío no rompe');
  ok(alertaBad(rVacio), 'sin sal y sin cura da alertas rojas');
  const rCal60 = compute({ ...estadoDe('salame'), calibre: 60 });
  cerca(rCal60.kgPorMetro, 3.11, 0.01, 'kg/m calibre 60');
  const rPesado = compute({ ...estadoDe('salame'), kg: 12.5, costoCarne: 8000, costoOtros: 500 });
  cerca(rPesado.pesoMezclaKg, 12.5, 0.001, 'escala a 12,5 kg');
  cerca(rPesado.costoTotal, 12.5 * 8500, 0.01, 'costo total del lote');
  cerca(rPesado.costoKgFinal, 106250 / rPesado.pesoFinalKg, 0.01, 'costo por kg terminado');
}

console.log('\n== Cada receta a su peso real ==');
for (const id of Object.keys(RECETAS)) {
  const rec = RECETAS[id];
  if (rec.tipo === 'salmuera') continue;
  const r = compute(estadoDe(id, { kg: rec.kg }));
  const sumaG = r.ing.reduce((t, x) => t + x.g, 0) + r.curaG;
  // En los enteros los kg son la carne y los aditivos se suman; en el resto, kg = mezcla total.
  const mezcla = rec.tipo === 'entero' ? r.baseKg + r.insumosG / 1000 : rec.kg;
  cerca(r.componentesPct, 100, 0.01, rec.nombre + ': cárnicos + grasa 100 %');
  if (rec.tipo === 'entero') cerca(r.baseKg, rec.kg, 0.0001, rec.nombre + ': la carne = ' + rec.kg + ' kg');
  cerca(r.pesoMezclaKg, mezcla, 0.0001, rec.nombre + ': mezcla = ' + Math.round(mezcla * 1000) / 1000 + ' kg');
  cerca(sumaG, mezcla * 1000, 0.01, rec.nombre + ': la suma de gramos da el total');
  cerca(r.pesoFinalKg, mezcla * (1 - rec.merma / 100), 0.0001, rec.nombre + ': peso final con ' + rec.merma + ' % de merma');
  ok(!alertaBad(r), rec.nombre + ': sin alertas rojas', textos(r));
}
{
  const r = compute(estadoDe('bondiola', { kg: 1.2 }));
  const pieza = r.ing.find((x) => x.rol === 'carnico');
  const adic = r.ing.filter((x) => !x.carnico && !x.grasa).reduce((t, x) => t + x.pct, 0) + 0.25;
  cerca(pieza.g / 1000, 1.2, 0.0001, 'Bondiola 1,2 kg: la pieza pesa 1,2 kg (los kg son la carne)');
  cerca(r.pesoMezclaKg, 1.2 * (1 + adic / 100), 0.0001, 'y los aditivos se suman al peso total');
}
{
  const ferm = Object.keys(RECETAS).find((k) => RECETAS[k].tipo === 'fermentado');
  const r = compute(estadoDe(ferm, { kg: 5 }));
  cerca(r.pesoMezclaKg, 5, 0.0001, 'fermentado: los kg siguen siendo la mezcla total');
}

console.log('\n== Estructura del HTML ==');
{
  const htmlEstructura = html.replace(/<script>[\s\S]*?<\/script>/g, '');
  ok((htmlEstructura.match(/<section/g) || []).length === 7, 'siete secciones');
  ok((htmlEstructura.match(/<\/section>/g) || []).length === 7, 'cierres de sección');
  ok(html.includes('id="view-receta"') && html.includes('id="view-curado"') && html.includes('id="view-procesos"') && html.includes('id="view-compras"') && html.includes('id="view-recetario"') && html.includes('id="view-lotes"') && html.includes('id="view-stock"'), 'ids de vistas');
  ok(!/https?:\/\//.test(html), 'sin dependencias externas (offline)');
}

console.log('\n' + (fallos ? 'FALLOS: ' + fallos : 'TODO OK'));
process.exit(fallos ? 1 : 0);
