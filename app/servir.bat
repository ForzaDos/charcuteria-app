@echo off
setlocal
title Charcuteria - servidor local
cd /d "%~dp0"

set "IP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike 'Tailscale*' } ^| Select-Object -First 1).IPAddress"`) do set "IP=%%i"

echo.
echo   Charcuteria - servidor local
echo.
if defined IP (
  echo   En el celular, conectado a la misma Wi-Fi, abri:
  echo.
  echo       http://%IP%:8099
) else (
  echo   No pude detectar la IP. Ejecuta ipconfig y busca la IPv4.
)
echo.
echo   Cerra esta ventana para apagar el servidor.
echo.
python -m http.server 8099 --bind 0.0.0.0
pause
