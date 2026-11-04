# Compila con la clave original (fuera del repo) y la saca al terminar.
$ErrorActionPreference = 'Stop'
$ks = Join-Path $PSScriptRoot 'charcuteria.jks'
$original = 'D:\User\Documentos\deepseek-harness\default-workspace\charcuteria-android\charcuteria.jks'
Copy-Item $original $ks -Force
try {
    & (Join-Path $PSScriptRoot 'build.ps1')
} finally {
    Remove-Item $ks -Force -ErrorAction SilentlyContinue
    'FIN BUILD - clave borrada: ' + (-not (Test-Path $ks))
}

