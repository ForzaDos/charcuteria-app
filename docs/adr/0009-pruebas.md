# ADR 0009 — Estrategia de pruebas

- **Estado:** aceptada, con cobertura incompleta
- **Fecha:** 2026-11-02

## Contexto

La app calcula dosis de cura y sal: un error silencioso es serio. Hay que verificar tanto la matemática como que la UI no rompa el estado.

## Decisión

- **Tests de cálculo puros** (`test-calculos.mjs`): extraen el bloque de cálculo del HTML y verifican sal, ppm, mezcla, merma, tripa, costos y casos borde.
- **Tests de estructura** (`test-dom.mjs`): IDs, selectores, referencias y ausencia de dependencias externas.
- **QA visual/funcional** con Edge headless por CDP a 390 px: recetas, tipos, normalización, capturas.
- **Auditoría independiente** con `deepseek-v4-pro` cuando el cambio toca cálculos, composición o seguridad.

## Consecuencias

- Se detectan errores de fórmula y de integración del DOM.
- No hay test E2E en el dispositivo: MIUI bloquea la inyección de toques (`INJECT_EVENTS`), así que la validación en el Redmi es manual.
- Faltan tests de las bases reales de bondiola, panceta y Leberwurst, y de la normalización.

## Alternativas consideradas

- **jsdom / happy-dom:** permitiría tests de render sin navegador; no está instalado.
- **Emulador Android:** pesado y no disponible.
- **Solo QA manual:** no escala.
