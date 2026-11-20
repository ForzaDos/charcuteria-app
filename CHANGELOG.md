# Changelog — Charcutería

La numeración actual es **1.0.x**. Las releases **1.4 a 1.7** son builds anteriores a ese cambio de numeración; se conservan como histórico.

## 1.2.0 — 2026-11-20

- **Escalar el lote según lo que tengo**: los gramos de cada carne y del tocino, en la lista de ingredientes, ahora se pueden escribir. Si tenés 850 g de cerdo, escribís 850 ahí y los kg del lote se recalculan para que esa carne pese eso, sin cambiar ningún porcentaje; todo lo demás (sal, cura, especias) se ajusta solo. Funciona en enteros, frescos, fermentados y cocidos, mientras el lote está en preparación (en proceso quedan bloqueados). Reemplaza al cuadro «Escalar según lo que tengo».
- **Idiomas: castellano, inglés y alemán.** Arriba a la derecha hay un selector ES / EN / DE; al cambiarlo la app se recarga en ese idioma (con el editor de recetas abierto pide confirmar). Se traducen la pantalla, los avisos de seguridad, los mensajes, las hojas impresas, las planillas CSV y los avisos de Android. Los números y las fechas siguen el idioma. Las recetas (nombres, ingredientes, pasos y notas) son datos tuyos y quedan como las escribiste, también las de ejemplo. La elección se guarda en el teléfono y no viaja en el respaldo. En alemán la cura #1/#2 se llama «Cure #1/#2», nunca Nitritpökelsalz (que tiene unas 10 veces menos nitrito).

## 1.1.1 — 2026-11-03

- **Imprimir / PDF de una receta, en una hoja**: desde el recetario (⋯ → Imprimir / PDF), desde el editor de la receta o desde un lote (botón Imprimir de arriba), sin pasos intermedios; el diálogo con secciones queda en Procesos, Compras y Stock. Sale con el logo de la app, los colores y líneas de la app sobre fondo blanco, datos clave (peso, merma, rendimiento, calibre, días), advertencias (las de cura en rojo), ingredientes agrupados con % y gramos, tripa y cierre o papel y red, pasos numerados y notas. No cambia lo que hay abierto en pantalla. Las demás impresiones (lote, compras, stock) usan el mismo estilo; el rótulo de los kg ahora dice Carne o Mezcla total según el tipo.
- **Grupos del stock elegibles**: cada ítem tiene su grupo —**Cárnicos**, **Grasa**, **Tripas**, **Cierres y envolturas** (hilo, clip, papel, red), **Aditivos**, **Sales de cura**, **Especias**, **Otros alimentos** y **Otros**—. Se elige al cargar un ítem nuevo (sugiere uno por el nombre) y se cambia después en ⋯ → Grupo; renombrar no lo cambia. La lista de Stock se arma por grupo, con su subtotal, y los filtros son uno por grupo. Los ítems que ya había quedan con el grupo que sugería su nombre. Las **tripas** guardan además un **tipo** (natural de cerdo o de cordero, cular, chinesca, colágeno, celulósica, fibrosa). Los selectores de tripa, cierre y envoltura ponen primero lo del grupo que corresponde y siguen listando todo lo demás. «Producto» e «Insumo» quedan solo en los totales.
- **Sal de cura aparte y editable en la receta**: en los ingredientes tiene su propio grupo «Sales de cura», fuera de Aditivos: se elige Cura #1 o #2, el porcentaje, se quita con × y, si no hay, aparece «+ Agregar sal de cura». Nada la fija; los avisos de cura (botulismo, nitrosaminas, ppm) siguen en las alertas. También sale como grupo aparte en la hoja impresa.
- **Tipo nuevo: embutido fresco** (sin secado en cámara, cura #1, lleva tripa y cierre como fermentados y cocidos).
- **Avisos de cura en rojo**: cura #2 en un fresco o cocido (al cocinar, el nitrato puede formar nitrosaminas, tóxicas) y cura #1 en un entero o fermentado que pasa más de 2 semanas en cámara (riesgo de botulismo: va cura #2).
- **Vincular ingrediente ↔ stock**: en «Ingredientes: stock y costo» cada ingrediente tiene un selector con los ítems del stock (o «No está en el stock»). Sirve cuando el nombre de la receta no coincide con el del stock y queda para todas las recetas.
- **Embutidos (fermentados y cocidos): tripa y cierre** en la pestaña Receta. La tripa se elige del stock (cualquier unidad; para metros y costo tiene que estar en metros); si el nombre trae el calibre («38/40») se elige solo. Los metros salen del calibre y los kg de la mezcla. Cierre: hilo o clip, con su ítem y cantidad. Cada lote guarda su tripa.
- Los selectores (ingredientes, tripa, cierre, envoltura) tienen **«+ Crear ítem nuevo…»**: lo crea en el stock en 0, sin movimientos. Elegir en la receta no compra ni descuenta nada. Para cargar lo que falta está el botón **Agregar al stock** de cada ingrediente (en el lote) y la compra de siempre; recién ahí se toca el stock. **Al editar una receta del recetario no se muestra nada del stock**: ni costos, ni la tripa del stock, ni el cierre; eso se elige al armar el lote (el calibre sí queda en la receta).
- **Enteros: los kg son el peso de la carne.** Los aditivos y la cura se calculan sobre la carne y se suman, así que la mezcla total y el peso final salen más altos que antes. En fermentados y cocidos los kg siguen siendo la mezcla total. Ojo: un lote entero ya cargado se recalcula con la regla nueva.
- En los enteros se elige si llevan **papel microporoso** y **red**, con su ítem del stock y la cantidad: suman al costo, figuran en lo que falta comprar y se descuentan al elaborar.

- **Precios provisorios** en Costos de materiales → «Detalle por ingrediente»: a lo que no tiene precio en el stock se le puede poner un precio solo para calcular el costo del lote, sin cargarlo al stock. «Agregar al stock» abre la compra con la cantidad y el precio. Si después entra con precio al stock, manda el del stock. Al elaborar con «No descontar del stock», el provisorio sigue contando en el costo del lote.
- **Costo total del lote** destacado (con lo que rinde en producto terminado), detalle de costo por ingrediente y costo en la lista de lotes en preparación y en proceso.
- Respaldo en el teléfono (salía en 0 B): «Guardar respaldo» lo escribe directo en **Descargas/Charcuteria**, sin el selector del sistema, y verifica el tamaño. «Elegir carpeta o Drive…» usa el selector, que ahora sobrevive a que Android reinicie la pantalla. Nuevo **«Copiar respaldo»** como texto. En la web, la descarga ya no queda vacía si Chrome tarda en confirmarla.

- **Stock → + Cargar existencia**: para cargar lo que ya tenés, cuánto hay y cuánto costó (precio por unidad o costo total, se calcula uno del otro). «Guardar y cargar otro» para cargar muchos seguidos. También en el menú ⋯ de cada ítem: **Existencia y costo** (deja la cantidad y el precio que pongas, sin promediar).
- Cargar compra muestra el **total pagado** además del precio por unidad.
- El movimiento «Saldo inicial» pasa a llamarse **Existencia**. Se sacó el formulario «Agregar ítem».
- Se puede dar de alta un ítem con **0** (o sin cantidad) para tenerlo en la lista, por Existencia o por Compra; si estaba borrado, vuelve.
- **Producto** = lo que se come (carnes, grasa, vísceras, leche, vino…); **Insumo** = lo que se consume (sal, aditivos, especias, tripa, hilo). Los ítems existentes se acomodan solos una vez; en ⋯ se puede **pasar a producto / insumo**.
- **Filtros en Stock**: Falta para lotes, Sin stock, Productos, Insumos, Cárnicos, Aditivos, Especias y Tripas, con la cantidad de cada uno.
- **Avisos de faltantes**: arriba de Stock dice cuántas cosas faltan para los lotes en preparación; cada ítem muestra cuánto necesitan los lotes y cuánto falta, y lo que no está en el stock aparece con **Comprar**. En Lotes, cada lote en preparación dice qué le falta o «Hay todo en stock».
- **Totales en Stock**: total en stock con subtotal de Productos e Insumos, y **Falta comprar** (costo estimado de lo que falta para los lotes en preparación; lo que no tiene precio se cuenta aparte). Cada grupo de la lista muestra su subtotal.
- **Borrar en bloque** (al final de Stock): **Borrar todos los movimientos** (los ítems quedan con 0) y **Borrar todo el stock**. Piden dos confirmaciones (la segunda escribiendo BORRAR) y antes guardan un respaldo previo para volver desde Datos.
- Al cargar un ítem nuevo, la categoría se elige sola según el nombre (se puede cambiar).
- **Importar respaldo** confirma con una ventana propia (en Chrome de Android el aviso del navegador podía no aparecer y no importaba nada, sin avisar), acepta archivos con BOM y siempre dice qué pasó.
- `versionCode` 13.

## 1.1.0 — 2026-11-02

- **Cuatro pestañas: Lotes · Compras · Stock · Recetario.** Receta, Curado y Procesos están dentro de cada lote.
- **Varios lotes a la vez**, por estado: **En preparación → En proceso → Terminado**, o **Cancelado**. «+ Iniciar nuevo lote» pregunta si es del recetario o una receta nueva, los kg y el nombre.
- **El stock se descuenta el día que se usa**, con **Elaborar**: muestra cada ingrediente, qué ítem del stock usa, la cantidad real y lo que hay. Si falta, pregunta «¿Lo compraste y no lo cargaste?» y carga la compra; si no, anota el faltante. **Deshacer elaboración** devuelve lo usado.
- **Stock como libro de movimientos**: saldo inicial, compra, uso en lote, uso en otro lado, pérdida, corrección de conteo y anulación, con fecha, lote y nota. Filtros por ítem, tipo y lote.
- Botones por ítem: **Comprar**, **Restar** (pérdida, uso en otro lado, otro), **Corregir conteo**, **Ver movimientos**, **Renombrar** y **Borrar** (archiva si tiene historia; se puede restaurar).
- **Se sacó el stock mínimo.**
- **Datos y respaldo**: guardar un respaldo `.json` completo (en el teléfono o en Drive), planillas CSV de movimientos y lotes, importar un respaldo y volver al respaldo previo. Aviso si pasaron 7 días sin respaldar.
- En proceso la receta queda bloqueada (merma, procesos y notas siguen editables); terminado queda de solo lectura. **Terminar** pide el peso final real.
- Notas por lote. El costo del lote se congela al elaborar y se ve en Curado → «Lo que se usó».
- Botón Atrás de Android: cierra la ventana abierta y vuelve a Lotes antes de salir.
- Arreglos: imprimir «Notas» rompía la impresión; el historial de compras guardaba 201 registros; los diálogos de confirmación ahora se ven en el APK.
- **Migración**: el stock pasa como saldo inicial (los negativos quedan para revisar), el historial de lotes como terminados, el lote abierto como «En preparación» y las recetas en proceso de la 1.0.8 como canceladas. No se borra nada viejo.
- `versionCode` 12.

## 1.0.9 — 2026-11-03

- El kg cargado es el **total de la mezcla** (cárnicos + grasa + aditivos). Si dice 8 kg, el total es 8,00 kg; la base cárnica se calcula (≈7,47 kg en el Salame).
- Ingredientes agrupados con subtotales sobre la base cárnica; los gramos de carne bajan para que el total cierre.
- **Un solo lote activo**: primera pestaña **Lote**; si no hay lote, `Iniciar lote` / `Nuevo lote`; si hay, se edita y se puede **Terminar** o **Cancelar**. Los terminados van al historial; Compras trabaja con el lote actual y el stock se descuenta al terminar.
- **Recetario = plantillas**: las recetas se editan solo desde el Recetario con **Editar receta**. Editar una receta afecta a los próximos lotes, no al lote en curso.
- **Guardar en recetario** desde el lote pregunta **Actualizar original** (con aviso y confirmación) o **Guardar como nueva**.
- **Descartar** vuelve a la receta original actual del recetario que se usó como base.
- Recetario **ordenado por categorías** (Enteros, Fermentados, Cocidos, Salmueras), con `Iniciar lote`, menú `⋯` (Editar receta, Renombrar, Duplicar, Hacer/Sacar base, Borrar), badge `base` y notas.
- **Bondiola y Panceta** recuperan su cárnico en el grupo Cárnicos/proteínas; la data vieja se repara al abrir.
- La sal de cura dejó de mostrarse como “fija”: es un aditivo editable en la fila y sigue en Curado, con los avisos de ppm.
- Migración de `presets`, `guardadas` y recetas base al recetario (`charcuteria.recetario.v1`), sin borrar las claves viejas.
- `versionCode` 11; APK 161.160 bytes.

## 1.0.8 — 2026-11-03

- Versión visible en header y “Acerca de” (`Charcutería 1.0.8`, autor ForzaDos). Launcher del APK: “Charcutería”.
- Ingredientes agrupados en Cárnicos/proteínas, Grasa y Aditivos, con subtotales; sal de cura dentro de Aditivos y avisos de ppm/sal.
- Costos de materiales debajo de la receta: costo fresco, merma, peso final, rendimiento y $/kg fresco/final.
- Stock por ítems (insumo/producto) con unidad kg/g/L/m/u, mínimo, precio promedio e historial de compras.
- Compras que suman stock y promedian el precio; lote asociado opcional.
- Compras/Stock segmentado; varias recetas en proceso con snapshot.
- Stock negativo permitido, destacado con “SIN STOCK” y botón Comprar.
- Migración no destructiva del stock/precios anteriores.
- `versionCode` 10; APK 157.064 bytes.

## 1.0.7 — 2026-11-02

- Impresión/PDF de receta, procesos, compras y stock.
- Botones por sector con hoja de celdas seleccionables; “Todo” incluye stock, costos y advertencias.
- Web con `window.print()`; APK con `PrintManager` + WebView oculto y puente `Android.imprimir`.
- `versionCode` 9; APK 148.872 bytes.

## 1.7 — build anterior (2026-11-02)

- Días de salazón seca totales (salazón + secado).
- Varias recetas en curso; stock por cantidades/precios; descuento de lo usado; costos separados.
- Web local con las mismas funciones.
- `versionCode` 8; APK 144.776 bytes.

## 1.6 — build anterior (2026-11-02)

- Pestaña Compras con precios por ingrediente, subtotales y totales.
- `versionCode` 7; APK 140.680 bytes.

## 1.5 — build anterior (2026-11-02)

- Tocino fijo, carnes balanceadas, alta con tipo, Procesos y Recetario editable.
- `versionCode` 6; APK 140.680 bytes.

## 1.4 — build anterior (2026-11-02)

- Build reproducible con versión desde el manifest; actualización en un comando; repo y release.
- `versionCode` 5; APK 136.584 bytes.
