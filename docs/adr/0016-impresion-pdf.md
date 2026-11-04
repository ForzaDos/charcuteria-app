# ADR 0016 — Impresión / PDF

- **Estado:** aceptada e implementada en 1.0.7
- **Fecha:** 02/11/2026

## Contexto

Se necesita imprimir o guardar en PDF la receta, los procesos, las compras y el stock, desde la web local y desde el APK offline. El APK es un WebView: `window.print()` no funciona ahí. La app no tiene dependencias externas y no debe perder el offline.

## Decisión

- Un solo generador JS, `construirDocImpresion(opciones)`, arma un HTML autónomo en blanco/A4, reusando `compute()`, `necesidadesLista()`, `valorStock()`, `recetaBase()`, `estadoDeLote()` y `diasCurado()`.
- **Web:** el HTML va a `#print-root` y se dispara `window.print()`; el navegador ofrece “Guardar como PDF”. El CSS del documento está prefijado con `.print-doc` para no filtrarse al tema oscuro de la app.
- **APK:** un puente `@JavascriptInterface Android.imprimir(html, jobName)`; `MainActivity` carga el HTML en un WebView oculto y llama a `PrintManager.print(...)` con `createPrintDocumentAdapter` y A4. El “Guardar como PDF” del sistema genera el archivo. Sin permisos ni `WebChromeClient`.
- **UI:** botones de impresión en Receta, Procesos, Compras y Stock; cada uno abre una hoja con celdas seleccionables. “Todo” marca todas las secciones.
- “Todo” incluye Stock, costos y advertencias. El nombre del documento es `<Receta> — <sección> (<fecha>)`.
- La web y el APK no comparten datos; cada uno imprime su `localStorage`.

## Consecuencias

- Funciona offline en el APK y en la web; el PDF lo produce el sistema, con texto seleccionable.
- No hay archivo PDF directo sin diálogo: el usuario elige “Guardar como PDF” en el diálogo.
- La impresión no muta `state` ni `localStorage`.
- El WebView oculto debe medirse bien para paginar; se valida en el Redmi.
- Si un fabricante no ofrece “Guardar como PDF”, queda como plan B compartir el HTML.

## Alternativas consideradas

- **Generador de PDF en JS puro:** control total, pero paginar tablas, tildes y saltos a mano es frágil y costoso.
- **`PrintDocumentAdapter` propio dibujando con `PdfDocument`:** más código sin ventaja sobre el adaptador del WebView.
- **Backend:** solo web y rompe el offline; el servidor no ve el `localStorage`.
