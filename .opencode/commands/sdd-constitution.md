---
description: SDD · Propone o revisa la constitución del proyecto (principios innegociables)
agent: plan
---
Vamos a crear (o revisar, si ya existe) `docs/constitution.md`. Usa la skill sdd.
Antes de proponer nada, lee `AGENTS.md`, `MEMORY.md`, el estado real del código (`package.json`, `src/game/sim.ts`, tests/CI) y cualquier spec activa en `specs/`.
Contexto adicional: $ARGUMENTS
Proponme 6 principios innegociables, cortos y verificables, que cubran:
stack y dependencias (pragmático y controlado), relación entre spec y código (la spec como contrato para Google AI Studio), separación entre lógica e interfaz (`src/game/sim.ts` puro/determinista), verificación/tests, protección de datos/secrets, e idioma por capa. Máximo 15 líneas.
NO escribas el archivo todavía: espera mi aprobación.
