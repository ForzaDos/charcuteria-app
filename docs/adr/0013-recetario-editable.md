# ADR 0013 — Recetario editable con overrides

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

Las recetas base estaban solo en los chips de la pestaña Receta; el Recetario mostraba únicamente las copias guardadas. El usuario quiere ver todas las recetas (Salame Tandil, Bondiola, Panceta, Leberwurst, salmueras) y poder editarlas sin duplicarlas a mano.

## Decisión

- El Recetario lista **todas** las recetas base y las copias guardadas.
- Editar una receta base guarda un **override** en `charcuteria.presets.v1`, sin tocar el código.
- El override guarda composición, cura, merma, calibre y procesos; **no** guarda kg, costos ni la vista.
- La lista marca la receta como **editada** y ofrece **Restablecer**, que borra el override y vuelve a la base.
- Las copias guardadas por el usuario quedan en `charcuteria.recetas.v1`; al cargarlas se limpia `recetaId` para que no generen overrides.
- El badge se refresca al guardar el override.

## Consecuencias

- Se puede personalizar cualquier receta base sin duplicarla.
- La receta original sigue disponible con Restablecer.
- Cambiar solo el kg o los costos no marca la receta como editada.
- La nota descriptiva del preset puede quedar desactualizada si cambia la composición.

## Alternativas consideradas

- **Solo lectura + guardar copia:** obliga a duplicar y a elegir nombres.
- **Editar el código:** requiere recompilar el APK por cada cambio.
