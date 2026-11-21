# CLAUDE.md — Charcutería

## Qué es
Calculadora de charcutería offline para el teléfono: recetas (fermentados, enteros, cocidos, salmueras), lotes por estado,
stock como libro de movimientos, compras y respaldo. Es **un solo archivo** (`app/index.html`, ES5, sin dependencias externas)
que corre en la web y dentro de un APK Android (WebView). Repo **público** (MIT): <https://github.com/ForzaDos/charcuteria-app>, arrancó de cero el 04/11/2026 con un solo commit
para no publicar el historial viejo. El historial anterior (con releases 1.4–1.0.9) quedó en el repo **privado**
`ForzaDos/charcuteria-app-historial`: no hacerlo público ni copiar de ahí commits, tags ni APK viejos (tienen datos personales).
**Versión actual: 1.2.2 (versionCode 15)**, 21/11/2026 (sin avisos de sal en cocido y fresco, curado en bolsa por espesor). Historial en `CHANGELOG.md`, roadmap en `PLAN.md`, decisiones en `docs/adr/`.

## Reglas
- Identidad pública: **ForzaDos** (`ForzaDos <ForzaDos@users.noreply.github.com>`). Nunca apellido ni correo real.
  Commits sin `Co-Authored-By`. Responder en castellano rioplatense.
- **La clave `charcuteria.jks` nunca va al repo** (`.gitignore` la cubre). El original está en
  una ruta local que se pasa con la variable de entorno `CHARCUTERIA_KEYSTORE` (huella SHA-256 `f9b36323…6b46d0f9`).
  Si se firma con otra clave, el teléfono no deja actualizar encima y desinstalar **borra los datos**.
- No modificar la carpeta del harness de DeepSeek (está fuera del repo; la ruta no se escribe acá).
- Versión en 4 lugares de `app/index.html` (`<title>`, `#app-version`, `#about-version`, `APP_VERSION`) y en
  `android/AndroidManifest.xml` (`versionCode`/`versionName`). Si el usuario pide no cambiar la versión, se recompila con la misma.

## Probar
- `node app/test-logica.mjs` (corre el script real con DOM y `localStorage` falsos: migración, libro de movimientos,
  existencias, lotes, compras, filtros, borrado en bloque, respaldo, impresión), `node app/test-dom.mjs`, `node app/test-calculos.mjs`.
  Los tres tienen que terminar en `TODO OK`.
- Web: `launch.json` del workspace tiene `charcuteria-web` (http.server 8098 sobre `app/`). Probar a 390 px de ancho.
- Para el teléfono por Wi-Fi: `python -m http.server <puerto> --bind 0.0.0.0 --directory app` (o `dist` para el APK).
  El **8099 lo usa un servidor de DeepSeek** con la 1.0.9 vieja: no apuntar al usuario ahí. La web guarda sus datos
  aparte del APK; en Chrome de Xiaomi el selector de archivos puede recargar la página (hay aviso y opción de pegar el respaldo).

## Compilar el APK
- `android\compilar-con-clave.ps1`: copia la clave original, corre `android\build.ps1` y la borra al terminar.
  Necesita las variables de entorno `CHARCUTERIA_KEYSTORE` (ruta del `.jks` original) y `CHARCUTERIA_TOOLS` (ver abajo); sin ellas falla con un mensaje claro. Las rutas reales de esta PC están en la memoria privada de Claude, no en el repo.
  `build.ps1` genera una clave NUEVA si falta `android\charcuteria.jks`: usar siempre el wrapper.
- Las herramientas del harness de DeepSeek (aapt2, zipalign, javac) **no pueden escribir archivos**
  cuando las lanza Claude desde ahí ("Datos no válidos (13)"). Copiarlas (build-tools 34, `platforms/android-34/android.jar`, `jdk17`)
  a una carpeta temporal y pasar `CHARCUTERIA_TOOLS=<esa carpeta>`; correr con el sandbox desactivado.
- Verificar después: `apksigner verify --print-certs dist\Charcuteria.apk` → huella `f9b36323…`; `assets/index.html` con el
  `APP_VERSION` nuevo; que no quede `android\charcuteria.jks` ni `android\Charcuteria.apk.idsig`.
- No usar `android\actualizar.ps1` para un build normal: sube la versión sola.

## Modelo de datos (localStorage)
- `charcuteria.stockItems.v2` ítems {id, nombre, categoria producto|insumo, unidad, archivado}; `charcuteria.movimientos.v1`
  movimientos con cantidad con signo (saldo/Existencia, compra, uso, usoExterno, perdida, otro, correccion, anulacion).
  Cantidad y precio promedio salen de los movimientos; una Existencia con precio lleva `fija: true` y reemplaza el promedio.
- `charcuteria.lotes.v2` lotes preparacion → proceso → terminado | cancelado; `charcuteria.vinculos.v1` ingrediente (por `norm(nombre)`)
  → id de ítem, o `'__no'` (= «No está en el stock»: no buscar por nombre). Se elige a mano en «Ingredientes: stock y costo».
- En los datos del lote/receta: `tripaId` (embutidos = fermentado y cocido; si falta se usa el ítem «Tripa») y `envolturas`
  `{hilo|clip|papel|red: {usar, itemId, cantidad}}` (hilo/clip = cierre de embutidos, uno solo; papel/red = enteros;
  cantidad en la unidad del ítem). `ENVOLTURAS[k].tipos` dice qué claves valen para cada tipo.
- Tipos: `entero`, `fresco`, `fermentado`, `cocido`, `salmuera` (`TIPOS`). Embutidos (`esEmbutido`) = fresco, fermentado y
  cocido: tripa + cierre. Cura: fresco y cocido van con #1 (con #2 → alerta roja por nitrosaminas al cocinar); entero y
  fermentado con #2 (con #1 → alerta roja por botulismo). No relajar esas alertas.
- `kg` de la receta: en `entero` es el peso de la carne (los aditivos se suman encima); en fermentado y cocido es la mezcla
  total (la base cárnica sale de dividir por 1 + % de aditivos); en salmuera, la carne.
  Se agregan solo si corresponden (`agregarEnvolturasData`), para que los lotes viejos no se vean distintos de su receta.
  `estadoDeData(d)` calcula precio de tripa y costo de envolturas por lote: no usar los globales del lote abierto.
- `charcuteria.preciosProvisorios.v1` {norm(nombre): {nombre, precio}}: precio por kg (por unidad del ítem en envolturas)
  solo para calcular costos; no toca el stock y se descarta cuando el ítem tiene precio en el stock.
- Cada ítem de stock guarda su `grupo` (`GRUPOS_STOCK`: carnico, grasa, tripa, envoltura, aditivo, cura, especia, alimento, otro); `grupoItem(it)` lo lee y, si falta o no vale (respaldo viejo), cae a `grupoStock(nombre)`, que es solo una sugerencia por el nombre. `categoria` (producto|insumo) se deriva del grupo (`categoriaDeGrupo`) y solo se usa en los totales. Las tripas tienen `tipoTripa` (`TIPOS_TRIPA`). `crearItem(nombre, unidad, categoria|grupo, grupo, tipoTripa)`. Migraciones de una sola vez: `charcuteria.migracion.v2`, `charcuteria.categorias.v2`, `charcuteria.grupos.v1`.
- La sal de cura de la receta sigue siendo `curaTipo`/`curaPct` (de ahí salen las alertas rojas y los ppm); en pantalla es el grupo «Sales de cura» (`renderGrupoCura`), no una fila libre de ingredientes.
- Importar y borrar en bloque guardan antes `charcuteria.respaldoPrevio` (una sola vuelta atrás).
- Impresión: `fichaRecetaDoc(data, nombre, notas)` arma la hoja de una receta sin tocar `state` (recetario y editor); `construirDocImpresion(op)` sirve al diálogo de lote/compras/stock. Los dos pasan por `armarDocImpresion` y `enviarImpresion`. El CSS fuerza `print-color-adjust` (si no, el WebView de Android pierde los fondos).
- Escalar el lote: `kgParaIngrediente(s, idx, g)` (pura) da los kg para que un cárnico/grasa pese g gramos (kg = g·100/pct · kg/baseKg); `escalarLote` la aplica solo si `permisos().receta`. UI: los gramos de cárnicos y grasa en `renderIngredientes` son un `<input class="ing-g-input">` (evento `change`); `recalcular` los refresca por `data-idx` (value si es input, textContent si es span). No hay cuadro aparte.
- Idiomas: todo texto visible pasa por `tx('texto en castellano', {vars})`; la clave ES el castellano y si falta traducción se ve el castellano. Lo fijo del HTML lo traduce `traducirDOM` al iniciar y las hojas impresas `traducirHTML`; cambiar de idioma guarda `charcuteriaIdioma.v1` (fuera del prefijo, no va al respaldo) y recarga. `TIPOS`, `ESTADOS_LOTE`, `GRUPOS_STOCK` y `TIPOS_MOV` se traducen en `traducirTablas`; `TIPOS_TRIPA`, `ENVOLTURAS` y `CURAS` NO (sus nombres se guardan o se buscan en el stock): se traducen al mostrarlos. Diccionarios en `app/i18n/en.json` y `de.json`; después de agregar textos: traducirlos ahí y correr `node app/i18n/meter.mjs` (los mete entre los marcadores `I18N-DICCIONARIOS`). `test-logica` falla si un `tx()` no tiene traducción o pierde variables. No traducir lo que se compara con datos (nombres de stock, heurísticas de `grupoStock`, «Tripa», BORRAR).
- Cocido y embutido fresco sin avisos de sal, A PEDIDO (no es un olvido): en `compute`, `avisaSal = tipo !== 'cocido' && tipo !== 'fresco'` apaga «falta la sal», sal baja y sal alta, y `tonos.sal` queda `ok`. Los avisos de nitrito/cura de esos dos tipos (cura #2 → nitrosaminas, sin cura, ppm) se mantienen: no relajar esos. Entero, fermentado y salmuera conservan todos los avisos de sal.
- `espesor` (cm, solo `entero`; 0 = sin definir) viaja en `datosReceta`/`cargarDatosEnEstado`/`estadoDeData`/`limpiarDataReceta` (0–30). `compute` devuelve `diasBolsa = ceil(max(espesor/0.5, 0.29·espesor²) + 3)` (regla lineal vs difusión de Fick, t≈0,3·L²/D con D≈3e-10 m²/s) y `diasCurado` lo usa como salazón del entero. UI: `#espesor` y `#tile-bolsa`, solo en enteros. No hay tabla oficial: es una estimación (ver CHANGELOG).
