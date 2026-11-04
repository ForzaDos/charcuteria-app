# ADR 0005 — Composición de la carne al 100 %

- **Estado:** actualizada por [0011](0011-tocino-fijo.md), con revisión pendiente
- **Fecha:** 2026-11-02

## Contexto

Los componentes (cerdo, vaca, tocino, hígado) tienen que sumar exactamente 100 % de la base. El usuario puede escribir 50 / 50 / 20 = 120 % y, sin corrección, los gramos y el peso de la mezcla quedan mal.

## Decisión

- Al editar un componente, se respeta el valor editado y **se reparte el resto** entre los otros componentes, proporcionalmente a lo que tenían.
- Al borrar un componente, al cargar una receta guardada y al cargar la sesión, se **reescalan todos** proporcionalmente a 100.
- La app muestra “Composición de carne: 100 % (se ajusta sola…)” y un aviso al ajustar.

## Consecuencias

- La suma nunca queda distinta de 100.
- El usuario puede ver que un valor que había fijado cambia cuando edita otro.
- La regla no es la misma al editar que al cargar/borrar: los mismos números pueden normalizarse distinto.
- La auditoría pro marcó esto como observación media: el autoajuste silencioso es engañoso y conviene un botón **Normalizar** explícito o escalar los tres proporcionalmente, con una sola regla.

## Pendiente

Elegir y unificar:

1. Botón “Normalizar” explícito (no tocar mientras se escribe).
2. Escalar los tres proporcionalmente en todos los caminos.
3. Mantener el autoajuste pero decir exactamente qué valores cambiaron.

Agregar tests de normalización (edición, borrado, un componente, todos en 0, >100, NaN) y de round-trip de persistencia.

## Alternativas consideradas

- **Bloquear el cálculo hasta que sume 100:** simple, pero deja al usuario sin gramos.
- **Último componente como balance:** predecible, pero impide fijar el último valor.
