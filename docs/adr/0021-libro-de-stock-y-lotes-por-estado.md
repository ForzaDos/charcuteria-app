# ADR 0021 — Libro de movimientos de stock y lotes por estado

- **Estado:** aceptada e implementada en 1.1.0
- **Fecha:** 02/11/2026
- **Reemplaza:** [0020](0020-lote-actual-unico.md) y la parte de stock de [0015](0015-stock-y-lotes.md) y [0017](0017-stock-por-items.md)

## Contexto

En la 1.0.9 el stock era un número por ítem que se pisaba, el lote era uno solo y vivía en la sesión, y el descuento ocurría al **terminar** el lote (semanas después de usar la carne). El usuario pidió:

- Descontar el stock **el día que se usa**.
- Un stock **general** que registre qué se usó, cuándo y cuánto.
- Poder **borrar un ítem** o **restarle una parte** (pérdida, uso en otro lado, etc.).
- Una primera pestaña más clara: «¿Iniciar nuevo lote?» → receta del recetario o receta nueva.
- **Varios lotes** a la vez.
- Sacar el **stock mínimo** (no se entendía y no se usaba).
- **Exportar** todo para no perder datos y poder subirlo a la nube.

## Decisión

### Stock = libro de movimientos

- Cada ítem (`charcuteria.stockItems.v2`) guarda solo nombre, unidad y categoría. La cantidad y el precio salen de `charcuteria.movimientos.v1`.
- Tipos: **saldo inicial**, **compra**, **uso en lote**, **uso en otro lado**, **pérdida**, **otra salida**, **corrección de conteo** y **anulación**.
- Cantidad = suma de los movimientos vigentes. Precio = **promedio ponderado móvil** de saldos y compras, recalculado en orden de fecha. Si no hay stock positivo, el precio pasa a ser el de la compra.
- Nada se borra del libro: un error se **anula** con otro movimiento que lo referencia, y el promedio se recalcula sin él.
- **Borrar un ítem** con movimientos lo **archiva** (deja de verse, el historial queda y se puede restaurar). Sin movimientos se borra de verdad.
- El stock negativo se permite; para comprar cuenta como 0: `falta = necesidad − max(0, stock)`.
- Ingrediente → ítem: primero un **vínculo** guardado (`charcuteria.vinculos.v1`, nombre normalizado → ítem), después el nombre igual sin importar mayúsculas, espacios ni tildes. El vínculo se crea al elaborar o al comprar desde Compras.

### Lotes por estado

- `charcuteria.lotes.v2`: cada lote tiene **su propia copia** de la receta, con estado **En preparación → En proceso → Terminado**, o **Cancelado**.
- **En preparación**: se edita todo. Compras suma solo estos lotes.
- **Elaborar** (pasa a En proceso): una hoja muestra cada ingrediente con su ítem, la cantidad real (editable) y lo que hay. Si no alcanza, pregunta «¿Lo compraste y no lo cargaste?» y carga esa compra; si se destilda, descuenta lo que hay y anota el faltante. Se registra un **uso** por ítem con el lote y el costo del momento.
- **En proceso**: la receta queda bloqueada; se editan merma, procesos y notas. **Deshacer elaboración** anula los usos (las compras cargadas quedan) y vuelve a preparación.
- **Terminar** pide el peso final real (si no, usa el esperado). **Cancelar** en proceso no devuelve lo usado.
- El recetario sigue siendo una plantilla: editar una receta no toca los lotes ya iniciados. «Guardar en recetario» actualiza la original (con confirmación) o crea otra. Los kg no cuentan como cambio de receta.

### Pestañas

Cuatro: **Lotes · Compras · Stock · Recetario**. Receta, Curado y Procesos pasan a ser sub-pestañas **dentro de cada lote**, con una cabecera que muestra estado, días y las acciones que corresponden.

### Respaldo

- **Datos → Guardar respaldo**: un `.json` con todas las claves `charcuteria.*`. En el APK abre el selector del sistema (teléfono o Drive); en la web se descarga.
- **Planillas CSV** de movimientos y lotes (`;`, coma decimal, BOM) para Excel o Sheets; son para mirar, no para restaurar.
- **Importar** reemplaza todo después de confirmar; lo anterior queda como «respaldo previo» y se puede volver.
- Aviso en Lotes si nunca se respaldó o pasaron 7 días o más.

### Migración

Una sola vez (`charcuteria.migracion.v2`): cada ítem v1 pasa con un movimiento de **saldo inicial** (los negativos quedan marcados **REVISAR**); el historial de lotes terminados pasa como **Terminado**; el lote abierto de la 1.0.9 pasa a **En preparación**; las recetas en proceso de la 1.0.8 (que la 1.0.9 ya no mostraba) pasan como **Canceladas**, para no sumar a Compras. El tipo de los lotes viejos se adivina por el recetario o el nombre. Las claves viejas no se borran; las compras viejas se ven en Stock, solo lectura.

## Consecuencias

- El stock refleja lo que hay hoy, y cada número se puede rastrear hasta sus movimientos.
- Un lote que tarda 40 días en curarse ya no deja el stock inflado mientras tanto.
- El costo del lote se congela al elaborar, con los precios de ese día.
- Los datos crecen con el uso (un movimiento por ítem por lote); para una app personal es poco.
- La sesión ya no guarda la receta: solo la vista y el lote abierto.
- Android: el WebView ahora tiene `WebChromeClient` (para que `confirm()` y `prompt()` se vean), un puente para guardar/abrir archivos y el botón Atrás lo maneja primero la app.

## Alternativas consideradas

- **Descontar al terminar** (1.0.9): deja el stock mal durante todo el curado.
- **Mantener cantidad y promedio en el ítem**: más simple, pero no deja rastro ni permite corregir un error sin perder la historia.
- **FIFO por lote de compra**: más exacto para costos, demasiado para el uso real.
- **Bloquear el stock negativo**: obliga a cargar la compra antes de elaborar; se prefirió preguntar en el momento.
- **Exportar solo CSV**: no alcanza para restaurar; se dejan los dos formatos.
