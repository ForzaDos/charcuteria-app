# ADR 0017 — Stock por ítems, unidades y promedio ponderado

- **Estado:** implementada en 1.0.8; el modelo de stock lo reemplaza [0021](0021-libro-de-stock-y-lotes-por-estado.md) (libro de movimientos, sin mínimo)
- **Fecha:** 02/11/2026

## Contexto

El stock anterior era un mapa `nombre → kg` con precios sueltos por kg. No distinguía insumos de productos, no manejaba unidades (g, L, m, u), no promediaba compras, no tenía mínimo ni historial, y el formulario fijaba el precio en vez de promediar. Para la red, la tripa y los aditivos eso no alcanza.

## Decisión

- **Ítems de stock** con: nombre, categoría (insumo/producto), unidad base (kg/g/L/m/u), cantidad, precio promedio por unidad, stock mínimo, proveedor y notas.
- **Compra** suma cantidad y recalcula el **promedio ponderado móvil**:
  `nuevo = (cantidad actual × promedio + compra × precio) / (cantidad actual + compra)`. Si no había stock positivo, el promedio pasa a ser el precio de la compra.
- La compra guarda un **registro en el historial** con fecha, ítem, cantidad, unidad, precio y lote asociado opcional.
- **Unidades por tipo**: cárnicos/grasa en kg, aditivos en g, líquidos en L, tripa/red en m (o u). El precio se muestra por unidad de medida.
- **Stock negativo permitido**: al terminar una receta se descuenta; si no alcanza, el ítem queda negativo y se destaca con **SIN STOCK** y botón **Comprar** en la lista.
- **El stock negativo cuenta como 0 para comprar** (decidido el 02/11/2026): lo que falta es solo lo necesario para las recetas en proceso, `falta = necesidad − max(0, stock)`. La deuda no se suma a la próxima compra, porque casi siempre es algo comprado y no cargado.
- **Compras/Stock** en un segmento dentro de Compras. Las recetas en proceso siguen siendo snapshots y se pueden tener varias; la compra puede asociarse a un lote solo como trazabilidad.
- **Migración no destructiva** de `stock`, `precios`, `stockTripa` y `lotesActivos` anteriores a `stockItems.v1`; las claves viejas quedan para no perder datos.
- La web usa el mismo modelo; sus datos siguen separados del APK.

## Consecuencias

- Se puede cargar una compra de red de 100 m a $80/m y otra de 100 m a $90/m; el promedio queda $85/m.
- Un ítem con stock 0 y precio conocido conserva el precio de referencia para costos.
- El stock negativo no se bloquea: genera un aviso de compra visible.
- Los precios por g son chicos; se muestran con hasta 4 decimales.
- No hay movimientos append-only ni FIFO/LIFO: la cantidad y el promedio se actualizan en el ítem y el historial guarda las compras.
- No hay flete ni compra por paquete con rendimiento; se carga la cantidad en unidad base.

## Alternativas consideradas

- **Seguir con el mapa nombre→kg:** no permite unidades, productos ni promedio.
- **Libro de movimientos append-only:** más auditable, pero más complejo para una app personal; el historial de compras cubre la trazabilidad pedida.
- **Bloquear stock negativo:** obliga a cargar la compra antes de terminar; el usuario pidió permitirlo con aviso.
- **Stock separado por lote:** duplica cuentas; se prefiere stock general con `loteId` de trazabilidad.
