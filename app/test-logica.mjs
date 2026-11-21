// Pruebas de la lógica que vive fuera del bloque CALC: migración a la 1.1, libro
// de movimientos de stock, lotes por estado, elaborar/deshacer/terminar, compras,
// sesión, recetario y respaldo. Corre el <script> real de index.html en un
// contexto aislado con un DOM y un localStorage falsos; no modifica la app.
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error('Se esperaba un solo <script>, hay ' + scripts.length);

// Reemplazar el arranque automático por una exportación de las funciones internas.
const EXPORTA = [
  'init', 'compute', 'RECETAS', 'leerLS', 'saldo', 'valorStock', 'crearItem', 'comprarItem',
  'restarItem', 'corregirItem', 'anularMov', 'borrarItem', 'itemPorNombre', 'itemParaNombre',
  'crearLote', 'abrirLote', 'cerrarLote', 'lotePorId', 'guardarSesion', 'escribirSesion',
  'activaDiferente', 'descartarCambios', 'necesidadesCompras', 'prepararElaboracion', 'elaborarLote',
  'deshacerElaboracion', 'terminarLote', 'cancelarLote', 'borrarLote', 'permisos', 'setVista',
  'recalcular', 'datosParaRespaldo', 'importarRespaldoTexto', 'csvMovimientos', 'csvLotes',
  'guardarModalReceta', 'abrirModalReceta', 'editarReceta', 'guardarEditorReceta', 'recetaPorId',
  'ejecutarMov', 'existenciaItem', 'grupoStock', 'categoriaStockPara', 'pasaFiltroStock', 'necesidadesPorItem', 'faltantesLote', 'cambiarGrupo', 'cambiarTipoTripa', 'grupoItem', 'itemsParaEnvoltura', 'curaPorDefecto', 'renderGrupoCura', 'borrarTodosLosMovimientos', 'borrarTodoElStock', 'totalesStock', 'fijarProvisorio', 'fijarVinculo', 'elegirTripa', 'cambiarEnvoltura', 'calibreDeNombre', 'tripaDe', 'costoEnvolturasDe', 'estadoDeData', 'necesidadesDeData', 'datosReceta', 'limpiarDataReceta', 'lineasCosto', 'actualizarPreciosStock', 'ajustarComponente', 'normalizarTodosComponentes', 'construirDocImpresion', 'fichaRecetaDoc', 'abrirImpresion', 'fmt', 'kgParaIngrediente', 'escalarLote', 'I18N', 'tx', 'cambiarIdioma', 'IDIOMA', 'traducirHTML'
];
const fin = /\n\s*init\(\);\s*\r?\n\}\)\(\);\s*$/;
const coincidencias = scripts[0][1].match(new RegExp(fin.source, 'g')) || [];
if (coincidencias.length !== 1) throw new Error('No encontré exactamente un "init(); })();" al final del script');
const codigo = scripts[0][1].replace(fin,
  '\n  globalThis.__T = { get state() { return state; }, ' +
  EXPORTA.map((n) => n + ': ' + n).join(', ') + ' };\n})();\n');
const script = new vm.Script(codigo, { filename: 'index.html#script' });

// ---------- DOM falso ----------
function elemento() {
  return {
    value: '', checked: false, textContent: '', innerHTML: '', hidden: false, disabled: false,
    className: '', title: '', type: '', rows: 0, min: '', step: '', inputMode: '', placeholder: '',
    dataset: {}, style: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild(c) { return c; },
    insertBefore(c) { return c; }, removeChild(c) { return c; }, remove() {},
    setAttribute() {}, removeAttribute() {}, getAttribute() { return null; },
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    querySelector() { return elemento(); }, querySelectorAll() { return []; },
    closest() { return null; }
  };
}

function cargarApp(semilla = {}, opciones = {}) {
  const ls = semilla instanceof Map
    ? new Map(semilla)
    : new Map(Object.entries(semilla).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  const porId = new Map();
  const documento = {
    title: '',
    hidden: false,
    body: elemento(),
    getElementById(id) {
      if (!porId.has(id)) porId.set(id, elemento());
      return porId.get(id);
    },
    createElement() { return elemento(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const respuestas = { confirm: opciones.confirm === undefined ? true : opciones.confirm, prompt: opciones.prompt };
  const ctx = {
    document: documento,
    localStorage: {
      getItem: (k) => (ls.has(k) ? ls.get(k) : null),
      setItem: (k, v) => { ls.set(k, String(v)); },
      removeItem: (k) => { ls.delete(k); },
      key: (i) => [...ls.keys()][i] ?? null,
      get length() { return ls.size; }
    },
    confirm: () => respuestas.confirm,
    prompt: () => (respuestas.prompt === undefined ? null : respuestas.prompt),
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout: () => {},
    console
  };
  ctx.window = ctx;
  ctx.window.scrollTo = () => {};
  ctx.window.print = () => {};
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  script.runInContext(ctx);
  const T = ctx.__T;
  if (!opciones.sinInit) T.init();
  return {
    T, ls, ctx, respuestas,
    $: (id) => documento.getElementById(id),
    lsJSON: (k) => (ls.has(k) ? JSON.parse(ls.get(k)) : undefined)
  };
}

// ---------- ayudas ----------
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
const LS = {
  recetario: 'charcuteria.recetario.v1',
  sesion: 'charcuteria.sesion.v4',
  stockItemsV1: 'charcuteria.stockItems.v1',
  lotesV1: 'charcuteria.lotes.v1',
  lotesActivosV1: 'charcuteria.lotesActivos.v1',
  compras: 'charcuteria.comprasHistorico.v1',
  lotes: 'charcuteria.lotes.v2',
  items: 'charcuteria.stockItems.v2',
  movs: 'charcuteria.movimientos.v1',
  vinculos: 'charcuteria.vinculos.v1',
  migracion: 'charcuteria.migracion.v2',
  grupos: 'charcuteria.grupos.v1',
  previo: 'charcuteria.respaldoPrevio',
  respaldo: 'charcuteria.ultimoRespaldo'
};
const SEMILLA_109 = {
  [LS.stockItemsV1]: [
    { id: 's1', nombre: 'Sal fina', categoria: 'insumo', unidad: 'g', cantidad: 2000, precio: 0.002, minimo: 500 },
    { id: 's2', nombre: 'Paleta de cerdo', categoria: 'insumo', unidad: 'kg', cantidad: 3, precio: 6000, minimo: 0 },
    { id: 's3', nombre: 'Tripa', categoria: 'producto', unidad: 'm', cantidad: -2, precio: 150, minimo: 0 }
  ],
  [LS.lotesV1]: [{ id: 'l1', nombre: 'Salame viejo', fecha: '2026-09-01T10:00:00.000Z', kg: 5, pesoFinal: 3.2, costo: 40000 }],
  [LS.lotesActivosV1]: [{ id: 'la1', nombre: 'Panceta', tipo: 'entero', kg: 1, merma: 30, curaTipo: 'cura2', curaPct: 0.25, ingredientes: [{ rol: 'sal', nombre: 'Sal fina', pct: 2.5 }], fecha: '2026-10-20T10:00:00.000Z' }],
  [LS.compras]: [{ id: 'c1', fecha: '2026-10-01T10:00:00.000Z', nombre: 'Sal fina', unidad: 'g', cantidad: 1000, precio: 0.002, total: 2 }],
  [LS.sesion]: {
    tipo: 'fermentado', recetaId: 'salame', recetaNombre: 'Salame Tandil', loteActivo: true, loteId: 'lx',
    loteFecha: '2026-11-01T10:00:00.000Z', kg: 8, merma: 35, calibre: 40, curaTipo: 'cura2', curaPct: 0.25,
    ingredientes: [{ rol: 'carnico', nombre: 'Paleta de cerdo', pct: 70 }, { rol: 'grasa', nombre: 'Tocino', pct: 30 }, { rol: 'sal', nombre: 'Sal fina', pct: 2.5 }],
    procesos: ['Picar'], vista: 'receta'
  }
};

// ================= arranque =================
console.log('\n== Arranque limpio ==');
{
  const { T, lsJSON } = cargarApp();
  ok(Array.isArray(lsJSON(LS.recetario)) && lsJSON(LS.recetario).length === Object.keys(T.RECETAS).length, 'crea el recetario con las recetas base');
  ok(T.state.lotes.length === 0, 'sin lotes: no inventa un lote activo');
  ok(T.state.items.length === 0 && T.state.movimientos.length === 0, 'stock vacío');
  ok(!!lsJSON(LS.migracion), 'marca la migración como hecha');
  ok(T.state.vista === 'lotes', 'arranca en Lotes', T.state.vista);
}

console.log('\n== Migración desde la 1.0.9 ==');
let lsMigrado;
{
  const { T, ls, lsJSON } = cargarApp(SEMILLA_109);
  lsMigrado = ls;
  const items = lsJSON(LS.items);
  ok(items.length === 3, 'tres ítems migrados', items.length);
  ok(items.every((x) => x.minimo === undefined), 'el stock mínimo ya no existe');
  const sal = T.itemPorNombre('Sal fina');
  const paleta = T.itemPorNombre('Paleta de cerdo');
  const tripa = T.itemPorNombre('Tripa');
  ok(T.saldo(sal.id).cantidad === 2000 && T.saldo(sal.id).precio === 0.002, 'Sal fina: 2000 g a $0,002 como saldo inicial');
  ok(T.saldo(paleta.id).cantidad === 3 && T.saldo(paleta.id).precio === 6000, 'Paleta: 3 kg a $6000');
  ok(T.saldo(tripa.id).cantidad === -2 && tripa.revisar === true, 'Tripa negativa queda marcada para revisar');
  ok(T.saldo(tripa.id).precio === 150, 'la tripa negativa conserva su precio');
  ok(lsJSON(LS.movs).every((m) => m.tipo === 'saldo'), 'solo movimientos de saldo inicial');
  const lotes = lsJSON(LS.lotes);
  ok(lotes.length === 3, 'tres lotes: terminado viejo, receta en proceso 1.0.8 y el lote abierto', lotes.map((l) => l.nombre + ':' + l.estado));
  const viejo = lotes.find((l) => l.nombre === 'Salame viejo');
  ok(viejo && viejo.estado === 'terminado' && viejo.pesoFinal === 3.2 && viejo.importado, 'el historial viejo queda como terminado');
  const abierto = lotes.find((l) => l.id === 'lx');
  ok(abierto && abierto.estado === 'preparacion' && abierto.data.kg === 8 && abierto.recetaId === 'salame', 'el lote abierto de la sesión pasa a «En preparación»', abierto && abierto.data.kg);
  ok(abierto && abierto.data.ingredientes.length === 3, 'con sus ingredientes');
  ok(lotes.find((l) => l.id === 'la1').estado === 'cancelado', 'lotesActivos de la 1.0.8 pasan como cancelados (estaban ocultos)');
  ok(T.state.comprasViejas.length === 1, 'las compras viejas quedan para consultar');
  ok(ls.has(LS.stockItemsV1) && ls.has(LS.lotesV1), 'no borra las claves viejas');
  ok(T.itemParaNombre('sal  FINA') === sal, 'vínculo por nombre sin importar mayúsculas ni espacios');
}
{
  const antes = lsMigrado.get(LS.movs);
  const { T, lsJSON } = cargarApp(lsMigrado);
  ok(lsMigrado.get(LS.movs) === antes && T.state.movimientos.length === 3, 'reabrir no vuelve a migrar');
  ok(lsJSON(LS.lotes).length === 3, 'ni duplica lotes');
}

// ================= libro de movimientos =================
console.log('\n== Libro de movimientos ==');
{
  const { T } = cargarApp();
  const red = T.crearItem('Red', 'm', 'producto');
  T.comprarItem(red.id, 100, 80);
  T.comprarItem(red.id, 100, 90);
  cerca(T.saldo(red.id).precio, 85, 1e-9, 'promedio ponderado: 100 m a $80 + 100 m a $90');
  ok(T.saldo(red.id).cantidad === 200, 'suma 200 m');
  T.restarItem(red.id, 20, 'perdida', 'se rompió');
  T.restarItem(red.id, 5, 'usoExterno', 'para la cocina');
  ok(T.saldo(red.id).cantidad === 175, 'restar pérdida y uso externo', T.saldo(red.id).cantidad);
  cerca(T.saldo(red.id).precio, 85, 1e-9, 'restar no cambia el promedio');
  T.corregirItem(red.id, 170, 'conteo');
  ok(T.saldo(red.id).cantidad === 170, 'corregir conteo deja la cantidad contada');
  const corr = T.state.movimientos[T.state.movimientos.length - 1];
  ok(corr.tipo === 'correccion' && corr.cantidad === -5, 'la corrección registra la diferencia', corr);
  ok(T.corregirItem(red.id, 170) === null, 'corregir sin diferencia no registra nada');
  const segunda = T.state.movimientos.find((m) => m.tipo === 'compra' && m.precio === 90);
  T.anularMov(segunda.id);
  ok(T.saldo(red.id).cantidad === 70, 'anular la segunda compra resta sus 100 m', T.saldo(red.id).cantidad);
  cerca(T.saldo(red.id).precio, 80, 1e-9, 'y el promedio vuelve a $80');
  ok(T.anularMov(segunda.id) === null, 'no se puede anular dos veces');
  ok(T.state.movimientos.some((m) => m.tipo === 'anulacion' && m.ref === segunda.id), 'la anulación queda registrada');
  cerca(T.valorStock(), 70 * 80, 1e-6, 'valor del stock');
  const neg = T.crearItem('Pimienta', 'g');
  T.restarItem(neg.id, 10, 'otro');
  cerca(T.valorStock(), 70 * 80, 1e-6, 'el stock negativo no resta valor');
  ok(T.borrarItem(red.id) === 'archivado' && T.state.items.find((x) => x.id === red.id).archivado, 'borrar con movimientos archiva');
  const vacio = T.crearItem('Comino', 'g');
  ok(T.borrarItem(vacio.id) === 'borrado' && !T.state.items.find((x) => x.id === vacio.id), 'borrar sin movimientos borra');
  ok(T.ejecutarMov({ modo: 'compra', itemId: '__nuevo', nombre: 'Ajo', unidad: 'g', cantidad: 50, precio: 4, vincularA: 'Ajo picado' }) === '', 'compra de un ítem nuevo');
  ok(T.itemParaNombre('Ajo picado') === T.itemPorNombre('Ajo'), 'la compra desde Compras vincula el ingrediente con el ítem');
  ok(T.ejecutarMov({ modo: 'restar', itemId: T.itemPorNombre('Ajo').id, cantidad: 0 }) !== '', 'restar 0 da error');
}

console.log('\n== Stock: cargar existencia ==');
{
  const { T } = cargarApp();
  ok(T.ejecutarMov({ modo: 'existencia', itemId: '__nuevo', nombre: 'Tripa natural', unidad: 'm', categoria: 'insumo', cantidad: 30, precio: 150 }) === '', 'existencia de un ítem nuevo');
  const tripa = T.itemPorNombre('Tripa natural');
  ok(T.saldo(tripa.id).cantidad === 30 && T.saldo(tripa.id).precio === 150, 'queda 30 m a $150');
  const m = T.state.movimientos[T.state.movimientos.length - 1];
  ok(m.tipo === 'saldo' && m.fija === true, 'se registra como existencia con precio fijo', m);
  T.comprarItem(tripa.id, 10, 250);
  cerca(T.saldo(tripa.id).precio, 175, 1e-9, 'una compra después se promedia: 30 a 150 + 10 a 250');
  T.existenciaItem(tripa.id, 25, 200);
  ok(T.saldo(tripa.id).cantidad === 25, 'la existencia sobre un ítem con stock deja la cantidad que se pone', T.saldo(tripa.id).cantidad);
  ok(T.saldo(tripa.id).precio === 200, 'y el precio reemplaza al promedio', T.saldo(tripa.id).precio);
  ok(T.existenciaItem(tripa.id, 25, 0) === null, 'misma cantidad y sin precio no registra nada');
  ok(T.ejecutarMov({ modo: 'existencia', itemId: tripa.id, cantidad: 25, precio: '' }) !== '', 'avisa si ya estaba así');
  T.existenciaItem(tripa.id, 25, 210);
  ok(T.saldo(tripa.id).cantidad === 25 && T.saldo(tripa.id).precio === 210, 'se puede cambiar solo el costo');
  ok(T.ejecutarMov({ modo: 'existencia', itemId: tripa.id, cantidad: '' }) !== '', 'sin cantidad da error');
  const sinPrecio = T.crearItem('Hilo', 'm');
  T.existenciaItem(sinPrecio.id, 100, 0);
  ok(T.saldo(sinPrecio.id).cantidad === 100 && T.saldo(sinPrecio.id).precio === 0, 'existencia sin precio');
  const ult = T.state.movimientos[T.state.movimientos.length - 1];
  T.anularMov(T.state.movimientos.find((x) => x.itemId === tripa.id && x.precio === 210).id);
  ok(T.saldo(tripa.id).precio === 200, 'anular la última existencia vuelve al costo anterior', T.saldo(tripa.id).precio);
  const neg = T.crearItem('Pimentón', 'g');
  neg.revisar = true;
  T.restarItem(neg.id, 50, 'otro');
  T.existenciaItem(neg.id, 400, 0.02);
  ok(T.saldo(neg.id).cantidad === 400 && !neg.revisar, 'arregla un negativo y saca REVISAR');
}

console.log('\n== Stock: alta con 0, categorías y filtros ==');
{
  const { T } = cargarApp();
  ok(T.ejecutarMov({ modo: 'existencia', itemId: '__nuevo', nombre: 'Hígado', unidad: 'kg', cantidad: 0 }) === '', 'existencia de un ítem nuevo con 0 kg');
  ok(T.ejecutarMov({ modo: 'existencia', itemId: '__nuevo', nombre: 'Lengua', unidad: 'kg', cantidad: '' }) === '', 'existencia de un ítem nuevo con la cantidad vacía');
  ok(T.ejecutarMov({ modo: 'compra', itemId: '__nuevo', nombre: 'Riñón', unidad: 'kg', cantidad: 0 }) === '', 'compra de un ítem nuevo con 0 lo da de alta igual');
  ok(T.itemPorNombre('Hígado') && T.itemPorNombre('Lengua') && T.itemPorNombre('Riñón'), 'los tres quedan en el stock');
  ok(T.state.movimientos.length === 0, 'sin movimientos (no hay nada que registrar)');
  ok(T.ejecutarMov({ modo: 'compra', itemId: T.itemPorNombre('Riñón').id, cantidad: 0 }) !== '', 'comprar 0 de un ítem que ya existe sigue dando error');
  const h = T.itemPorNombre('Hígado');
  T.borrarItem(h.id);
  ok(T.ejecutarMov({ modo: 'existencia', itemId: '__nuevo', nombre: 'hígado', unidad: 'kg', cantidad: 0 }) === '' && !T.itemPorNombre('Hígado').archivado, 'volver a cargar un ítem borrado lo trae de vuelta');
  const prod = ['Hígado de cerdo', 'Tocino', 'Panceta de cerdo', 'Carne de vaca', 'Leche', 'Vino tinto'];
  const ins = ['Sal fina', 'Tripa', 'Cura #2', 'Dextrosa', 'Pimienta negra', 'Starter (bacterias lácticas)', 'Hilo'];
  ok(prod.every((n) => T.categoriaStockPara(n) === 'producto'), 'lo que se come es producto', prod.map((n) => n + ':' + T.categoriaStockPara(n)));
  ok(ins.every((n) => T.categoriaStockPara(n) === 'insumo'), 'sal, tripa, aditivos y especias son insumo', ins.map((n) => n + ':' + T.categoriaStockPara(n)));
  const sug = { 'Hígado': 'carnico', 'Tocino': 'grasa', 'Grasa dorsal': 'grasa', 'Cura #1': 'cura', 'Sal de cura': 'cura', 'Sal fina': 'aditivo', 'Dextrosa': 'aditivo', 'Tripolifosfato': 'aditivo', 'Eritorbato de sodio': 'aditivo', 'Nuez moscada': 'especia', 'Tripa natural': 'tripa', 'Colágeno 45/48': 'tripa', 'Tripa cular': 'tripa', 'Hilo': 'envoltura', 'Papel microporoso': 'envoltura', 'Vino tinto': 'alimento' };
  ok(Object.keys(sug).every((n) => T.grupoStock(n) === sug[n]), 'grupos sugeridos por el nombre', Object.keys(sug).filter((n) => T.grupoStock(n) !== sug[n]).map((n) => n + ':' + T.grupoStock(n)));
  ok(T.itemPorNombre('Hígado').categoria === 'producto', 'el hígado nuevo queda como producto');
  T.cambiarGrupo(T.itemPorNombre('Lengua').id, 'aditivo');
  ok(T.itemPorNombre('Lengua').categoria === 'insumo' && T.grupoItem(T.itemPorNombre('Lengua')) === 'aditivo', 'el grupo se cambia a mano y la categoría lo sigue');
}
{
  // Ítems viejos: la tripa era «producto» y la carne «insumo»; se acomodan una sola vez.
  const semilla = {
    [LS.migracion]: { fecha: '2026-11-02' },
    [LS.items]: [
      { id: 'a', nombre: 'Tripa', categoria: 'producto', unidad: 'm' },
      { id: 'b', nombre: 'Bondiola de cerdo', categoria: 'insumo', unidad: 'kg' },
      { id: 'c', nombre: 'Sal fina', categoria: 'insumo', unidad: 'g' }
    ]
  };
  const { T, ls } = cargarApp(semilla);
  const cat = (id) => T.state.items.find((x) => x.id === id).categoria;
  ok(cat('a') === 'insumo' && cat('b') === 'producto' && cat('c') === 'insumo', 'recategoriza los ítems viejos');
  const gr = (id) => T.state.items.find((x) => x.id === id).grupo;
  ok(gr('a') === 'tripa' && gr('b') === 'carnico' && gr('c') === 'aditivo', 'cada ítem existente queda con su grupo', [gr('a'), gr('b'), gr('c')]);
  T.cambiarGrupo('c', 'carnico');
  const { T: T2 } = cargarApp(ls);
  const c2 = T2.state.items.find((x) => x.id === 'c');
  ok(c2.categoria === 'producto' && c2.grupo === 'carnico', 'y no pisa lo que cambiaste a mano después');
}
{
  const { T } = cargarApp();
  const sal = T.crearItem('Sal fina / entrefina', 'g');
  T.existenciaItem(sal.id, 5000, 0.002);
  T.crearItem('Pimienta negra en grano', 'g');
  const l = T.crearLote({ recetaId: 'salame', kg: 4 });
  const np = T.necesidadesPorItem();
  ok(np.lotes.length === 1 && np.porItem[sal.id] && !(np.porItem[sal.id].falta > 0), 'la sal alcanza para el lote');
  ok(np.sinItem.length > 0, 'lo que no está en el stock aparece como faltante sin ítem', np.sinItem.map((n) => n.nombre));
  ok(!T.pasaFiltroStock(sal, 'falta', np) && T.pasaFiltroStock(T.itemPorNombre('Pimienta negra en grano'), 'falta', np), 'filtro «falta para lotes»');
  ok(T.pasaFiltroStock(T.itemPorNombre('Pimienta negra en grano'), 'sin', np) && !T.pasaFiltroStock(sal, 'sin', np), 'filtro «sin stock»');
  ok(T.pasaFiltroStock(sal, 'aditivo', np) && T.pasaFiltroStock(T.itemPorNombre('Pimienta negra en grano'), 'especia', np), 'filtros por grupo');
  const fl = T.faltantesLote(l);
  ok(fl.length > 0 && !fl.some((n) => n.nombre === 'Sal fina / entrefina'), 'el lote avisa lo que le falta y no la sal', fl.map((n) => n.nombre));
  const carne = T.crearItem('Carne de cerdo', 'kg'); T.existenciaItem(carne.id, 1, 5000);
  const tot = T.totalesStock();
  cerca(tot.insumo, 10, 1e-9, 'subtotal insumos: 5000 g de sal a $0,002');
  cerca(tot.producto, 5000, 1e-9, 'subtotal productos: 1 kg de carne a $5000');
  cerca(tot.total, 5010, 1e-9, 'total en stock');
  const nCarne = T.necesidadesPorItem().porItem[carne.id];
  ok(nCarne && nCarne.falta > 0 && tot.falta >= nCarne.falta * 5000 - 1e-6, 'falta comprar suma lo que falta a su precio', [tot.falta, nCarne && nCarne.falta]);
  ok(tot.faltaSinPrecio > 0 && tot.faltan > tot.faltaSinPrecio, 'cuenta aparte lo que falta sin precio', tot);
}


// ================= lotes =================
console.log('\n== Stock: borrar en bloque ==');
{
  const { T, ls, respuestas } = cargarApp();
  const a = T.crearItem('Sal fina', 'g'); T.existenciaItem(a.id, 1000, 0.002);
  const b = T.crearItem('Tripa', 'm'); T.comprarItem(b.id, 20, 100); T.borrarItem(b.id);
  respuestas.prompt = 'no';
  ok(T.borrarTodosLosMovimientos() === false && T.state.movimientos.length === 2, 'si no escribís BORRAR no borra nada');
  respuestas.prompt = 'borrar';
  ok(T.borrarTodosLosMovimientos() === true && T.state.movimientos.length === 0, 'borra todos los movimientos');
  ok(T.state.items.length === 2 && T.saldo(a.id).cantidad === 0 && T.saldo(a.id).precio === 0, 'los ítems quedan con 0 y sin precio');
  ok(JSON.parse(ls.get(LS.previo)).datos[LS.movs].length === 2, 'antes guarda el respaldo previo con los movimientos');
  respuestas.confirm = false;
  ok(T.borrarTodoElStock() === false && T.state.items.length === 2, 'si cancelás el primer aviso no borra');
  respuestas.confirm = true;
  ok(T.borrarTodoElStock() === true && T.state.items.length === 0 && T.state.movimientos.length === 0, 'borra todo el stock, archivados incluidos');
  ok(JSON.parse(ls.get(LS.previo)).datos[LS.items].length === 2, 'y deja el respaldo previo con los ítems');
  ok(JSON.parse(ls.get(LS.items)).length === 0, 'queda guardado vacío');
}

console.log('\n== Lotes: crear, abrir, editar ==');
{
  const { T, lsJSON } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 4 });
  ok(l.estado === 'preparacion' && l.data.kg === 4 && l.recetaId === 'salame', 'nuevo lote del recetario con sus kg');
  ok(/^Salame Tandil \d+\/\d+$/.test(l.nombre), 'nombre sugerido con la fecha', l.nombre);
  T.abrirLote(l.id);
  ok(T.state.loteAbierto === l.id && T.state.vista === 'receta', 'abrir lo muestra en Receta');
  ok(T.permisos().receta === true, 'en preparación la receta se edita');
  T.state.kg = 6;
  T.guardarSesion();
  ok(lsJSON(LS.lotes).find((x) => x.id === l.id).data.kg === 6, 'los cambios se guardan en el lote');
  T.recalcular();
  ok(T.state.recetaDirty === false, 'cambiar solo los kg no cuenta como cambio de receta');
  T.state.ingredientes.find((x) => x.rol === 'sal').pct = 3.1;
  T.guardarSesion();
  T.recalcular();
  ok(T.state.recetaDirty === true, 'cambiar un porcentaje sí');
  T.descartarCambios();
  ok(T.state.recetaDirty === false && T.state.kg === 6, 'descartar vuelve a la receta y mantiene los kg');
  ok(lsJSON('charcuteria.sesion.v4').loteAbierto === l.id, 'la sesión recuerda el lote abierto');
  const otro = T.crearLote({ tipo: 'cocido', nombre: 'Prueba', kg: 2 });
  ok(otro.recetaId === '' && otro.data.tipo === 'cocido' && otro.nombre === 'Prueba', 'lote con receta nueva');
  T.abrirLote(otro.id);
  ok(lsJSON(LS.lotes).find((x) => x.id === l.id).data.kg === 6, 'cambiar de lote no pisa el anterior');
  T.state.kg = 3;
  T.setVista('lotes');
  ok(T.state.loteAbierto === '' && lsJSON(LS.lotes).find((x) => x.id === otro.id).data.kg === 3, 'volver a Lotes guarda y cierra');
  ok(lsJSON(LS.lotes).find((x) => x.id === l.id).data.kg === 6, 'y no toca al otro lote');
}
{
  const { T, lsJSON, ls } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 2 });
  T.abrirLote(l.id, 'procesos');
  T.escribirSesion();
  const r = cargarApp(ls);
  ok(r.T.state.loteAbierto === l.id && r.T.state.vista === 'procesos', 'al reabrir la app vuelve al lote y a la pestaña', [r.T.state.loteAbierto, r.T.state.vista]);
  ok(r.T.state.kg === 2, 'con la copia del lote cargada');
}

console.log('\n== Compras: lotes en preparación menos stock ==');
{
  const { T } = cargarApp();
  const a = T.crearLote({ recetaId: 'salame', kg: 8 });
  const b = T.crearLote({ recetaId: 'salame', kg: 2 });
  const sal = T.crearItem('Sal', 'g');
  const nombreSal = a.data.ingredientes.find((x) => x.rol === 'sal').nombre;
  T.ejecutarMov({ modo: 'compra', itemId: sal.id, cantidad: 100, precio: 0.003, vincularA: nombreSal });
  const d = T.necesidadesCompras();
  ok(d.lotes.length === 2, 'suma los dos lotes en preparación');
  const rA = T.compute(Object.assign({}, a.data, { precios: {}, precioTripa: 0 }));
  const rB = T.compute(Object.assign({}, b.data, { precios: {}, precioTripa: 0 }));
  const gSal = rA.ing.find((x) => x.nombre === nombreSal).g + rB.ing.find((x) => x.nombre === nombreSal).g;
  const fila = d.items.find((x) => x.item && x.item.id === sal.id);
  cerca(fila.cantidad, gSal, 1e-6, 'necesidad de sal = suma de los dos lotes');
  cerca(fila.falta, Math.round((gSal - 100) * 10) / 10, 0.05, 'falta = necesidad − stock');
  T.restarItem(sal.id, 300, 'perdida');
  const fila2 = T.necesidadesCompras().items.find((x) => x.item && x.item.id === sal.id);
  cerca(fila2.falta, Math.round(gSal * 10) / 10, 0.05, 'con stock negativo, falta = toda la necesidad (el negativo cuenta como 0)');
  ok(fila2.sinStock === true, 'y se marca sin stock');
  T.elaborarLote(b.id, T.prepararElaboracion(b.id));
  ok(T.necesidadesCompras().lotes.length === 1, 'un lote elaborado sale de la lista de compras');
}

console.log('\n== Elaborar, deshacer, terminar, cancelar ==');
{
  const { T } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 8 });
  const filas = T.prepararElaboracion(l.id);
  ok(filas.length > 0 && filas.every((f) => f.itemId === '__nuevo'), 'sin stock: propone crear cada ítem');
  const tripa = filas.find((f) => f.nombre === 'Tripa');
  ok(tripa && tripa.unidadNueva === 'm' && tripa.cantidad > 0, 'la tripa se pide en metros');
  const carne = filas.find((f) => f.rol === 'carnico');
  // La carne: hay 3 kg, se compró el resto sin cargar.
  const itCarne = T.crearItem(carne.nombre, 'kg');
  T.comprarItem(itCarne.id, 3, 5000);
  const filas2 = T.prepararElaboracion(l.id);
  const fc = filas2.find((f) => f.nombre === carne.nombre);
  ok(fc.itemId === itCarne.id && fc.precio === 5000, 'encuentra el ítem por nombre y toma su precio');
  fc.precio = 6000;
  fc.comprar = true;
  const fs2 = filas2.find((f) => f.rol === 'sal');
  fs2.comprar = false;
  const resto = filas2.filter((f) => f !== fc && f !== fs2);
  resto.forEach((f) => { f.itemId = '__no'; });
  ok(T.elaborarLote(l.id, filas2, '2026-11-02T12:00:00.000Z'), 'elabora');
  const lote = T.lotePorId(l.id);
  ok(lote.estado === 'proceso' && lote.elaborado === '2026-11-02T12:00:00.000Z', 'pasa a «En proceso» con la fecha');
  ok(T.saldo(itCarne.id).cantidad === 0, 'la carne queda en 0: compra cargada + uso', T.saldo(itCarne.id).cantidad);
  const compraCarne = T.state.movimientos.find((m) => m.itemId === itCarne.id && m.tipo === 'compra' && m.loteId === l.id);
  cerca(compraCarne.cantidad, fc.cantidad - 3, 1e-6, 'compra solo lo que faltaba');
  const usoCarne = lote.usos.find((u) => u.itemId === itCarne.id);
  cerca(usoCarne.costoUnit, (3 * 5000 + (fc.cantidad - 3) * 6000) / fc.cantidad, 1e-6, 'el costo usa el promedio después de la compra');
  const itSal = T.itemPorNombre(fs2.nombre);
  ok(itSal && T.saldo(itSal.id).cantidad === 0, 'sal sin compra: se crea y queda en 0, no en negativo');
  const usoSal = lote.usos.find((u) => u.itemId === itSal.id);
  cerca(usoSal.faltante, fs2.cantidad, 1e-6, 'y queda anotado lo que faltó');
  ok(!lote.usos.some((u) => resto.some((f) => f.nombre === u.nombre)), '«No descontar» no toca el stock');
  ok(T.state.movimientos.filter((m) => m.tipo === 'uso').every((m) => m.loteId === l.id && m.loteNombre === lote.nombre), 'los usos llevan el lote');

  T.abrirLote(l.id);
  ok(T.permisos().receta === false && T.permisos().merma === true, 'en proceso: receta bloqueada, merma editable');
  T.state.kg = 99;
  T.state.merma = 38;
  T.guardarSesion();
  ok(lote.data.kg === 8 && lote.data.merma === 38, 'en proceso solo se guardan merma y procesos');

  ok(T.deshacerElaboracion(l.id, true), 'deshacer elaboración');
  ok(lote.estado === 'preparacion' && lote.usos.length === 0, 'vuelve a preparación');
  cerca(T.saldo(itCarne.id).cantidad, fc.cantidad, 1e-6, 'la carne vuelve al stock (la compra cargada queda)');
  ok(T.state.movimientos.filter((m) => m.tipo === 'anulacion').length === 1, 'anula el uso (la sal no tuvo uso: faltó toda)');

  T.elaborarLote(l.id, T.prepararElaboracion(l.id));
  const r = T.compute(Object.assign({}, lote.data, { precios: {}, precioTripa: 0 }));
  ok(T.terminarLote(l.id, 5.1), 'terminar con peso real');
  ok(lote.estado === 'terminado' && lote.pesoFinal === 5.1 && lote.pesoMedido, 'guarda el peso final real');
  T.abrirLote(l.id);
  ok(!T.permisos().receta && !T.permisos().merma && !T.permisos().procesos, 'terminado: solo lectura');
  const l2 = T.crearLote({ recetaId: 'bondiola' });
  T.elaborarLote(l2.id, T.prepararElaboracion(l2.id));
  T.terminarLote(l2.id, 0);
  cerca(T.lotePorId(l2.id).pesoFinal, T.compute(Object.assign({}, l2.data, { precios: {}, precioTripa: 0 })).pesoFinalKg, 1e-9, 'sin peso real usa el esperado');
  ok(r.pesoFinalKg > 0, 'peso esperado calculado');

  const l3 = T.crearLote({ recetaId: 'salame', kg: 1 });
  const movsAntes = T.state.movimientos.length;
  T.cancelarLote(l3.id);
  ok(T.lotePorId(l3.id).estado === 'cancelado' && T.state.movimientos.length === movsAntes, 'cancelar en preparación no toca el stock');
  const l4 = T.crearLote({ recetaId: 'salame', kg: 1 });
  T.elaborarLote(l4.id, T.prepararElaboracion(l4.id));
  const usados = T.state.movimientos.filter((m) => m.loteId === l4.id && m.tipo === 'uso').length;
  T.cancelarLote(l4.id);
  ok(T.lotePorId(l4.id).estado === 'cancelado' && T.state.movimientos.filter((m) => m.loteId === l4.id && m.tipo === 'uso' && !T.state.movimientos.some((a) => a.ref === m.id)).length === usados, 'cancelar en proceso no devuelve lo usado');
  T.borrarLote(l3.id);
  ok(!T.lotePorId(l3.id), 'borrar un lote cancelado');
  const l5 = T.crearLote({ recetaId: 'salame', kg: 1 });
  T.elaborarLote(l5.id, T.prepararElaboracion(l5.id));
  T.borrarLote(l5.id);
  ok(!!T.lotePorId(l5.id), 'no se borra un lote en proceso');
}

// ================= recetario =================
console.log('\n== Recetario y lotes ==');
{
  const { T, $ } = cargarApp();
  const l = T.crearLote({ tipo: 'fermentado', nombre: 'Mi salame', kg: 3 });
  T.abrirLote(l.id);
  T.state.ingredientes.push({ rol: 'carnico', nombre: 'Cerdo', pct: 100 }, { rol: 'sal', nombre: 'Sal', pct: 2.6 });
  T.guardarSesion();
  T.abrirModalReceta('guardar');
  $('receta-nombre').value = 'Salame propio';
  T.guardarModalReceta(false);
  const e = T.recetaPorId(l.recetaId);
  ok(e && e.nombre === 'Salame propio' && e.data.ingredientes.length === 2, 'guardar en recetario crea la receta y la vincula al lote');
  ok(l.nombre === 'Mi salame', 'el lote conserva su nombre');
  T.recalcular();
  ok(T.state.recetaDirty === false, 'después de guardar no hay cambios pendientes');
  T.setVista('recetario');
  T.editarReceta(e.id);
  ok(T.state.editandoReceta && T.state.loteAbierto === '', 'editar receta cierra el lote');
  T.state.ingredientes.find((x) => x.nombre === 'Sal').pct = 3;
  $('editor-nombre').value = 'Salame propio';
  T.guardarEditorReceta();
  ok(T.recetaPorId(e.id).data.ingredientes.find((x) => x.nombre === 'Sal').pct === 3, 'la receta del recetario cambia');
  ok(T.lotePorId(l.id).data.ingredientes.find((x) => x.nombre === 'Sal').pct === 2.6, 'el lote ya iniciado no cambia');
  ok(T.state.vista === 'recetario' && !T.state.editandoReceta, 'vuelve al recetario');
}

// ================= respaldo =================
console.log('\n== Respaldo: exportar e importar ==');
{
  const { T, ls } = cargarApp(SEMILLA_109);
  ls.set(LS.previo, '"viejo"');
  const resp = T.datosParaRespaldo();
  ok(resp.app === 'charcuteria' && resp.formato === 1 && resp.version, 'sobre del respaldo');
  ok(resp.datos[LS.lotes] && resp.datos[LS.movs] && resp.datos[LS.recetario], 'incluye lotes, movimientos y recetario');
  ok(!(LS.previo in resp.datos), 'no incluye el respaldo previo');
  const texto = JSON.stringify(resp);

  const otro = cargarApp();
  const r0 = otro.T.importarRespaldoTexto('{"hola":1}', { recargar() {} });
  ok(!r0.ok, 'rechaza un archivo que no es respaldo');
  ok(!otro.T.importarRespaldoTexto(texto, { recargar() {}, confirmar: () => false }).ok, 'si no confirmás, no importa');
  const conBom = otro.T.importarRespaldoTexto('\ufeff' + texto + '\n', { recargar() {} });
  ok(conBom.error === 'pendiente' && otro.ctx.document.getElementById('import-overlay').hidden === false, 'acepta el archivo con BOM y pide confirmar en una ventana propia', conBom);
  let recargo = false;
  const r1 = otro.T.importarRespaldoTexto(texto, { recargar() { recargo = true; }, confirmar: () => true });
  ok(r1.ok && recargo, 'importa y recarga');
  ok(otro.ls.get(LS.movs) === JSON.stringify(resp.datos[LS.movs]), 'reemplaza los movimientos');
  ok(otro.ls.has(LS.previo) && JSON.parse(otro.ls.get(LS.previo)).app === 'charcuteria', 'guarda los datos anteriores como respaldo previo');
  const tras = cargarApp(otro.ls);
  ok(tras.T.state.lotes.length === 3 && tras.T.state.items.length === 3, 'al recargar quedan los datos importados');
  ok(tras.T.state.movimientos.length === 3, 'sin volver a migrar');

  const csv = T.csvMovimientos();
  ok(csv.charCodeAt(0) === 0xfeff, 'CSV con BOM para Excel');
  ok(csv.split('\r\n')[0] === '﻿Fecha;Ítem;Tipo;Cantidad;Unidad;Precio por unidad;Lote;Nota;Anulado', 'encabezado de movimientos');
  ok(/;Paleta de cerdo;Existencia;3;kg;6000;/.test(csv), 'fila con separador ; ');
  ok(/;Sal fina;Existencia;2000;g;0,002;/.test(csv), 'decimales con coma');
  ok(T.csvLotes().split('\r\n').length === 5, 'CSV de lotes: encabezado + 3 lotes');
}

// ================= impresión =================
console.log('\n== Impresión ==');
{
  const { T } = cargarApp(SEMILLA_109);
  T.abrirLote('lx');
  const doc = T.construirDocImpresion({ receta: true, ingredientes: true, indicadores: true, advertencias: true, notas: true, procesos: true, lotes: true, porComprar: true, costos: true, stock: true });
  ok(doc.html.includes('Notas') && doc.titulo.includes('Todo'), 'imprimir todo, notas incluidas, no falla');
  T.setVista('compras');
  const doc2 = T.construirDocImpresion({ lotes: true, porComprar: true, costos: true });
  ok(doc2.html.includes('Lotes en preparación') && doc2.titulo.indexOf('Charcutería') === 0, 'compras sin lote abierto');
}

// ================= reparto de carnes =================
console.log('\n== Reparto de carnes ==');
{
  const { T } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 8 });
  T.abrirLote(l.id);
  const idx = T.state.ingredientes.findIndex((x) => x.rol === 'grasa');
  T.state.ingredientes[idx].pct = 25;
  T.ajustarComponente(idx);
  const tot = T.state.ingredientes.filter((x) => x.rol === 'carnico' || x.rol === 'grasa').reduce((s, x) => s + x.pct, 0);
  cerca(tot, 100, 0.011, 'carnes + tocino siguen sumando 100 %');
}

// ================= precios provisorios =================
console.log('\n== Precios provisorios ==');
{
  const { T } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 2 });
  T.abrirLote(l.id);
  const r0 = T.compute(T.state).costoTotal;
  const carne = T.state.ingredientes.find((x) => x.rol === 'carnico').nombre;
  T.fijarProvisorio(carne, 8000);
  const r1 = T.compute(T.state);
  ok(r1.costoTotal > r0 + 1, 'el precio provisorio suma al costo del lote', { r0, r1: r1.costoTotal });
  ok(!T.itemParaNombre(carne) && T.state.movimientos.length === 0, 'el provisorio no crea ítems ni movimientos en el stock');
  ok(T.lineasCosto(r1).some((x) => x.nombre === carne && x.origen === 'provisorio' && x.costo > 0), 'el detalle marca la línea como provisoria');
  ok(T.datosParaRespaldo().datos['charcuteria.preciosProvisorios.v1'], 'los provisorios van en el respaldo');
  const filas = T.prepararElaboracion(l.id);
  const fc = filas.find((x) => x.nombre === carne);
  ok(fc.provisorio && Math.abs(fc.precio - 8000) < 1e-6, 'al elaborar, la compra sugiere el precio provisorio', fc);
  filas.forEach((x) => { x.itemId = '__no'; });
  T.elaborarLote(l.id, filas);
  const le = T.lotePorId(l.id);
  ok(le.costo > 0 && le.usos.some((u) => u.provisorio && u.nombre === carne), 'con «No descontar» igual cuenta en el costo del lote', le.usos);
  ok(T.state.movimientos.length === 0, 'y no toca el stock');
  const it = T.crearItem(carne, 'kg', 'producto');
  T.comprarItem(it.id, 1, 5000);
  T.actualizarPreciosStock();
  ok(T.state.precios[carne] === 5000 && !T.state.preciosProv[carne], 'cuando hay precio en el stock, manda el del stock');
  ok(Object.keys(T.leerLS('charcuteria.preciosProvisorios.v1', {})).length === 0, 'y el provisorio se descarta');
}

// ================= vínculos, tripa y envolturas =================
console.log('\n== Vínculos, tripa y envolturas ==');
{
  const { T } = cargarApp();
  const l = T.crearLote({ recetaId: 'salame', kg: 4 });
  T.abrirLote(l.id);
  ok(T.activaDiferente() === false, 'un lote recién creado no se ve distinto de su receta');
  const sal = T.state.ingredientes.find((x) => x.rol === 'sal').nombre;
  const otro = T.crearItem('Sal entrefina XYZ', 'g', 'insumo');
  T.comprarItem(otro.id, 1000, 2);
  ok(T.faltantesLote(T.lotePorId(l.id)).some((x) => x.nombre === sal), 'sin vincular, la sal figura como faltante');
  T.fijarVinculo(sal, otro.id);
  T.actualizarPreciosStock();
  ok(!T.faltantesLote(T.lotePorId(l.id)).some((x) => x.nombre === sal || x.nombre === 'Sal entrefina XYZ'), 'vinculada a otro nombre, deja de faltar');
  ok(Math.abs(T.state.precios[sal] - 2000) < 1e-6, 'y toma el precio del ítem vinculado (por kg)', T.state.precios[sal]);
  const carne = T.state.ingredientes.find((x) => x.rol === 'carnico').nombre;
  T.crearItem(carne, 'kg', 'producto');
  ok(T.itemParaNombre(carne), 'con el mismo nombre se encuentra solo');
  T.fijarVinculo(carne, '__no');
  ok(!T.itemParaNombre(carne), '«No está en el stock» corta la búsqueda por nombre');

  const ta = T.crearItem('Tripa natural 38', 'm', 'insumo');
  const tb = T.crearItem('Tripa colágeno 50', 'm', 'insumo');
  T.comprarItem(ta.id, 20, 100);
  T.comprarItem(tb.id, 20, 300);
  const d1 = Object.assign({}, T.lotePorId(l.id).data, { tripaId: ta.id });
  const d2 = Object.assign({}, T.lotePorId(l.id).data, { tripaId: tb.id });
  const c1 = T.compute(T.estadoDeData(d1)).costoTripa;
  const c2 = T.compute(T.estadoDeData(d2)).costoTripa;
  ok(c1 > 0 && Math.abs(c2 - 3 * c1) < 1e-6, 'cada lote usa el precio de su tripa', { c1, c2 });
  ok(T.necesidadesDeData(d2).some((n) => n.rol === 'tripa' && n.nombre === 'Tripa colágeno 50'), 'la necesidad nombra la tripa elegida');
  T.state.tripaId = tb.id;
  const dr = T.datosReceta();
  ok(dr.tripaId === tb.id && T.limpiarDataReceta(dr).tripaId === tb.id, 'la tripa elegida se guarda con el lote y en el recetario');
}
{
  const { T } = cargarApp();
  const idEntero = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'entero');
  const l = T.crearLote({ recetaId: idEntero, kg: 1.2 });
  const papel = T.crearItem('Papel microporoso', 'u', 'insumo');
  const red = T.crearItem('Red elástica', 'm', 'insumo');
  T.comprarItem(papel.id, 10, 50);
  T.comprarItem(red.id, 5, 200);
  T.abrirLote(l.id);
  const sinEnv = T.compute(T.state).costoTotal;
  T.state.envolturas = { papel: { usar: true, itemId: '', cantidad: 2 }, red: { usar: true, itemId: red.id, cantidad: 1.5 } };
  T.recalcular();
  const dr = T.datosReceta();
  ok(T.costoEnvolturasDe(dr) === 400, 'papel (automático por nombre) y red elegida suman 2×50 + 1,5×200', T.costoEnvolturasDe(dr));
  ok(Math.abs(T.compute(T.state).costoTotal - sinEnv - 400) < 1e-6, 'y entran en el costo total del lote');
  ok(JSON.stringify(T.limpiarDataReceta(dr).envolturas) === JSON.stringify(dr.envolturas), 'las envolturas se guardan en el recetario');
  T.guardarSesion();
  const lote = T.lotePorId(l.id);
  lote.data = dr;
  const nec = T.necesidadesDeData(lote.data);
  ok(nec.some((n) => n.rol === 'envoltura' && n.cantidad === 2) && nec.some((n) => n.rol === 'envoltura' && n.cantidad === 1.5), 'papel y red aparecen en lo que necesita el lote');
  T.elaborarLote(l.id, T.prepararElaboracion(l.id));
  ok(T.saldo(papel.id).cantidad === 8 && T.saldo(red.id).cantidad === 3.5, 'al elaborar se descuentan del stock', [T.saldo(papel.id).cantidad, T.saldo(red.id).cantidad]);
  ok(T.lotePorId(l.id).costo >= 400, 'y cuentan en el costo del lote');
  const dFer = T.limpiarDataReceta(Object.assign({}, dr, { tipo: 'fermentado' }));
  ok(!dFer.envolturas, 'un fermentado no guarda papel ni red');
}

// ================= embutidos: tripa y cierre en fermentados y cocidos =================
console.log('\n== Embutidos: tripa y cierre ==');
{
  const { T } = cargarApp();
  const idCocido = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'cocido');
  const l = T.crearLote({ recetaId: idCocido, kg: 3 });
  T.abrirLote(l.id);
  const tr = T.crearItem('Tripa colágeno 45/48', 'm', 'insumo');
  T.comprarItem(tr.id, 30, 150);
  const items = T.state.items.length;
  const movs = T.state.movimientos.length;
  T.elegirTripa(tr.id);
  ok(T.state.calibre === 45, 'el calibre sale del nombre de la tripa', T.state.calibre);
  const r = T.compute(T.state);
  ok(r.costoTripa > 0 && Math.abs(r.costoTripa - r.metros * 150) < 1e-6, 'los cocidos también calculan metros y costo de tripa', r.costoTripa);
  ok(T.state.items.length === items && T.state.movimientos.length === movs, 'elegir la tripa no toca el stock');
  const hilo = T.crearItem('Hilo de algodón', 'm', 'insumo');
  T.comprarItem(hilo.id, 100, 20);
  T.cambiarEnvoltura('', { cierre: 'hilo' });
  T.cambiarEnvoltura('hilo', { itemId: hilo.id, cantidad: 4 });
  ok(T.costoEnvolturasDe(T.datosReceta()) === 80, 'el hilo de cierre suma al costo (4 m × $20)');
  T.cambiarEnvoltura('', { cierre: 'clip' });
  const env = T.datosReceta().envolturas;
  ok(env && env.clip.usar && !env.hilo.usar, 'hilo o clip: uno solo', env);
  ok(!('papel' in env) && !('red' in env), 'un embutido no guarda papel ni red');
  ok(T.datosReceta().tripaId === tr.id, 'la tripa elegida queda en los datos del cocido');
  ok(T.calibreDeNombre('Tripa natural 38/40') === 38 && T.calibreDeNombre('Colágeno 50 mm') === 50 && T.calibreDeNombre('Tripa') === 0, 'lee el calibre del nombre');
}

// ================= ficha de receta (PDF) =================
console.log('\n== Ficha de receta para imprimir ==');
{
  const { T } = cargarApp();
  const antes = JSON.stringify(T.state.ingredientes) + '|' + T.state.loteAbierto + '|' + T.state.tipo;
  const tipos = new Set();
  let todas = true;
  let sinPasos = 0;
  for (const rec of T.state.recetario) {
    tipos.add(rec.tipo);
    try {
      const doc = T.fichaRecetaDoc(rec.data, rec.nombre, rec.notas);
      if (!doc.html.includes('<svg') || !doc.body.includes('Ingredientes') || !doc.body.includes(rec.nombre.replace(/&/g, '&amp;'))) todas = false;
      if (!doc.body.includes('class="paso"')) sinPasos++;
    } catch (e) { todas = false; console.log('  ' + rec.nombre + ': ' + e.message); }
  }
  ok(T.state.recetario.length > 0 && todas, 'la ficha se arma para todas las recetas del recetario (' + T.state.recetario.length + ', tipos: ' + [...tipos].join(', ') + ')');
  ok(tipos.size >= 4, 'el recetario de prueba cubre varios tipos');
  ok(antes === JSON.stringify(T.state.ingredientes) + '|' + T.state.loteAbierto + '|' + T.state.tipo, 'imprimir desde el recetario no cambia lo que hay en pantalla');
  const rec = T.state.recetario.find((r) => r.tipo === 'fermentado');
  const doc = T.fichaRecetaDoc(rec.data, rec.nombre, 'Nota de prueba');
  ok(doc.body.includes('Mezcla total') && doc.body.includes('Tripa y cierre') && doc.body.includes('Nota de prueba') && doc.body.includes('Sales de cura'), 'fermentado: kg como mezcla total, tripa y cierre, sales de cura aparte y notas');
  ok(doc.css.includes('print-color-adjust') && doc.css.includes('#c75b45'), 'estilo con los colores de la app y colores de impresión forzados');
  const ent = T.state.recetario.find((r) => r.tipo === 'entero');
  const docEnt = T.fichaRecetaDoc(ent.data, ent.nombre, '');
  ok(docEnt.body.includes('kg de carne') && docEnt.body.includes('<span>Carne</span>'), 'entero: el peso es el de la carne');
  const mal = T.fichaRecetaDoc(Object.assign({}, rec.data, { tipo: 'cocido', curaTipo: 'cura2' }), 'Cocido con cura #2', '');
  ok(mal.body.includes('aviso bad') && mal.body.includes('nitrosaminas'), 'la alerta roja de cura #2 en un cocido sale destacada en la hoja');
  ok(!/<script/i.test(T.fichaRecetaDoc(rec.data, '<script>x</script>', '<b>x</b>').body), 'se escapa lo que escribe el usuario');
  const src = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  ok(src.includes("$('card-costos').hidden = esBrine || state.editandoReceta") && src.includes("$('card-envolturas').hidden = state.tipo === 'salmuera' || state.editandoReceta") && src.includes("$('tripa-item-campo').hidden = state.editandoReceta"), 'al editar una receta del recetario no se muestra nada del stock (costos, tripa del stock, cierre)');
  const fresco = T.fichaRecetaDoc(Object.assign({}, rec.data, { tipo: 'fresco', curaTipo: 'cura1' }), 'Chorizo fresco', '');
  ok(!fresco.body.includes('aviso bad') && fresco.body.includes('Tripa y cierre') && fresco.body.includes('Mezcla total'), 'embutido fresco con cura #1: sin alerta roja y con tripa y cierre');
}

console.log('\n== Imprimir desde un lote ==');
{
  const { T, ctx } = cargarApp();
  const salida = [];
  ctx.Android = { imprimir: (html, titulo) => salida.push({ html, titulo }) };
  const idSalame = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'fermentado');
  const l = T.crearLote({ recetaId: idSalame, kg: 5 });
  T.abrirLote(l.id);
  const tr = T.crearItem('Tripa colágeno 45/48', 'm', 'insumo');
  T.comprarItem(tr.id, 30, 150);
  T.elegirTripa(tr.id);
  T.abrirImpresion('receta');
  ok(salida.length === 1, 'Imprimir dentro de un lote manda la hoja directo, sin diálogo', salida.length);
  const html = salida[0] ? salida[0].html : '';
  ok(html.includes('class="paso"') && html.includes('Ingredientes'), 'la hoja del lote lleva ingredientes y pasos');
  ok(html.includes(T.state.calibre + ' mm') && html.includes(T.fmt(T.compute(T.state).metros, 2) + ' m'), 'calibre y metros de la hoja coinciden con la pantalla (' + T.state.calibre + ' mm)');
}

// ================= grupos del stock =================
console.log('\n== Grupos del stock ==');
{
  // Respaldo viejo o raro: sin grupo, o con uno que no existe, vale el que sugiere el nombre.
  const semilla = {
    [LS.migracion]: { fecha: '2026-11-02' },
    [LS.grupos]: { fecha: '2026-11-03' },
    [LS.items]: [
      { id: 'a', nombre: 'Tocino', categoria: 'producto', unidad: 'kg' },
      { id: 'b', nombre: 'Cura #2', categoria: 'insumo', unidad: 'g', grupo: 'cosa-rara' },
      { id: 'c', nombre: 'Sal fina', categoria: 'insumo', unidad: 'g', grupo: 'especia' }
    ]
  };
  const { T } = cargarApp(semilla);
  const it = (id) => T.state.items.find((x) => x.id === id);
  ok(T.grupoItem(it('a')) === 'grasa' && T.grupoItem(it('b')) === 'cura', 'sin grupo o con uno inválido se usa el del nombre');
  ok(T.grupoItem(it('c')) === 'especia', 'el grupo elegido manda sobre el nombre');
  it('c').nombre = 'Otra cosa';
  ok(T.grupoItem(it('c')) === 'especia', 'renombrar no cambia el grupo');

  const tot0 = T.totalesStock();
  const carne = T.crearItem('Carne de cerdo', 'kg');
  T.existenciaItem(carne.id, 2, 5000);
  ok(carne.grupo === 'carnico' && carne.categoria === 'producto' && T.totalesStock().producto === tot0.producto + 10000, 'ítem nuevo: grupo sugerido, producto y suma en productos');
  T.cambiarGrupo(carne.id, 'aditivo');
  ok(carne.categoria === 'insumo' && T.totalesStock().producto === tot0.producto && T.totalesStock().insumo >= 10000, 'al cambiar de grupo la categoría y los totales lo siguen');

  const tr = T.crearItem('Colágeno 45/48', 'm', undefined, 'tripa', 'Colágeno');
  ok(tr.grupo === 'tripa' && tr.tipoTripa === 'Colágeno', 'la tripa guarda su tipo');
  T.cambiarTipoTripa(tr.id, 'Cular');
  ok(tr.tipoTripa === 'Cular', 'se cambia el tipo de tripa');
  T.cambiarTipoTripa(tr.id, '');
  ok(!('tipoTripa' in tr), 'y se puede dejar sin tipo');
  T.cambiarGrupo(tr.id, 'tripa', 'Fibrosa');
  ok(tr.tipoTripa === 'Fibrosa', 'cambiarGrupo a tripa acepta el tipo');
  T.cambiarGrupo(tr.id, 'envoltura');
  ok(!('tipoTripa' in tr) && tr.categoria === 'insumo', 'si deja de ser tripa se borra el tipo');
  T.cambiarGrupo(tr.id, 'inventado');
  ok(tr.grupo === 'envoltura', 'un grupo inválido se ignora');
}
{
  const { T } = cargarApp();
  const hilo = T.crearItem('Hilo de algodón', 'm', undefined, 'envoltura');
  const trp = T.crearItem('Tripa vacuna', 'm', undefined, 'tripa', 'Cular');
  const cinta = T.crearItem('Cinta', 'u', undefined, 'otro');
  const vino = T.crearItem('Vino', 'L');
  const lt = T.itemsParaEnvoltura('tripa').map((x) => x.id);
  ok(lt[0] === trp.id && lt.includes(hilo.id) && lt.includes(cinta.id) && !lt.includes(vino.id), 'selector de tripa: primero las tripas, y sigue listando lo demás en m o u', lt);
  const lh = T.itemsParaEnvoltura('hilo').map((x) => x.id);
  ok(lh[0] === hilo.id && lh.includes(trp.id), 'selector de cierre: primero cierres y envolturas');
  const clip = T.crearItem('Clip', 'u', undefined, 'envoltura');
  const papel = T.crearItem('Papel microporoso', 'u', undefined, 'envoltura');
  const primero = (k) => T.itemsParaEnvoltura(k)[0].id;
  ok(primero('papel') === papel.id && primero('hilo') === hilo.id && primero('clip') === clip.id, 'dentro de cierres y envolturas, primero el que coincide con el nombre');
}
{
  const { T, $ } = cargarApp();
  ok(T.curaPorDefecto('fermentado') === 'cura2' && T.curaPorDefecto('entero') === 'cura2' && T.curaPorDefecto('cocido') === 'cura1' && T.curaPorDefecto('fresco') === 'cura1', 'la cura que se propone según el tipo');
  let falla = null;
  try {
    T.state.curaTipo = 'cura2'; T.renderGrupoCura($('ingredientes'));
    T.state.curaTipo = 'ninguna'; T.renderGrupoCura($('ingredientes'));
  } catch (e) { falla = e.message; }
  ok(!falla, 'el grupo «Sales de cura» de la receta se arma con y sin cura', falla);
  const sin = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS.salame, { curaTipo: 'ninguna' })));
  ok(sin.alertas.some((a) => a.tone === 'bad' && /botulismo/.test(a.texto)), 'quitar la cura de un fermentado sigue dando la alerta roja');
  const mal = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS.salame, { curaTipo: 'cura1' })));
  ok(mal.alertas.some((a) => a.tone === 'bad' && /botulismo/.test(a.texto)), 'cambiar a cura #1 en un fermentado también');
}

// ================= cocidos sin alarma de sal / enteros: días en bolsa =================
console.log('\n== Cocido: sal libre · Entero: días en bolsa ==');
{
  const { T } = cargarApp();
  const idCoc = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'cocido');
  const conSal = (pct) => {
    const d = JSON.parse(JSON.stringify(T.RECETAS[idCoc]));
    d.ingredientes = d.ingredientes.map((x) => (x.rol === 'sal' ? Object.assign({}, x, { pct }) : x));
    return T.compute(T.estadoDeData(d));
  };
  const esAvisoSal = (a) => /Sal total|Falta la sal/.test(a.texto);
  ok(!conSal(0.5).alertas.some(esAvisoSal), 'cocido con poca sal (0,5 %): sin avisos de sal');
  ok(!conSal(5).alertas.some(esAvisoSal), 'cocido con mucha sal (5 %): sin avisos de sal tampoco');
  ok(conSal(0.5).tonos.sal === 'ok', 'cocido: el cuadro de sal queda en verde');
  const sinSal = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS[idCoc], { ingredientes: T.RECETAS[idCoc].ingredientes.filter((x) => x.rol !== 'sal') })));
  ok(!sinSal.alertas.some(esAvisoSal), 'cocido sin sal cargada: sin aviso de falta de sal');
  const nit = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS[idCoc], { curaTipo: 'cura1', curaPct: 3 })));
  ok(nit.alertas.some((a) => a.tone === 'bad' && /Nitrito/.test(a.texto)), 'cocido: el aviso de nitrito alto sigue');
  const mal = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS[idCoc], { curaTipo: 'cura2' })));
  ok(mal.alertas.some((a) => a.tone === 'bad' && /nitrosaminas/.test(a.texto)), 'cocido: cura #2 sigue en rojo (nitrosaminas)');
  // Los demás tipos conservan los avisos de sal.
  const sal = T.compute(T.estadoDeData(Object.assign({}, T.RECETAS.salame, { ingredientes: T.RECETAS.salame.ingredientes.map((x) => (x.rol === 'sal' ? Object.assign({}, x, { pct: 0.5 }) : x)) })));
  ok(sal.alertas.some((a) => a.tone === 'bad' && /Sal total/.test(a.texto)), 'fermentado: la sal baja sigue en rojo');

  // Días en bolsa: el mayor entre 1 día cada 0,5 cm y la difusión (0,29·espesor² días), más 3 de margen.
  const ent = (e) => T.compute(T.estadoDeData(Object.assign({}, T.RECETAS.bondiola, { espesor: e })));
  ok(ent(5).diasBolsa === 13 && ent(2).diasBolsa === 7 && ent(6).diasBolsa === 15, 'hasta ~7 cm manda la regla lineal: 2 cm → 7, 5 cm → 13, 6 cm → 15', [ent(2).diasBolsa, ent(5).diasBolsa, ent(6).diasBolsa]);
  ok(ent(8).diasBolsa === 22 && ent(10).diasBolsa === 32 && ent(12).diasBolsa === 45, 'en piezas gruesas manda la difusión: 8 cm → 22, 10 cm → 32, 12 cm → 45', [ent(8).diasBolsa, ent(10).diasBolsa, ent(12).diasBolsa]);
  ok(ent(12).diasBolsa > ent(10).diasBolsa && ent(10).diasBolsa > ent(8).diasBolsa && ent(8).diasBolsa > ent(6).diasBolsa, 'los días nunca bajan al aumentar el espesor');
  ok(!ent(10).alertas.some((a) => /el centro tarda mucho en recibir sal y nitrito/.test(a.texto)) && ent(10.5).alertas.some((a) => a.tone === 'warn' && /el centro tarda mucho en recibir sal y nitrito/.test(a.texto)), 'más de 10 cm avisa que el centro tarda y que hay que revisar el color al cortar');
  ok(ent(4.2).diasBolsa === 12, '4,2 cm → 12 días (se redondea para arriba)', ent(4.2).diasBolsa);
  ok(ent(0).diasBolsa === 0 && ent('').diasBolsa === 0, 'sin espesor no hay días en bolsa');
  ok(T.compute(T.estadoDeData(Object.assign({}, T.RECETAS.salame, { espesor: 6 }))).diasBolsa === 0, 'solo los enteros usan el espesor');
  ok(T.RECETAS.bondiola.espesor === 6 && T.RECETAS.panceta.espesor === 4, 'las recetas de ejemplo traen su espesor');
  // El espesor viaja con el lote y con el recetario.
  const l = T.crearLote({ recetaId: 'bondiola', kg: 1.2 });
  T.abrirLote(l.id);
  ok(T.state.espesor === 6, 'al abrir un lote de bondiola, el espesor es 6 cm', T.state.espesor);
  T.state.espesor = 8;
  T.sincronizarLote ? T.sincronizarLote() : null;
  ok(T.datosReceta().espesor === 8, 'datosReceta incluye el espesor');
  ok(T.limpiarDataReceta({ tipo: 'entero', espesor: 99 }).espesor === 30 && T.limpiarDataReceta({ tipo: 'entero' }).espesor === 0, 'limpiarDataReceta acota el espesor (0–30) y lo deja en 0 si falta');
}

// ================= idiomas =================
console.log('\n== Idiomas ==');
{
  const LS_IDIOMA = 'charcuteriaIdioma.v1';
  const { T } = cargarApp();
  ok(T.IDIOMA === 'es' && T.tx('Lotes') === 'Lotes', 'sin elegir, la app queda en castellano');
  ok(T.tx('Hace {d} días que no respaldás tus datos.', { d: 9 }) === 'Hace 9 días que no respaldás tus datos.', 'tx completa las variables');
  // Cada texto marcado con tx('…') tiene traducción en inglés y alemán, con las mismas variables.
  const des = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  const codigo = scripts[0][1];
  const marcados = [...new Set([...codigo.matchAll(/\btx\('((?:[^'\\]|\\.)*)'/g)].map((m) => des(m[1])))];
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  for (const idioma of ['en', 'de']) {
    const d = T.I18N[idioma];
    const faltan = marcados.filter((k) => !Object.prototype.hasOwnProperty.call(d, k));
    ok(!faltan.length, idioma + ': todos los textos marcados (' + marcados.length + ') tienen traducción', faltan.slice(0, 8));
    const malas = Object.keys(d).filter((k) => vars(k) !== vars(d[k]));
    ok(!malas.length, idioma + ': las traducciones conservan las variables {…}', malas.slice(0, 5));
    ok(/BORRAR/.test(d['Para confirmar escribí BORRAR'] || ''), idioma + ': el aviso de borrado en bloque sigue pidiendo BORRAR');
    const cura = Object.keys(d).filter((k) => /Cura #[12]/.test(k) && /Nitritpökelsalz/i.test(d[k]));
    ok(!cura.length, idioma + ': la cura #1/#2 no se traduce como Nitritpökelsalz', cura);
  }
  const datos = JSON.stringify(T.datosParaRespaldo ? T.datosParaRespaldo() : {});
  ok(!datos.includes(LS_IDIOMA), 'el idioma no viaja en el respaldo');

  for (const [idioma, re, cocinar] of [['en', /botulism/i, /nitrosamine/i], ['de', /Botulismus/, /Nitrosamin/]]) {
    const { T: Ti } = cargarApp({ [LS_IDIOMA]: idioma });
    ok(Ti.IDIOMA === idioma, idioma + ': la elección guardada se respeta al abrir');
    const mal = Ti.compute(Ti.estadoDeData(Object.assign({}, Ti.RECETAS.salame, { curaTipo: 'cura1' })));
    ok(mal.alertas.some((a) => a.tone === 'bad' && re.test(a.texto)), idioma + ': cura #1 en un fermentado sigue en rojo, con el aviso de botulismo traducido');
    const coc = Object.keys(Ti.RECETAS).find((k) => Ti.RECETAS[k].tipo === 'cocido');
    const c2 = Ti.compute(Ti.estadoDeData(Object.assign({}, Ti.RECETAS[coc], { curaTipo: 'cura2' })));
    ok(c2.alertas.some((a) => a.tone === 'bad' && cocinar.test(a.texto)), idioma + ': cura #2 en un cocido sigue en rojo (nitrosaminas)');
    ok(!mal.alertas.some((a) => /botulismo|Usá cura/.test(a.texto)), idioma + ': no quedan avisos en castellano');
    const hoja = Ti.traducirHTML('<h2>Ingredientes</h2><td>Carne de cerdo</td>');
    ok(!hoja.includes('<h2>Ingredientes</h2>'), idioma + ': la hoja impresa traduce sus títulos', hoja);
  }
  {
    const { T: Tc, ls, ctx } = cargarApp();
    let recargas = 0;
    ctx.location = { reload: () => { recargas++; } };
    ok(Tc.cambiarIdioma('de') === true && ls.get(LS_IDIOMA) === 'de' && recargas === 1, 'cambiar el idioma lo guarda y recarga');
    ok(Tc.cambiarIdioma('xx') === false && ls.get(LS_IDIOMA) === 'de', 'un idioma desconocido no cambia nada');
  }
}

// ================= escalar el lote según lo que tengo =================
console.log('\n== Escalar según lo que tengo ==');
{
  const { T } = cargarApp();
  for (const tipo of ['fermentado', 'entero', 'cocido', 'fresco']) {
    const id = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === tipo);
    if (!id) continue;
    const l = T.crearLote({ recetaId: id, kg: 5 });
    T.abrirLote(l.id);
    const antes = T.state.ingredientes.map((x) => x.pct);
    const idx = T.state.ingredientes.findIndex((x) => x.rol === 'carnico' && x.pct > 0);
    ok(T.escalarLote(idx, 850) === true, tipo + ': escalar con 850 g de ' + T.state.ingredientes[idx].nombre);
    const r = T.compute(T.state);
    cerca(r.ing[idx].g, 850, 1, tipo + ': ese ingrediente queda en 850 g');
    ok(T.state.ingredientes.every((x, i) => x.pct === antes[i]), tipo + ': no cambia ningún porcentaje');
    ok(T.lotePorId(l.id).data.kg === T.state.kg, tipo + ': el lote guarda los kg nuevos', T.state.kg);
    const g = T.state.ingredientes.findIndex((x) => x.rol === 'grasa' && x.pct > 0);
    if (g >= 0) {
      T.escalarLote(g, 400);
      cerca(T.compute(T.state).ing[g].g, 400, 1, tipo + ': también escala por la grasa (400 g)');
    }
    T.cerrarLote();
  }
  const sal = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'salmuera');
  if (sal) ok(T.kgParaIngrediente(T.estadoDeData(T.RECETAS[sal]), 0, 850) === null, 'en salmuera no se escala por ingrediente');
  const id = Object.keys(T.RECETAS).find((k) => T.RECETAS[k].tipo === 'fermentado');
  const l = T.crearLote({ recetaId: id, kg: 5 });
  T.abrirLote(l.id);
  const adit = T.state.ingredientes.findIndex((x) => x.rol !== 'carnico' && x.rol !== 'grasa');
  ok(T.kgParaIngrediente(T.state, adit, 20) === null, 'no se escala por un aditivo');
  ok(T.kgParaIngrediente(T.state, 0, 0) === null && T.kgParaIngrediente(T.state, 0, 'abc') === null, 'sin gramos válidos no hace nada');
  T.lotePorId(l.id).estado = 'proceso';
  const kgAntes = T.state.kg;
  const idx = T.state.ingredientes.findIndex((x) => x.rol === 'carnico');
  ok(T.escalarLote(idx, 850) === false && T.state.kg === kgAntes, 'un lote en proceso no se puede escalar');
}

console.log('\n' + (fallos ? 'FALLOS: ' + fallos : 'TODO OK'));
process.exit(fallos ? 1 : 0);
