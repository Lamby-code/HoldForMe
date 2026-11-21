---
name: sdd
description: Úsala siempre que trabajes con Spec-Driven Development en este proyecto
  (docs/constitution.md o cualquier archivo dentro de specs/) - redactar, revisar o
  cambiar specs, planes y tareas, o preparar/validar handoffs para Google AI Studio.
---

# Spec-Driven Development (SDD)

## Flujo

Constitución → Spec → Clarificación → Plan y tareas → Revisión → Handoff a Google AI Studio → Validación → Cambio.

- Nunca pases a la siguiente fase sin la aprobación explícita del usuario.
- La spec manda: si algo no está en la spec, no se implementa. Si falta una decisión, para y pregunta.
- Un cambio de requisitos se hace primero en la spec, luego en el plan, las tareas y el handoff, y por último en el código.
- Cada spec vive en su carpeta: `specs/NNN-nombre/` con `spec.md`, `plan.md`, `tasks.md` y (recomendado) `handoff.md`.
- Al terminar cada fase, actualiza `MEMORY.md`.

## Roles en este proyecto
- `planner`: redacta `spec.md`, `plan.md`, `tasks.md` y `handoff.md` en `specs/`.
- `tester`: revisa spec/plan/tareas como QA y valida la implementación resultante RF por RF.
- **Implementación:** la realiza **Google AI Studio** a partir de la spec aprobada; no hay agente `programmer`.

## Plantilla de spec (spec.md)

```
# Spec NNN — <Nombre>
Estado: borrador | aprobada | en implementación | implementada | validada

## Contexto y objetivo
## Usuarios
## Historias de usuario
- HU-1. Como <rol>, quiero <acción> para <beneficio>.
## Definiciones (solo si hay términos que puedan interpretarse de varias formas)
## Requisitos funcionales
## Requisitos no funcionales
## Casos límite
## Fuera de alcance
## Criterios de finalización
## Dudas abiertas
- [NECESITA ACLARACIÓN] <duda>
```

La spec describe el QUÉ y el POR QUÉ. Debe ser verificable y coherente con `docs/constitution.md` y el estado real del código.

## Requisitos en EARS (en español)

- RF-x: CUANDO <evento>, EL SISTEMA <respuesta>.
- RF-x: SI <condición no deseada>, ENTONCES EL SISTEMA <respuesta>.
- RF-x: MIENTRAS <estado>, EL SISTEMA <respuesta>.
- RF-x: EL SISTEMA <comportamiento permanente>.

Cada RF debe ser verificable: nada de "rápido", "intenso" o "bonito" sin un criterio medible.

## Plan (plan.md)

Contrato técnico para Google AI Studio. Incluye: contexto, archivos a leer/modificar y los que no se deben tocar, contratos/tipos/constantes a preservar, decisiones con alternativa descartada, algoritmo/pseudocódigo, estrategia de tests, comandos de verificación (`node --test`, `npm run lint`, `npm run build` si aplica) y tabla RF → evidencia.

## Tareas (tasks.md)

```
- [ ] **Tn. <Descripción>.** RF-x, RF-y
  - Archivos: ...
  - Hecho cuando: <comprobación verificable y comando/evidencia>.
```

Máximo 10 tareas, en orden de dependencia. Si salen más, propón dividir la spec.

## Handoff (handoff.md)

Prompt copy-paste para Google AI Studio con: objetivo, contexto, archivos relevantes, restricciones (constitución/AGENTS), tareas en orden, criterios de aceptación y formato de reporte esperado (archivos cambiados, tests/lint/build ejecutados, decisiones o dudas).

## Implementación y validación

- Google AI Studio implementa siguiendo la spec aprobada. Si encuentra ambigüedad, debe reportarla; no debe inventar comportamiento.
- El tester valida RF por RF con evidencia (`node --test`, lint/build cuando aplique, diff y revisión UI en desktop cuando corresponda).
- Una spec se considera cerrada solo con veredicto APROBADO y `MEMORY.md` actualizado.
