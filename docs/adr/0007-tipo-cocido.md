# ADR 0007 — Tipo “cocido” para la Leberwurst

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

La Leberwurst es un embutido cocido, no fermentado ni curado en seco. Reutilizar “fermentado” o “entero” mostraría pH, aw, días de secado y tripa que no corresponden.

## Decisión

- Agregar el tipo `cocido` con un botón propio en “Tipo de preparación”.
- Para `cocido`: sin pH/aw objetivo, sin días de curado y sin cálculo de tripa; sí merma por cocción, rendimiento y costos.
- Cura #1 (nitrito) por defecto; si se elige cura #2, avisar que en un cocido conviene #1. Si no hay cura, avisar por riesgo si se guarda.
- Leberwurst: base 5 kg (cerdo magro 25 %, hígado 40 %, tocino 35 %), sal 2 %, cura #1 0,25 %, especias, cebolla, cognac y hongos; merma por defecto 8 % (editable, no viene del Excel).

## Consecuencias

- La receta se representa sin controles de fermentación.
- La tarjeta de pH/aw y el stat “Días” todavía se muestran con “—” en cocido; la auditoría pidió ocultarlos.
- El tipo `cocido` agrega una cuarta opción al selector y obliga a revisar la UI responsive.

## Alternativas consideradas

- **Usar `fermentado`:** muestra pH/aw/días y cura #2, engañoso.
- **No incluir Leberwurst:** el Excel la tiene y el usuario la produce.
