# ADR 0012 — Procesos por receta

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

Cada producto tiene un proceso distinto: mezclar, escaldar a 80 °C hasta 78 °C internos, ahumar, fermentar, secar. El dato no entra en la tabla de ingredientes y el usuario quiere tenerlo a mano y editable.

## Decisión

- Agregar una pestaña **Procesos** con los pasos de la receta activa.
- Cada paso es texto libre, numerado; se puede agregar, editar, borrar y reordenar (↑/↓).
- Las recetas base traen procesos por defecto; los cambios se guardan con la receta (override del preset o receta guardada).
- La pestaña muestra el nombre de la receta activa.

## Consecuencias

- El proceso queda documentado junto a los números.
- Es texto libre: no valida temperaturas ni tiempos.
- Los pasos se guardan en la sesión y en la receta; cambiar de receta cambia el proceso.

## Alternativas consideradas

- **Un campo de notas único:** más simple, pero no permite ordenar ni marcar pasos.
- **Pasos estructurados (temperatura/tiempo):** más trabajo y el usuario los describe en texto.
