# ADR 0002 — Base, componentes y adiciones

- **Estado:** reemplazada por [0011](0011-tocino-fijo.md)
- **Fecha:** 2026-11-02

## Contexto

Las recetas del Excel mezclan dos cosas distintas: la composición de la carne (cerdo, vaca, tocino, hígado) y las adiciones (sal, cura, especias, vino). Si todo se tratara como “ingrediente que se suma”, las carnes se contarían dos veces y el peso de la mezcla quedaría mal.

## Decisión

- El campo **Carne (kg)** es la **base**: la suma de todos los componentes.
- Los ingredientes con rol `componente` (cerdo, vaca, tocino, hígado) describen esa base y **deben sumar 100 %**. Sus gramos se muestran, pero **no se suman** al peso de la mezcla.
- El resto de los ingredientes son **adiciones**: se calculan sobre la base y sí se suman.
- `pesoMezclaKg = kg + adiciones/1000`.
- La sal total, el ppm de nitrito/nitrato y los costos se calculan sobre la base (`kg`).

## Consecuencias

- No hay doble conteo de carnes.
- La composición se puede editar sin romper el peso.
- El usuario tiene que entender que “Carne” es la base total, no solo el músculo; la app lo aclara con una nota y el indicador de composición.

## Alternativas consideradas

- **Componentes como adiciones:** sencillo de programar, pero duplica el peso.
- **Tabla separada de composición:** más explícita, pero más UI para una receta que suele ser fija.
- **Un solo campo “Carne” sin desglose:** pierde la trazabilidad del Excel.
