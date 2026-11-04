# ADR 0010 — Firma del APK y manejo del keystore

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

El APK se instala fuera de Play Store. Android exige que las actualizaciones estén firmadas con la misma clave que la versión instalada.

## Decisión

- Firmar con una clave **autofirmada** RSA 2048, alias `charcuteria`, validez 10.000 días.
- El keystore (`charcuteria.jks`) vive solo en la máquina de desarrollo; **no** se versiona.
- La contraseña está en los scripts locales de build; el repo no incluye la clave.
- Mantener el mismo keystore para todas las actualizaciones de `ar.charcuteria.app`.

## Consecuencias

- Play Protect puede advertir que la app no es conocida; es esperable.
- Si se pierde el keystore, no se puede actualizar la app instalada: hay que desinstalar y reinstalar (se pierden los datos locales).
- El repo se puede clonar y compilar, pero un APK nuevo firmado con otra clave no actualiza el existente.

## Alternativas consideradas

- **Play App Signing:** requiere publicar en Play.
- **Clave de debug:** no sirve para distribuir ni para actualizar de forma estable.
- **Incluir el keystore en el repo privado:** simplifica el backup, pero expone la clave de firma; se prefiere un backup externo.
