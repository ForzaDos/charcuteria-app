# ADR 0003 — Cura #1/#2, ppm y sal total

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

La app tiene que verificar la dosis de sal de cura y avisar si el producto queda fuera de las referencias, sin convertirse en un certificado de inocuidad.

## Decisión

- **Cura #1:** 6,25 % de nitrito de sodio, 93,75 % de sal.
- **Cura #2:** 6,25 % de nitrito + 6,25 % de nitrato, 87,5 % de sal.
- **ppm de nitrito** = `gramos de cura × 0,0625 × 1000 / kg de base`.
- **ppm de nitrato** = `gramos de cura × 0,0625 × 1000 / kg de base` solo con cura #2.
- **Sal total** = sal agregada + la sal que aporta la cura (87,5 % en #2, 93,75 % en #1), sobre la base.
- Umbrales de referencia: nitrito 150 ppm (UE) / 156 ppm (EE. UU.), nitrato 300 ppm. La alerta roja de nitrito se dispara por encima de 156,5 ppm para no marcar la dosis estándar de 0,25 % (156,25 ppm).

## Consecuencias

- 0,25 % de cura #2 sobre la base da 156,25 ppm de nitrito y 156,25 ppm de nitrato.
- Leberwurst con 0,25 % de cura #1 da 156,25 ppm de nitrito y 0 ppm de nitrato.
- La app avisa; no reemplaza la normativa local ni la medición de pH/aw.

## Alternativas consideradas

- **ppm sobre la masa total (base + adiciones):** más cercano al producto final, pero se aleja de las referencias de dosis por kilo de carne.
- **No incluir la sal de la cura en el total:** subestima la sal real.
