# MEMORY.md — Hold For Me (Paradox Loop)

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- **Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Canvas 2D. Campaña jugable de 10 niveles en canvas **960×400**, loop 20 s / 60 Hz (1201 frames por vuelta).
- **Simulación (`src/game/sim.ts`, pura/determinista):** grabación de vueltas, fantasmas/rastro sólidos, placas/puertas, láseres estáticos (`poweredByPlates`), láseres móviles A↔B, `laserSegment` habilitables/deshabilitables, secuencia global de interruptores ordenados (fuera→dentro, reset por error, persistencia al completar), bloqueo por fantasmas, aplastamiento, láser, timeout, rewind/seek y `finishCurrentLap`.
- **Niveles (`src/game/levels.ts`):** 1 Caminar (1), 2 El sostén (2), 3 El relevo (3), 4 La cuadrilla (3), 5 El pulso (2, láser móvil), 6 Orden correcto (2, interruptores/segmento), 7 Sincronía (3), 8 La herradura (3), 9 Cámaras cruzadas (3), 10 Última coordinación (3, combina móvil+segmentos+interruptores). Validación estricta de definiciones (O1).
- **UI/render/audio:** menú con blueprints y reanudación por primer nivel no completado, modal de controles, timeline con seek, pausa/rebobinado continuo, overlays victoria/derrota con foco/escape, música procedural + SFX y toggle. Progreso y música en `localStorage` (`paradoxloop_completed_v1`, `holdforme_music_enabled_v1`).
- **SDD:** `specs/001`–`specs/005` presentes (001 y 005 en estado aprobado; 002–004 en borrador según encabezados). Implementación realizada en Google AI Studio con ajustes manuales posteriores. Evidencias en `public/assets/aistudio/`.
- **Calidad (verificado 2026-11-20):** Node v26.13.0. `node --test src/game/sim.test.ts` falla en 2 tests de Nivel 10 (esperan contrato/6 vueltas distinto al nivel actual de 3 vueltas: `lap` esperado 3 vs 2, y causa `laser` vs `timeout`). `npm run lint`/`npm run build` no verificados en esta sesión (sin `node_modules` local). CI (`.github/workflows/deploy.yml`) ejecuta tests, lint y build.
- **Git:** rama `main`; árbol con cambios locales/untracked en docs/artefactos (`AGENTS.md`, `MEMORY.md`, `docs/`, `specs/`, `.opencode/`, `.agents/`, `opencode.json`, `skills-lock.json`, modificaciones en `README.md`, `package.json`, workflow, etc.). Revisar antes de commitear.

## Decisiones y hechos
- **Spec/contrato para AI Studio:** specs aprobadas guían implementación; cambios de comportamiento deben reflejarse primero en spec/plan/tareas/handoff.
- **`sim.ts` puro y determinista:** estado derivado de posiciones/frames; sin DOM/Canvas/`window`.
- **Contratos base:** 1201 frames por vuelta, placa activa con `plate.r + 4`, zona segura de spawn 44 px, trail ancho 24 px muestreado cada 4 frames, láser con `LASER_BEAM_HALF_WIDTH=5`, sin colisión fantasma/rastro en spawn, timeout en última vuelta agotada.
- **Stack/deps pragmáticos:** `package.json` incluye dependencias adicionales incorporadas durante iteraciones (algunas podrían no usarse en runtime/juego); cambios futuros de deps requieren justificación/aprobación.

## Próximos pasos
- Alinear `src/game/sim.test.ts` (Nivel 10) con el diseño final de `levels.ts` o viceversa, y dejar suite en verde.
- Verificar `npm run lint` y `npm run build` con dependencias instaladas; luego ajustar CI/Node si hace falta.
- Revisar/actualizar `README.md` y controles documentados para que coincidan con la implementación final (p. ej. `Espacio` termina vuelta, `Enter` pausa).