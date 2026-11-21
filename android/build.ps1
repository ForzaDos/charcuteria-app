$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
# Carpeta con android-sdk (build-tools 34.0.0 y platforms\android-34) y jdk17. Se indica con la variable de entorno CHARCUTERIA_TOOLS.
if (-not $env:CHARCUTERIA_TOOLS) { throw 'Definí CHARCUTERIA_TOOLS: carpeta que contiene android-sdk y jdk17' }
$tools = $env:CHARCUTERIA_TOOLS
$sdk = Join-Path $tools 'android-sdk'
$jdk = Join-Path $tools 'jdk17'
$bt = Join-Path $sdk 'build-tools\34.0.0'
$androidJar = Join-Path $sdk 'platforms\android-34\android.jar'
$html = Join-Path $root '..\app\index.html'
$salidaServidor = Join-Path $root '..\dist\Charcuteria.apk'

$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"

foreach ($p in @($bt, $androidJar, $html)) {
    if (-not (Test-Path $p)) { throw "Falta: $p" }
}

$build = Join-Path $root 'build'
Remove-Item -Recurse -Force $build -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $build | Out-Null

$assets = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
Copy-Item $html (Join-Path $assets 'index.html') -Force

$manifestXml = Get-Content (Join-Path $root 'AndroidManifest.xml') -Raw
$versionCode = [regex]::Match($manifestXml, 'android:versionCode="(\d+)"').Groups[1].Value
$versionName = [regex]::Match($manifestXml, 'android:versionName="([^"]+)"').Groups[1].Value
if (-not $versionCode -or -not $versionName) { throw 'No pude leer versionCode/versionName del manifest' }

Write-Output '[1/7] Recursos'
& "$bt\aapt2.exe" compile --dir (Join-Path $root 'res') -o (Join-Path $build 'res.zip')
if ($LASTEXITCODE -ne 0) { throw 'aapt2 compile fallo' }

& "$bt\aapt2.exe" link `
    -o (Join-Path $build 'base.apk') `
    -I $androidJar `
    --manifest (Join-Path $root 'AndroidManifest.xml') `
    -R (Join-Path $build 'res.zip') `
    -A (Join-Path $root 'assets') `
    --min-sdk-version 24 `
    --target-sdk-version 34 `
    --version-code $versionCode `
    --version-name $versionName `
    --auto-add-overlay
if ($LASTEXITCODE -ne 0) { throw 'aapt2 link fallo' }

Write-Output '[2/7] Java'
$classes = Join-Path $build 'classes'
New-Item -ItemType Directory -Force -Path $classes | Out-Null
$javaFiles = (Get-ChildItem (Join-Path $root 'src') -Recurse -Filter *.java).FullName
& "$jdk\bin\javac.exe" -source 1.8 -target 1.8 -encoding UTF-8 -classpath $androidJar -d $classes $javaFiles
if ($LASTEXITCODE -ne 0) { throw 'javac fallo' }

Write-Output '[3/7] DEX'
$dexDir = Join-Path $build 'dex'
New-Item -ItemType Directory -Force -Path $dexDir | Out-Null
$classFiles = (Get-ChildItem $classes -Recurse -Filter *.class).FullName
& "$bt\d8.bat" --lib $androidJar --min-api 24 --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw 'd8 fallo' }

Write-Output '[4/7] Empaquetar classes.dex'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkBase = Join-Path $build 'base.apk'
$zip = [System.IO.Compression.ZipFile]::Open($apkBase, 'Update')
$old = $zip.GetEntry('classes.dex')
if ($old) { $old.Delete() }
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
    $zip, (Join-Path $dexDir 'classes.dex'), 'classes.dex',
    [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
$zip.Dispose()

Write-Output '[5/7] Alinear'
& "$bt\zipalign.exe" -f 4 $apkBase (Join-Path $build 'aligned.apk')
if ($LASTEXITCODE -ne 0) { throw 'zipalign fallo' }

Write-Output '[6/7] Firmar'
$ks = Join-Path $root 'charcuteria.jks'
if (-not (Test-Path $ks)) {
    & "$jdk\bin\keytool.exe" -genkeypair -v -keystore $ks -alias charcuteria `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass charcuteria -keypass charcuteria `
        -dname "CN=Charcuteria, O=Tani, C=AR"
    if ($LASTEXITCODE -ne 0) { throw 'keytool fallo' }
}
& "$bt\apksigner.bat" sign --ks $ks --ks-pass pass:charcuteria --key-pass pass:charcuteria `
    --out (Join-Path $root 'Charcuteria.apk') (Join-Path $build 'aligned.apk')
if ($LASTEXITCODE -ne 0) { throw 'apksigner fallo' }

Write-Output '[7/7] Verificar y publicar'
& "$bt\apksigner.bat" verify --verbose (Join-Path $root 'Charcuteria.apk')
& "$bt\aapt2.exe" dump badging (Join-Path $root 'Charcuteria.apk') | Select-Object -First 6
Copy-Item (Join-Path $root 'Charcuteria.apk') $salidaServidor -Force

Write-Output ('APK listo: ' + (Get-Item (Join-Path $root 'Charcuteria.apk')).Length + ' bytes')
Write-Output ('Copia servida: ' + $salidaServidor)
