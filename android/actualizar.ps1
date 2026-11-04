param(
    [switch]$NoInstalar
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$manifestPath = Join-Path $root 'AndroidManifest.xml'
$manifest = Get-Content $manifestPath -Raw

$vcMatch = [regex]::Match($manifest, 'android:versionCode="(\d+)"')
$vnMatch = [regex]::Match($manifest, 'android:versionName="([^"]+)"')
if (-not $vcMatch.Success -or -not $vnMatch.Success) {
    throw 'No pude leer versionCode/versionName del AndroidManifest.xml'
}

$nuevoCode = [int]$vcMatch.Groups[1].Value + 1
$partes = $vnMatch.Groups[1].Value.Split('.')
$nuevoName = $partes[0] + '.' + ([int]$partes[1] + 1)

$manifest = $manifest -replace 'android:versionCode="\d+"', ('android:versionCode="' + $nuevoCode + '"')
$manifest = $manifest -replace 'android:versionName="[^"]+"', ('android:versionName="' + $nuevoName + '"')
Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8

Write-Output ('Subiendo version ' + $nuevoName + ' (code ' + $nuevoCode + ')')

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
& (Join-Path $root 'build.ps1')
if ($LASTEXITCODE -ne 0) { throw 'build.ps1 fallo' }

$apk = Join-Path $root 'Charcuteria.apk'
if (-not (Test-Path $apk)) { throw 'No se genero el APK' }
Write-Output ('APK: ' + $apk)

if ($NoInstalar) {
    Write-Output 'Listo, no instale nada.'
    return
}

$dispositivos = @(adb devices | Where-Object { $_ -match '\sdevice\s*$' })
if ($dispositivos.Count -eq 0) {
    Write-Output 'No hay telefono conectado por USB.'
    Write-Output 'Actualizala desde Chrome: http://192.168.18.14:8099/Charcuteria.apk'
    return
}

$salida = adb install -r $apk 2>&1 | Out-String
Write-Output $salida.Trim()
if ($salida -match 'Success') {
    adb shell am force-stop ar.charcuteria.app 2>&1 | Out-Null
    Start-Sleep -Seconds 1
    adb shell am start -W -n ar.charcuteria.app/.MainActivity 2>&1 | Out-Null
    Write-Output ('Instalada ' + $nuevoName + ' y abierta en el telefono.')
} else {
    Write-Output 'ADB no pudo instalar (bloqueo de MIUI). Actualizala desde Chrome:'
    Write-Output 'http://192.168.18.14:8099/Charcuteria.apk'
}
