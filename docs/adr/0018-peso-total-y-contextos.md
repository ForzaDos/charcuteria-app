# ADR 0018 — Peso total de la mezcla y contexto activo/global

- **Estado:** aceptada e implementada en 1.0.9
- **Fecha:** 03/11/2026

## Contexto

La app trataba los kg como “base cárnica” y sumaba los aditivos aparte. Con 8 kg de base y 7,07 % de aditivos el total daba 8,56 kg, que no era lo que la receta decía. Además, las pantallas no distinguían qué era de la receta activa (peso, merma, procesos) y qué era general (stock, recetario, lotes).

## Decisión

- El campo de kg es el **total de la mezcla**: cárnicos + grasa + aditivos (incluida la sal de cura).
- La **base cárnica** se calcula:
  `base = total / (1 + (suma aditivos % + cura %) / 100)`.
  Los porcentajes de los ingredientes se aplican a esa base. Así, 8 kg dan 8,00 kg de mezcla y ≈7,47 kg de base en el Salame.
- Los gramos de carne se reducen en consecuencia; los porcentajes y el ppm se mantienen sobre la base cárnica (referencia de seguridad).
- **Contextos visibles**:
  - Receta, Curado (peso/merma) y Procesos: **receta activa**; no modifican el stock.
  - Compras: usa la receta activa o las recetas en proceso; el stock es general.
  - Stock y Recetario/lotes: **generales**.
- La **sal de cura** se muestra en Aditivos como fila editable; se saca la etiqueta “fijo”. La dosis también se edita en Curado y mantiene el control de ppm.

## Consecuencias

- El total que se muestra y el que se usa en costos, stock y merma es el kg cargado.
- El usuario ve una diferencia entre “total” y “base cárnica”; la UI la explica en la card de kg, en el resumen y en la impresión.
- Las recetas de corte entero (bondiola, panceta) también usan el total; la base cárnica es algo menor que el kg cargado.
- Los datos viejos se interpretan con la nueva regla; no se migran gramos históricos.

## Alternativas consideradas

- **Mantener base + aditivos aparte:** era el comportamiento que el usuario marcó como error.
- **Porcentajes sobre el total:** cambiaría las proporciones de la receta y los ppm; se prefiere conservar la base cárnica como referencia.
- **Dejar la cura como fila fija:** el usuario lo rechazó; ahora es editable.
