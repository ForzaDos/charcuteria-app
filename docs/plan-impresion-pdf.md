# Plan — Imprimir / guardar en PDF

- **Estado:** implementado en **1.0.7** (versionCode 9). Web probada; APK compilado con el puente nativo.
- **Fecha:** 02/11/2026.
- **Alcance:** receta, procesos, compras, stock y “todo”, en la web local y en el APK.
- **Decisión de fondo:** una sola fuente de documento y dos disparadores: `window.print()` en la web y `PrintManager` en el APK.

## Decisiones cerradas con el usuario

1. **Entrada:** botones individuales en cada sector (Receta, Procesos, Compras, Stock), no una única hoja global. Cada botón abre una **hoja de opciones con celdas seleccionables** para elegir qué imprimir; “Todo” selecciona todas las secciones.
2. **“Todo” incluye Stock, costos y advertencias de la receta.** Sí.
3. **PDF:** lo más simple, con el **diálogo de impresión del sistema** y “Guardar como PDF”. No se genera un archivo directo sin diálogo.
4. **Orden:** primero la **Etapa 1 web** y se prueba en Chrome; después la Etapa 2 APK.
5. **Web local:** sin backend. La web y el APK siguen con datos separados en `localStorage`; cada uno imprime lo que tiene.
6. **Nombre del documento:** `<Receta> — <sección> (<fecha>)`. Ejemplo: `Salame Tandil — receta (2026-11-02)`.
7. **“Todo”:** receta actual + procesos + compras + stock + costos + advertencias, con saltos de página entre secciones.

## Diagnóstico

- **Web local:** `window.print()` funciona directo; el navegador ya ofrece “Guardar como PDF”.
- **APK:** `window.print()` es **no-op en WebView**. Hay que usar `PrintManager` + `createPrintDocumentAdapter` y un puente `@JavascriptInterface` para dispararlo desde JS. No hacen falta permisos ni `WebChromeClient`.
- La app ya centraliza los cálculos en `compute()`, `necesidadesLista()`, `valorStock()`, `recetaBase()` y `estadoDeLote()`.
- Los **días de curado** hoy se calculan dentro de `recalcular()`; hay que extraerlos a `diasCurado()` para que los use también la impresión.

## Arquitectura

### Una sola fuente

`construirDocImpresion(opciones)` arma un **HTML standalone listo para papel** (fondo blanco, A4, tablas, encabezado, pie) leyendo `state` y reusando:

- `compute(state)` para gramos, sal, ppm, merma, peso final, tripas y costos;
- `necesidadesLista()` para lotes, necesidad, stock, falta y totales;
- `valorStock()` para el stock valorizado;
- `recetaBase()` y `estadoDeLote()` para la receta y los lotes;
- `fmt`, `gramos`, `plata`, `cantidadCorta`, `esc` para el formato;
- `diasCurado()` (nuevo helper extraído de `recalcular()`).

No se recalculan fórmulas a mano ni se duplica la lógica.

### Web

- El HTML se inyecta en un contenedor oculto `#print-root`.
- `@media print` esconde la app, la tabbar, los inputs y el `toast`; muestra solo el documento.
- Se dispara `window.print()`; el navegador resuelve “Guardar como PDF”.
- `document.title` temporal con el nombre del documento; se restaura después.

### APK

- `MainActivity.java`: `webView.addJavascriptInterface(new JsBridge(), "Android")` antes del `loadUrl`.
- `@JavascriptInterface imprimir(html, jobName)`:
  - corre en el UI thread;
  - crea un **WebView oculto** con fondo blanco y JS/DOM habilitados;
  - carga el HTML con `loadDataWithBaseURL("file:///android_asset/", ...)`;
  - en `onPageFinished`, arma `PrintAttributes` A4 y llama a `PrintManager.print(jobName, hiddenWebView.createPrintDocumentAdapter(jobName), attrs)`;
  - destruye el WebView oculto al terminar.
- JS: si `window.Android.imprimir` existe, lo usa; si no, `window.print()`. Si el bridge falla, un toast.
- No se imprime el WebView visible: así no se filtran tema oscuro, tabbar ni controles.

## UI: botones por sector + hoja de selección

### Dónde va cada botón

- **Receta:** en el encabezado de la tarjeta “Receta base” o en la cabecera de la vista.
- **Procesos:** en el encabezado de la tarjeta “Procesos”.
- **Compras:** en el encabezado de la tarjeta “Compras”.
- **Stock:** en el encabezado de la tarjeta “Stock”.
- **Todo:** dentro de la hoja de opciones (y opcionalmente un acceso en la cabecera).

### Hoja de opciones

Cada botón abre la misma hoja, con el sector correspondiente **preseleccionado** y el resto disponible:

- **Receta:** Identificación, Ingredientes, Indicadores (sal, ppm, merma, peso, días, tripas), Advertencias, Notas.
- **Procesos:** Pasos.
- **Compras:** Lotes en curso, Por comprar, Costos/totales.
- **Stock:** Stock y valor.
- **Todo:** marca todas las secciones y subbloques.

Acciones: **Imprimir** y **Cancelar**. Los checkboxes se recuerdan sólo durante la sesión de impresión; no se persisten.

### Comportamiento

- Si no hay lotes en curso, Compras usa la receta actual como respaldo (igual que hoy).
- Si no hay precios o stock, se imprime “—” o “sin precio”, no se inventan valores.
- Imprimir no muta `state`, `localStorage` ni la receta.

## Contenido de impresión

### Encabezado común

“Charcutería”, nombre de la receta o “Lotes en curso”, fecha y hora (`es-AR`), y alcance (“Receta”, “Compras”, “Todo”). Pie con “Generado offline” y, si se puede, número de página.

### Receta

- Identificación: nombre, tipo (`TIPOS`), kg, calibre, merma, cura (tipo + %).
- Tabla de ingredientes: nombre, rol/%, gramos.
- Indicadores: sal total (g y %), sal de cura (g), azúcar, nitrito/nitrato ppm, días de curado, peso de mezcla, merma, peso final, pérdida, rendimiento, aw, metros de tripa.
- Nota de la receta.
- Advertencias de `compute()` (las `bad` y `warn`).

### Procesos

- Pasos numerados de `state.procesos`.
- Si no hay: “Sin pasos todavía.”

### Compras

- Lotes en curso: nombre, kg, tipo, fecha.
- Por comprar: nombre, necesario, stock, falta, precio unitario, costo de lo que falta.
- Totales: costo total, costo ya en stock, costo a comprar, $/kg fresco y $/kg final.
- Stock valorizado.

### Stock

- Ítem, cantidad (kg o m), precio unitario, valor.
- Total valorizado al pie.

### “Todo”

Receta → Procesos → Compras → Stock, con salto de página entre secciones. Incluye costos y advertencias.

## Layout y CSS de impresión

- `@page { size: A4; margin: 15mm; }`.
- Fondo blanco, texto negro, tablas con bordes finos; no usar el tema oscuro.
- `thead { display: table-header-group; }` para repetir encabezados.
- `tr, .paso, .stat { break-inside: avoid; }`; `h1/h2 { break-after: avoid; }`.
- Saltos de página entre secciones grandes en “Todo”.
- Tipografía estándar del sistema; no depender de fuentes de la app.
- Verificar tildes, ñ, °, °Bé, ≤, – y cualquier emoji de procesos/notas.

## Etapas

### Etapa 1 — Web (sin Java)

1. Botones de impresión por sector y hoja de checkboxes.
2. Extraer `diasCurado()` y reusarlo en `recalcular()`.
3. `construirDocImpresion(opciones)`.
4. `#print-root` + CSS `@media print`.
5. `window.print()` + `document.title` temporal.
6. Probar en Chrome: cada sección, “Todo”, A4, “Guardar como PDF”.

**Se valida contenido y layout antes de tocar Android.**

### Etapa 2 — APK

7. Bridge `@JavascriptInterface` en `MainActivity.java`.
8. WebView oculto + `PrintManager` + `createPrintDocumentAdapter`.
9. Detección del bridge y fallback.
10. Probar en el Redmi con el diálogo de impresión y “Guardar como PDF”.

### Etapa 3 — QA y release

11. Matriz completa, estados vacíos, tablas largas, tildes/ñ, PDF abierto.
12. Versión 1.8 (`versionCode 9`), build, instalación, release.

## Pruebas

| Escenario | Web | APK |
|---|---|---|
| Receta sola | ✔ | ✔ |
| Procesos sola | ✔ | ✔ |
| Compras sola | ✔ | ✔ |
| Stock sola | ✔ | ✔ |
| Todo (multipágina) | ✔ | ✔ |
| A4, márgenes, saltos | ✔ | ✔ |
| Sin lotes / sin precios / sin stock | ✔ | ✔ |
| Tildes/ñ/°/≤/– | ✔ | ✔ |
| Tabla larga con `thead` repetido | ✔ | ✔ |
| “Guardar como PDF” y abrir el PDF | ✔ | ✔ |
| No se imprime tabbar/tema oscuro/inputs | ✔ | ✔ |
| Imprimir no muta el estado | ✔ | ✔ |
| Bridge ausente → fallback web | ✔ | — |
| Bridge presente | — | ✔ |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `@media print` poco fiable en WebView | No se usa en el APK: el HTML de impresión es blanco/A4 por construcción y va en un WebView oculto |
| Paginación del WebView oculto | Dimensionar ~A4 y validar en el Redmi |
| Saltos que cortan filas | `break-inside: avoid` + `thead` repetido |
| Fuentes distintas a papel | Tipografía estándar en el documento de impresión |
| Android sin “Guardar como PDF” | Es del fabricante; fallback “compartir HTML” queda como plan B, no en la v1 |
| Nombre del PDF inconsistente | Un solo `nombreDocumento()` para web y `jobName` nativo |
| Botón chico en mobile | Área táctil ≥ 44 px, ícono + texto, `aria-label` |
| Duplicar días de curado | Extraer `diasCurado()` y reusarlo |

## Fuera de alcance (por ahora)

- Backend o datos compartidos entre web y APK.
- Generador de PDF en JS puro o archivo directo sin diálogo.
- Impresión del recetario completo o del historial de lotes.
- Compartir HTML como archivo.

## Estado de implementación

Implementado en **1.0.7** (versionCode 9): Etapa 1 web probada (hoja de selección, documento, PDF de 50 KB) y Etapa 2 APK compilada con `MainActivity` + `PrintManager`. Falta la prueba final en el Redmi.
