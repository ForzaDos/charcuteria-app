# ADR 0014 — Compras y costos por ingrediente

- **Estado:** aceptada, ampliada por [0015](0015-stock-y-lotes.md)
- **Fecha:** 2026-11-02

## Contexto

El costo era una estimación manual con dos campos ($/kg de carne y $/kg de otros). El usuario necesita una lista de compras real: qué falta, qué ya compró, cuánto sale cada ingrediente y el costo total del lote con todos los ingredientes.

## Decisión

- Agregar la pestaña **Compras** con un ítem por ingrediente de la receta activa, en kg/g (o metros para la tripa).
- Cada ítem tiene precio por kg (o por metro), subtotal y casilla de **comprado**.
- La lista se divide en **Por comprar** y **Comprado**; el botón **Reiniciar compras** limpia las casillas.
- Los precios se guardan por nombre de ingrediente en `charcuteria.precios.v1` y el precio de la tripa en `charcuteria.tripa.v1`; las casillas, en `charcuteria.comprados.v1`.
- `compute` calcula el costo con los gramos reales: ingredientes + cura + sal de salmuera + tripa. Si no hay precios, mantiene el cálculo manual viejo como respaldo.
- El resumen muestra total del lote, costo por kg fresco y por kg final; la tarjeta de costos de Curado usa el mismo cálculo.

## Consecuencias

- El costo refleja la receta y la escala de kg, no un promedio manual.
- Los precios son globales por ingrediente: cambiar un precio afecta a todas las recetas.
- Se carga precio por kg/metro; si el usuario compra un paquete, tiene que convertir el precio (pendiente: precio por paquete con rendimiento).
- El tildado es global por nombre; un ingrediente comprado sigue tildado en otra receta hasta reiniciar.
- No incluye mano de obra, energía ni packaging distinto de la tripa.

## Alternativas consideradas

- **Mantener el costo manual:** rápido, pero no dice qué comprar ni cuánto sale cada cosa.
- **Planilla aparte:** duplica datos y no se actualiza con la receta.
- **Precio por paquete:** más realista, pero requiere peso del paquete y rendimiento; queda para una próxima iteración.
