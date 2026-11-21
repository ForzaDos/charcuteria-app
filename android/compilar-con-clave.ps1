# Compila con la clave original (fuera del repo) y la saca al terminar.
$ErrorActionPreference = 'Stop'
$ks = Join-Path $PSScriptRoot 'charcuteria.jks'
# Ruta de la clave original, guardada fuera del repo: variable de entorno CHARCUTERIA_KEYSTORE.
if (-not $env:CHARCUTERIA_KEYSTORE) { throw 'Definí CHARCUTERIA_KEYSTORE: ruta del charcuteria.jks original (fuera del repo)' }
$original = $env:CHARCUTERIA_KEYSTORE
Copy-Item $original $ks -Force
try {
    & (Join-Path $PSScriptRoot 'build.ps1')
} finally {
    Remove-Item $ks -Force -ErrorAction SilentlyContinue
    'FIN BUILD - clave borrada: ' + (-not (Test-Path $ks))
}

