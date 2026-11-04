# ADR 0004 — Toolchain manual y actualización en un comando

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

No hay Android Studio ni Gradle instalados y el APK es un wrapper simple. Actualizar a mano (compilar, firmar, instalar) es lento y propenso a errores.

## Decisión

- Compilar con un toolchain portable: JDK 17 + Android SDK build-tools 34 (`aapt2`, `d8`, `zipalign`, `apksigner`), sin Gradle.
- La versión vive en `AndroidManifest.xml`; `build.ps1` la lee y la pasa a `aapt2 link`.
- `actualizar.ps1` sube `versionCode`/`versionName`, compila, firma, instala por ADB y abre la app. Si no hay USB o MIUI bloquea, deja el APK en `dist/` y muestra la URL para actualizar desde Chrome.

## Consecuencias

- Actualizar tarda segundos y no requiere IDE.
- Depende del toolchain local (`CHARCUTERIA_TOOLS`) y de ADB.
- MIUI puede bloquear la instalación por ADB; el fallback es el navegador o el release.
- No hay builds reproducibles en otra máquina sin copiar el toolchain.

## Alternativas consideradas

- **Gradle / Android Studio:** estándar, pero pesado para un WebView.
- **PWA:** actualización instantánea, pero depende de hosting.
- **Build en la nube:** más infraestructura que la necesaria.
