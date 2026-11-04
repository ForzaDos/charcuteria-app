# ADR 0008 — Distribución por GitHub privado y releases

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

Hay que respaldar el código y el APK probado, y poder descargar una versión estable sin depender de la PC encendida.

## Decisión

- Repo **privado**: <https://github.com/ForzaDos/charcuteria-app>.
- El repo guarda `app/` (HTML y tests), `android/` (wrapper y build), `dist/Charcuteria.apk` y la documentación.
- Cada versión probada se publica como **release** con el APK adjunto (por ejemplo `v1.4`).
- El keystore **no** se sube; queda solo en la máquina que firma.
- El repo es un snapshot: la actualización local del teléfono no se sincroniza sola.

## Consecuencias

- Hay respaldo y una URL de descarga estable por versión.
- Para bajar el APK desde el teléfono hay que estar logueado en GitHub (repo privado) o usar la red local.
- Publicar una actualización requiere copiar los archivos al repo, commit, push y release (candidato a un `publicar.bat`).

## Alternativas consideradas

- **Repo público:** más simple para compartir, pero expone recetas y la configuración.
- **Play Store:** revisión, firma y cuenta; innecesario para uso personal.
- **Solo servidor local:** depende de la PC encendida.
