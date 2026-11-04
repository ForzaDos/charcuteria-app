# ADR 0019 — Recetario con copia activa y bases del usuario

- **Estado:** reemplazada por [0020](0020-lote-actual-unico.md)
- **Fecha:** 03/11/2026

## Contexto

El recetario anterior mezclaba tres cosas: recetas base en código, overrides silenciosos (`presets`) y copias guardadas (`guardadas`). La receta activa no tenía identidad estable y el botón “Guardar” siempre creaba otra copia. No existía “Nueva receta”, ni categorías, ni notas, ni una forma clara de elegir otra receta activa.

El usuario aclaró:
- Las recetas base son **suyas**, no de fábrica: se pueden editar, borrar y convertir.
- La receta activa **es una copia** de una receta del recetario; se puede cambiar.
- Después esa copia se puede **guardar en el recetario**, marcarla como **base** (a elección) y dejar **notas**.

## Decisión

- **Una colección `recetario`** con fichas completas: `id`, `nombre`, `tipo`, `base`, `notas`, `data`, `creado`, `modificado`.
- La **receta activa** es la copia de trabajo que vive en el estado; recuerda su `recetaId` de origen.
- **Guardar cambios** actualiza la ficha de origen. **Guardar como nueva** crea otra ficha. Ambos permiten cambiar nombre, categoría, base y notas.
- **Nueva receta** crea una ficha vacía con categoría (Salazones enteros, Fermentados, Cocidos, Salmueras), opción de base y notas; queda activa.
- Las **bases son del usuario**: no hay recetas de fábrica bloqueadas. Se pueden renombrar, duplicar, sacar de base y borrar.
- **Notas** visibles en el recetario y editables desde el guardado.
- **Estado `● Sin guardar`** y confirmación **Guardar / Descartar / Cancelar** al cambiar de receta con cambios pendientes. La copia activa se conserva en la sesión para no perder trabajo al recargar.
- **Descartar** vuelve a la versión guardada de la receta de origen. La lista del recetario se agrupa por **Enteros, Fermentados, Cocidos y Salmueras**, con acciones simples (`Abrir` + menú `⋯`).
- Los cortes enteros (Bondiola, Panceta) incluyen su componente cárnico para que el grupo Cárnicos/proteínas no quede vacío; la data vieja se repara al abrir.
- **Selector**: chips con todas las recetas en Receta, lista del Recetario con “Abrir” y botón “Cambiar” en el contexto. No se auto-selecciona otra receta al borrar la activa.
- **Migración** desde `RECETAS`, `presets` y `guardadas` a `charcuteria.recetario.v1`; no se borran las claves viejas.
- El motor de cálculo no cambia por esta decisión.

## Consecuencias

- La copia activa se puede editar sin tocar el recetario hasta guardar.
- Guardar deja de crear copias involuntarias; para copiar existe “Guardar como nueva” o “Duplicar”.
- Las bases de ejemplo (Salame, Bondiola, etc.) son del usuario y se pueden modificar o borrar.
- Los datos viejos se migran una vez; la app sigue funcionando offline.
- Un cambio de receta activa con cambios pendientes obliga a elegir; no hay autosave del contenido de la receta.

## Alternativas consideradas

- **Puntero directo a la receta (sin copia):** PRO lo recomendó, pero el usuario pidió explícitamente una copia de trabajo.
- **Bases incorporadas read-only:** el usuario aclaró que las bases son suyas.
- **Autosave del contenido:** genera dudas sobre qué quedó guardado; se prefiere guardado explícito y sesión recuperable.
