# ADR 0011 — Tocino fijo y carnes balanceadas

- **Estado:** aceptada
- **Fecha:** 2026-11-02

## Contexto

El modelo anterior trataba a todas las carnes y al tocino como componentes que debían sumar 100 % juntos. El usuario necesita fijar el tocino (por ejemplo 20 % o 30 % de la base) y repartir el resto entre las carnes: 20 % tocino + 60 % vaca + 20 % cerdo, o 30 % tocino + 70 % de carnes.

## Decisión

- Separar los roles de la base: `carnico` (cerdo, vaca, hígado, etc.) y `grasa` (tocino).
- El campo **Base** es el peso total de carnes + tocino. Las carnes suman `100 − %tocino`; el tocino se fija aparte.
- Al editar el tocino, se reescalan las carnes. Al editar una carne, se preserva ese valor y se reparten las demás.
- Al cargar/borrar, las carnes se reescalan a `100 − %tocino`; el tocino no se toca.
- El alta de ingredientes tiene tipo: **Cárnico**, **Tocino/grasa**, Sal, Azúcar o Aditivo.
- La UI muestra “Cárnicos X % · Tocino Y % · Total 100 %” y avisa si no cierra.

## Consecuencias

- Ejemplos válidos: 20 % tocino + 60 % vaca + 20 % cerdo; 30 % tocino + 70 % de carnes.
- Se pueden agregar carnes nuevas sin duplicar el peso.
- Se admite más de una grasa, pero el caso normal es un solo tocino.
- Falta definir si el rebalanceo debe ser automático o con un botón explícito (ver [ADR 0005](0005-composicion-al-100.md)).

## Alternativas consideradas

- **Todos los componentes suman 100 %:** era el modelo anterior; impide fijar el tocino.
- **Tocino como adición:** no participa de la base y descuadra el porcentaje de grasa.
