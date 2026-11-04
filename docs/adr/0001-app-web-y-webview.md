# ADR 0001 — App web de un solo archivo dentro de un WebView

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

La calculadora se usa en la cocina, con las manos ocupadas. Tiene que andar sin PC, sin servidor y sin internet, y ser fácil de copiar y actualizar.

## Decisión

Escribir la app como un único `index.html` (HTML + CSS + JS, sin frameworks ni dependencias) y empaquetarla en un APK Android con un WebView que carga `assets/index.html`. Los datos se guardan en `localStorage`. No hay backend.

## Consecuencias

- Funciona offline y no depende de la PC.
- El APK pesa ~136 KB y el HTML ~60 KB.
- No hay build de frontend ni `node_modules`.
- Las actualizaciones requieren un APK nuevo (ver [ADR 0004](0004-toolchain-y-actualizacion.md)).
- Los datos quedan en el dispositivo y no se sincronizan entre teléfonos.

## Alternativas consideradas

- **PWA hosteada:** actualización instantánea, pero depende de un host/internet.
- **App nativa (Kotlin):** mejor integración, mucho más trabajo para una calculadora.
- **Excel:** sin validaciones ni buena experiencia en el teléfono.
