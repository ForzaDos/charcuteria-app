# ADR 0020 — Lote actual único y recetario editable

- **Estado:** reemplazada por [0021](0021-libro-de-stock-y-lotes-por-estado.md) en 1.1.0
- **Fecha:** 03/11/2026

## Contexto

La app había quedado con una “receta activa” que era una copia del recetario y, al mismo tiempo, con varias recetas en proceso. El usuario aclaró el modelo:

- El **recetario** es el catálogo de recetas guardadas (plantillas).
- La primera pestaña es un **lote actual**, que se inicia desde una receta del recetario o desde cero.
- El lote es lo dinámico; el recetario es lo estable.
- Hay **un solo lote activo**.

## Decisión

- **Recetario**: recetas con categoría, base, notas y datos completos. Solo se editan desde el Recetario con **Editar receta**; editar una receta no toca el lote en curso.
- **Lote actual**: copia de trabajo con `loteId`, fecha y receta de origen. Se inicia con **Iniciar lote** o **Nuevo lote**.
- **Un solo lote**: para iniciar otro hay que **Terminar** o **Cancelar** el actual. El terminado descuenta stock y pasa al historial; el cancelado no toca stock.
- **Descartar** vuelve a la **receta original actual** del recetario que se usó como base. Si la original fue borrada, no hay restauración.
- **Guardar en recetario** desde el lote:
  - **Actualizar original**, con aviso y confirmación: cambia la receta base para futuros lotes.
  - **Guardar como nueva**: crea otra receta sin tocar la original.
- **Compras** trabaja con el lote actual. **Stock** es general y solo se descuenta al Terminar.
- La primera pestaña se llama **Lote**; sin lote muestra **Iniciar lote / Nuevo lote**.
- Se elimina la lista de varias “recetas en proceso”.

## Consecuencias

- Editar el lote no modifica el recetario.
- Editar el recetario no modifica el lote en curso; los próximos lotes usan la versión nueva.
- Actualizar la original desde el lote es la excepción explícita, protegida por confirmación.
- Compras y stock dejan de sumar varios lotes; hay uno activo y un historial.
- El recetario se ordena por Enteros, Fermentados, Cocidos y Salmueras.
- Bondiola y Panceta incluyen su componente cárnico para que el grupo Cárnicos no quede vacío.

## Alternativas consideradas

- **Varios lotes en proceso**: se descartó porque el usuario pidió un solo lote activo.
- **Receta activa como puntero sin copia**: el usuario pidió que el lote sea una copia dinámica.
- **Guardar desde el lote solo como nueva**: se agregó “Actualizar original” con aviso, a pedido del usuario.
- **Compras sumando varios lotes**: se descartó junto con los varios lotes.
