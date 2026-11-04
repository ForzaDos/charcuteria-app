# ADR 0006 — Persistencia local en el WebView

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

La app no tiene backend y tiene que recordar la receta en curso, las recetas guardadas y los lotes entre aperturas.

## Decisión

- Usar `localStorage` del WebView, con claves versionadas:
  - `charcuteria.sesion.v3`: tipo, kg, merma, calibre, cura, ingredientes, salmuera, costos y vista activa.
  - `charcuteria.recetas.v1`: recetas guardadas por el usuario.
  - `charcuteria.lotes.v1`: historial de lotes.
- La sesión se guarda con debounce; al cargar se normaliza la composición.
- No hay sincronización ni servidor.

## Consecuencias

- Todo queda en el teléfono; funciona offline.
- Borrar datos de la app o desinstalarla borra las recetas.
- No se puede pasar la información a otro teléfono sin exportar/importar (pendiente).
- Cambiar de origen (por ejemplo, de `file://` a otro esquema) cambiaría el almacenamiento.

## Alternativas consideradas

- **SQLite/Room:** más robusto, pero requiere código nativo y migraciones.
- **Archivos JSON en el almacenamiento:** más portable, pero más manejo de permisos.
- **Backend/sync:** contradice el objetivo offline.
