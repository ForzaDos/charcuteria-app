# Plan — Charcutería

## Estado actual (03/11/2026)

- Versión **1.1.1** (versionCode 13): sobre la 1.1.0 (libro de movimientos, lotes por estado con Elaborar, pestañas Lotes · Compras · Stock · Recetario, respaldo) suma **Cargar existencia** con costo, alta de ítems con 0, Producto/Insumo por lo que se come, filtros y avisos de faltantes, totales y subtotales, borrado en bloque e importación más robusta. APK compilado con la clave original; el usuario lo está probando en el Xiaomi.
- 4 recetas del Excel: Salame Tandil (8 kg), Bondiola Casera (1,2 kg), Panceta Curada (1 kg) y Leberwurst (5 kg, cocido).
- Repo privado: <https://github.com/ForzaDos/charcuteria-app>.
- Release: <https://github.com/ForzaDos/charcuteria-app/releases/tag/v1.0.9>.
- Numeración: **1.1.1** actual; las releases 1.4–1.7 son builds anteriores. Historial en [CHANGELOG.md](CHANGELOG.md).
- Auditoría con `deepseek-v4-pro`: sin errores de cálculo ni de datos; quedaron observaciones de UX y tests.

## Objetivo

Calculadora de charcutería offline para el teléfono, sin servidor ni dependencia de la PC. Prioriza que se entienda en la cocina, que los números sean trazables y que actualizar sea rápido.

## Roadmap

| Prioridad | Tarea | Estado | Notas |
|---|---|---|---|
| P0 | Reemplazar el autoajuste silencioso por una acción **Normalizar** explícita, o justificar el autoajuste con un aviso claro | Pendiente | Con el tocino fijo, las carnes se reparten el resto; falta definir la UX |
| P0 | Unificar la regla de normalización al editar, borrar, cargar receta y cargar sesión | Pendiente | Al editar se preserva el valor; al cargar/borrar se reescala el grupo |
| P0 | Tests de gramos a la base real de bondiola, panceta y Leberwurst | Pendiente | Hoy `estadoDe` fuerza kg=1 |
| P0 | Tests de procesos y de overrides del recetario | Pendiente | Nuevo en 1.5 |
| P0 | Tests de stock, lotes y descuento | Hecho | 1.1.0; `app/test-logica.mjs` |
| P0 | Ocultar pH/aw/días en tipo cocido (no dejar filas con “—”) | Pendiente | Menor |
| P0 | Unificar el mínimo de kg (compute 0,001 / sesión 0,05 / input 0,1) | Pendiente | Menor |
| P1 | Exportar/importar recetas y lotes (JSON o texto) | Hecho | 1.1.0; respaldo JSON completo + CSV; importar con respaldo previo |
| P1 | Stock como libro de movimientos | Hecho | 1.1.0; restar, corregir, anular, archivar; sin mínimo |
| P1 | Varios lotes por estado y Elaborar | Hecho | 1.1.0; descuenta el día que se usa; deshacer elaboración |
| P1 | Cargar existencia con costo | Hecho | 1.1.1; precio por unidad o costo total; «Guardar y cargar otro»; alta con 0 |
| P1 | Filtros de stock y avisos de faltantes | Hecho | 1.1.1; falta para lotes, sin stock, productos, insumos, cárnicos, aditivos, especias, tripas; aviso por lote |
| P1 | Totales y subtotales de stock y de lo que falta comprar | Hecho | 1.1.1 |
| P1 | Borrar todo el stock / todos los movimientos | Hecho | 1.1.1; dos avisos + respaldo previo |
| P1 | Faltantes por lote considerando lo que piden los otros lotes | Pendiente | Hoy cada lote mira el stock solo; Stock y Compras sí suman todos |
| P1 | Vincular a mano un ingrediente con un ítem del stock | Pendiente | Hoy el vínculo se crea al elaborar o comprar; «Sal fina / entrefina» no encuentra «Sal entrefina» |
| P1 | Más de una vuelta atrás en el respaldo previo | Pendiente | Hoy borrar dos veces seguidas pisa el respaldo previo |
| P1 | Agregar o convertir un ingrediente en cárnico/grasa desde la UI | Hecho | Selector de tipo en el alta |
| P1 | Compras y costos por ingrediente | Hecho | Precio por kg/m, subtotales y total |
| P1 | Lotes en curso y stock con descuento | Hecho | La lista suma varios lotes; el stock se descuenta al terminar |
| P1 | Web local con las mismas funciones | Hecho | Misma app servida por `servir.bat`; datos por navegador |
| P1 | Imprimir/PDF de receta, procesos, compras y stock | Hecho | Botones por sector + hoja de checkboxes; PDF por diálogo del sistema; ver [plan](docs/plan-impresion-pdf.md) |
| P1 | Versión en header y Acerca de (autor) | Hecho | 1.0.9; launcher “Charcutería” |
| P1 | Peso total real de la mezcla (incluye aditivos) | Hecho | 1.0.9; base cárnica calculada; 8 kg = 8,00 kg |
| P1 | Contexto activo vs. general | Hecho | 1.0.9; Receta/Curado/Procesos activos; Stock/Recetario generales |
| P1 | Sal de cura editable, sin “fijo” | Hecho | 1.0.9; se edita en Aditivos y en Curado |
| P1 | Nueva receta con categorías, base y notas | Hecho | 1.0.9; Salazones enteros / Fermentados / Cocidos / Salmueras |
| P1 | Un solo lote activo | Reemplazado | 1.1.0 vuelve a varios lotes, ahora por estado |
| P1 | Guardar en recetario con aviso | Hecho | Actualizar original (confirmación) o Guardar como nueva |
| P1 | Editar receta solo desde el recetario | Hecho | Acción Editar receta; pausa el lote y vuelve al terminar |
| P1 | Descartar cambios del lote | Hecho | Vuelve a la receta original actual del recetario |
| P1 | Recetario simple por categorías | Hecho | Enteros / Fermentados / Cocidos / Salmueras; Iniciar lote + menú ⋯; badge base |
| P1 | Cárnicos en Bondiola y Panceta | Hecho | Componente “Bondiola de cerdo” / “Panceta de cerdo”; repara data vieja |
| P1 | Migración de presets y guardadas al recetario | Hecho | `charcuteria.recetario.v1`; claves viejas conservadas |
| P1 | Ingredientes agrupados y costos bajo la receta | Hecho | Cárnicos/proteínas, Grasa, Aditivos; costos de materiales |
| P1 | Stock por ítems con unidades, promedio y mínimo | Reemplazado | 1.1.0 sin mínimo; 1.1.1 Producto = lo que se come, Insumo = lo que se consume |
| P1 | Compras/Stock segmentado y varias recetas en proceso | Hecho | Lote asociado opcional; stock negativo con aviso SIN STOCK |
| P1 | Precio por paquete/rendimiento (ej.: bolsa de 1 kg) | Pendiente | Hoy se carga precio por unidad de medida; sin flete |
| P1 | Igualar los nombres de ingredientes a los del Excel | Pendiente | Cosmético, trazabilidad |
| P1 | Aclarar el rótulo de nitrito (156 ppm vs umbral rojo) | Pendiente | Menor |
| P2 | Backend para compartir stock/recetas entre web y APK | Idea | Hoy cada navegador/teléfono tiene sus datos |
| P2 | Ficha del lote en PDF / imprimible | Idea | |
| P2 | Integración con la balanza del secadero | Idea | Requiere red/servidor local |
| P3 | Publicación pública o Play Store | No por ahora | El repo es privado |

## Decisiones abiertas

1. **Normalización de la composición.** El tocino se fija y las carnes se reparten el resto. Falta elegir entre: (a) autoajustar y avisar qué cambió, (b) botón “Normalizar” explícito, (c) otra regla. Ver [ADR 0005](docs/adr/0005-composicion-al-100.md) y [ADR 0011](docs/adr/0011-tocino-fijo.md).
2. **Keystore.** No está en el repo. Si se pierde, no se pueden instalar actualizaciones encima de la app existente. Definir backup externo. Se compila con `android/compilar-con-clave.ps1`, que la copia y la borra.
3. **Distribución.** El repo es privado y el APK se instala fuera de Play Store. Si se publica, revisar firma y política de Play Protect.
4. **Precios.** Se cargan por unidad de medida (kg/g/L/m/u). Si se compra por paquete/rollo, falta convertir el precio del paquete a la unidad base; no hay flete por ahora. Ver [ADR 0017](docs/adr/0017-stock-por-items.md).
5. **Datos compartidos.** La web local y el APK guardan stock y recetas por separado (`localStorage` de cada uno). Para compartirlos hace falta un backend; definir si se quiere. Ver [ADR 0015](docs/adr/0015-stock-y-lotes.md).

## Criterios de aceptación

- Las 4 recetas coinciden con el Excel en base, porcentajes y gramos.
- El tocino se puede fijar (20 %, 30 %, etc.) y las carnes suman el resto hasta 100 %.
- Todas las recetas base aparecen en el recetario, se pueden editar y restablecer.
- Cada receta tiene sus procesos editables.
- Los ingredientes se ven agrupados en Cárnicos/proteínas, Grasa y Aditivos, con costos de materiales debajo de la receta.
- El stock es por ítems con unidad y precio promedio, sin mínimo.
- Cada compra, uso, pérdida o corrección queda como movimiento con fecha, cantidad y lote; el stock y el promedio salen de ahí.
- El stock se descuenta al Elaborar; Compras suma los lotes en preparación y cuenta el negativo como 0.
- Hay respaldo completo (JSON) que se puede guardar en Drive e importar.
- El costo del lote, por kg fresco y por kg final sale de los precios cargados.
- El APK compila, firma, instala y abre en el Redmi.
- Los tests de cálculo y de estructura pasan.
- Actualizar es un solo comando (`android/actualizar.bat`) o una descarga desde el release.
- Se puede cargar lo que ya hay con su costo, filtrar el stock y ver qué falta y cuánto cuesta para los lotes en preparación.

## Bitácora

- **1.0** — app web + APK WebView; salame/chorizo/longaniza/bondiola/panceta/salmueras.
- **1.2** — recetas del Excel; Leberwurst como tipo cocido; componentes de carne.
- **1.3** — normalización de la composición al 100 %.
- **1.4** — build reproducible con versión desde el manifest; actualización en un comando; repo y release.
- **1.5** — tocino fijo independiente de las carnes; alta de cárnicos/grasas/aditivos; pestaña Procesos; recetario con todas las recetas base editables y restablecibles.
- **1.6** — pestaña Compras con precios por ingrediente, subtotales, pendientes/comprados y costos reales del lote.
- **1.7** — días de salazón seca totales (salazón + secado); varios lotes en curso; stock con cantidades/precios, descuento de lo usado y costos separados entre stock y faltante; web local con las mismas funciones.
- **1.0.7** — impresión/PDF de receta, procesos, compras y stock; botones por sector con hoja de selección; web con `window.print()` y APK con `PrintManager` + WebView oculto.
- **1.0.8** — versión en header/Acerca de; ingredientes agrupados y costos de materiales bajo la receta; stock por ítems con unidades, promedio ponderado, historial y aviso de stock negativo; segmento Compras/Stock y compras asociadas a recetas.
- **1.0.9** — el kg es el total de la mezcla (incluye aditivos), con base cárnica calculada; sal de cura editable sin etiqueta “fijo”; **un solo lote activo** que se inicia desde el recetario, se edita, se termina o se cancela; el recetario es plantilla y se edita solo ahí; guardar en recetario permite actualizar la original con aviso o guardar como nueva; Descartar vuelve a la receta original; lista por categorías; Bondiola y Panceta recuperan su cárnico.

- **1.1.0** — stock como libro de movimientos (compra, uso, pérdida, uso externo, corrección, anulación); varios lotes por estado con Elaborar, Deshacer, Terminar y Cancelar; pestañas Lotes · Compras · Stock · Recetario; respaldo JSON/CSV e importación; sin stock mínimo; botón Atrás de Android.
- **1.1.1** — Cargar existencia con costo (unidad o total); alta de ítems con 0; Producto = lo que se come e Insumo = lo que se consume (recategoriza una vez); filtros de stock y avisos de faltantes en Stock y en cada lote; total, subtotales y «falta comprar»; borrar todo el stock / los movimientos con respaldo previo; importar con ventana propia, BOM, aviso si Chrome recarga y opción de pegar.

## Referencias

- [README](README.md)
- [ADRs](docs/adr/)
- [Historial de versiones](CHANGELOG.md)
- [Plan de impresión/PDF](docs/plan-impresion-pdf.md)
