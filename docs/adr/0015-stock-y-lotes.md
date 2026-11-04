# ADR 0015 — Stock y lotes en curso

- **Estado:** ampliada por [0017](0017-stock-por-items.md) y reemplazada por [0021](0021-libro-de-stock-y-lotes-por-estado.md)
- **Fecha:** 2026-11-02

## Contexto

La lista de compras era de una sola receta (la que se estaba mirando) y no había inventario. El usuario necesita varias recetas en marcha, saber qué compró, restar lo que usa del stock y calcular costos con lo usado y lo que falta.

## Decisión

- **Lotes en curso**: una lista de recetas agregadas con sus kg, guardadas como foto (no cambian si después se edita la receta). La receta actual se agrega con un botón; se puede quitar o **descontar**.
- **Lista de compras agregada**: suma las necesidades de todos los lotes en curso. Si no hay lotes, usa la receta actual como respaldo.
- **Stock**: cantidades por ingrediente (kg) y de tripa (m), más el precio por unidad. Se carga con el formulario de stock o editando la cantidad. El stock es global y persiste en `localStorage`.
- **Falta** = necesidad − stock (nunca negativo). La lista muestra necesidad, stock y faltante.
- **Costos**: costo total de la lista, costo ya cubierto por stock y costo a comprar. El stock valorizado se muestra aparte.
- **Descontar**: al terminar un lote, resta sus ingredientes del stock (con tope en 0), guarda el lote en el historial (`charcuteria.lotes.v1`) y lo saca de los lotes en curso.
- La web local usa el mismo HTML y las mismas funciones; sus datos quedan en el navegador.

## Consecuencias

- Se pueden tener varias recetas en una sola lista y comprar contra el stock real.
- El costo distingue lo que ya se tenía de lo que hay que comprar.
- El stock no guarda historial de compras ni costo promedio: usa el precio actual por ingrediente.
- El descuento no permite stock negativo: si falta, se descuenta hasta 0 y el faltante queda visible antes de descontar.
- La web y el APK no comparten datos; para eso hace falta un backend.

## Alternativas consideradas

- **Una receta por vez:** era lo anterior; no sirve para varios lotes.
- **Stock manual en una planilla:** se desactualiza y no se conecta con la receta.
- **Backend compartido ahora:** resuelve web/APK, pero es otra arquitectura; queda como paso siguiente.
