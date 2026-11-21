# MEMORY.md — Hold For Me (Paradox Loop)

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- **Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Canvas 2D. Campaña jugable de 10 niveles en canvas **960×400**, loop 20 s / 60 Hz (1201 frames por vuelta).
- **Simulación (`src/game/sim.ts`, pura/determinista):** grabación de vueltas, fantasmas/rastro sólidos, placas/puertas, láseres estáticos (`poweredByPlates`), láseres móviles A↔B, `laserSegment` habilitables/deshabilitables, secuencia global de interruptores ordenados (fuera→dentro, reset por error, persistencia al completar), bloqueo por fantasmas, aplastamiento, láser, timeout, rewind/seek y `finishCurrentLap`.
- **Niveles (`src/game/levels.ts`):** 1 Caminar (1), 2 El sostén (2), 3 El relevo (3), 4 La cuadrilla (3), 5 El pulso (2, láser móvil), 6 Orden correcto (2, interruptores/segmento), 7 Sincronía (3), 8 La herradura (3), 9 Cámaras cruzadas (3), 10 Última coordinación (3, combina móvil+segmentos+interruptores). Validación estricta de definiciones (O1).
- **UI/render/audio:** menú con blueprints y reanudación por primer nivel no completado, modal de controles, timeline con seek, pausa/rebobinado continuo, overlays victoria/derrota con foco/escape, música procedural + SFX y toggle. Progreso y música en `localStorage` (`paradoxloop_completed_v1`, `holdforme_music_enabled_v1`).
- **SDD:** `specs/001`–`specs/005` presentes (001 y 005 en estado aprobado; 002–004 en borrador según encabezados). Implementación realizada en Google AI Studio con ajustes manuales posteriores. Evidencias en `public/assets/aistudio/`.
- **Calidad (verificado 2026-11-20):** `node --test` en verde con 30/30 tests. `src/game/sim.test.ts` alineado a los topes reales de vueltas y a rutas de victoria deterministas/timeout donde corresponde. Commit `f27dc58` (`test: alinear tests con los limites de vueltas actuales`) pusheado a `main`. CI ejecuta tests, lint y build con Node 24.
- **README:** actualizado a controles reales (`Espacio` termina vuelta, `Enter`/`NumpadEnter` pausa, `Supr` reinicia, `Esc` cierra overlays/modales), estado actual, estructura y workflow de Pages; los specs `003`/`004` conservan el contrato original de vueltas y `levels.ts` manda.
- **Git:** rama `main`; después del push de tests, `README.md` y `MEMORY.md` quedan modificados pendientes de decisión de commit. Revisar `git status` antes de commitear.

## Decisiones y hechos
- **Spec/contrato para AI Studio:** specs aprobadas guían implementación; cambios de comportamiento deben reflejarse primero en spec/plan/tareas/handoff.
- **`sim.ts` puro y determinista:** estado derivado de posiciones/frames; sin DOM/Canvas/`window`.
- **Contratos base:** 1201 frames por vuelta, placa activa con `plate.r + 4`, zona segura de spawn 44 px, trail ancho 24 px muestreado cada 4 frames, láser con `LASER_BEAM_HALF_WIDTH=5`, sin colisión fantasma/rastro en spawn, timeout en última vuelta agotada.
- **Topes de vueltas vigentes:** `1 / 2 / 3 / 3 / 2 / 2 / 3 / 3 / 3 / 3` (fuente: `src/game/levels.ts`). No restaurar el contrato original de specs solo para satisfacer tests.
- **Stack/deps pragmáticos:** `package.json` incluye dependencias adicionales incorporadas durante iteraciones (algunas podrían no usarse en runtime/juego); cambios futuros de deps requieren justificación/aprobación.

## Próximos pasos
- Decidir si se commitean/pushean los cambios de documentación (`README.md`, `MEMORY.md`).
- Si se puede verificar localmente con dependencias instaladas, correr `npm run lint` y `npm run build`; otherwise CI ya cubre ambos.
