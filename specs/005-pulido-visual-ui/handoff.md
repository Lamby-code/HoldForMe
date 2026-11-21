# Handoff 005 — Pulido visual y UI (Google AI Studio)

Copia y pega este prompt en Google AI Studio para implementar la spec aprobada. **La spec es el contrato:** no implementes nada fuera de ella. La spec `specs/005-pulido-visual-ui/spec.md` fue **aprobada explícitamente por el usuario** con D-005-1..D-005-6 y **veredicto final de `@tester`: APROBADO** tras la revalidación de D-005-6; no la modifiques. Si encuentras ambigüedad no cubierta o una desviación de base, repórtala con evidencia y detente antes de dar por cerrada la spec: **no inventes comportamiento ni ajustes la spec por silencio**.

---

## Prompt

Actúa como implementador de **Hold For Me (Paradox Loop)**. Implementa `specs/005-pulido-visual-ui/spec.md` siguiendo `plan.md`, `tasks.md` y este handoff. **No hay agente programador:** tu salida es la implementación y su reporte.

### Objetivo y alcance

- Realizar un **rediseño artístico integral de la presentación**: sustituir por completo la paleta y el lenguaje visual (fondo, superficies, bordes, muros, texto, estados, tokens de forma, jerarquía tipográfica, tratamientos de render y overlays) en menú, vista de juego, selector, reglas, victoria, derrota y pausa.
- El rediseño es **solo de presentación**. Conservar los seis identificadores de vuelta no cíclicos `V1`–`V6`, la precedencia de estados de Spec 002 y los umbrales de contraste.
- Mostrar el `hint` **bajo demanda** mediante un botón secundario «Ver pista», sin estado nuevo en la simulación ni persistencia.
- Cumplir **WCAG 2.2 AA con verificación manual**: 4,5:1 texto normal, 3:1 texto grande/UI, foco de 2 px, controles de 32 px, teclado en timeline y tabla de contraste documentada, sin herramientas ni dependencias nuevas.
- Mantener las fuentes ya declaradas en `index.html` (JetBrains Mono, Outfit, Plus Jakarta Sans). No introducir fuentes, recursos ni dependencias nuevas.

**Fuera de alcance:** mecánicas/reglas/niveles nuevos, geometría o parámetros, cambios en `src/game/sim.ts`, audio/SFX, móvil/táctil, backend, cuentas, red, telemetría, secretos, persistencia no trivial, documentos de gobierno y specs.

### ⚠️ Advertencias importantes (leer antes de empezar)

1. **Trabaja sobre los contratos aprobados aunque el repo esté desalineado.** La spec se escribió contra canvas 960×400, 10 niveles, `maxLaps` 1–6 y seis vueltas, pero el repo observado tiene `CANVAS_H = 600`, 4 niveles, `maxLaps` 1–4, `COLORS.laps` de 4 con `getLapColor` usando `%`, `[0,1,2,3]` y «4 niveles» en `TitleMenu`, «Start», `hint` en datos pero no visible, botones de nivel en la barra superior y sin `laserSegment`/láser móvil/interruptores de Spec 002. **No adaptes la spec a ese estado ni lo corrijas silenciosamente.**
2. **Documenta toda desviación y repórtala antes de dar la spec por cerrada** (DEP-005-6 / CL-10 / RF-11). Si un RF no es demostrable con la base real —por ejemplo selector de 10 niveles, N10 de 6 vueltas o estados de secuencia no expuestos— regístralo con archivo/línea y consecuencia, y escálalo. No lo disfraces con un fallback, no lo llames «hecho» y no amplíes alcance para implementar Specs 001–004.
3. **No introduzcas reglas, niveles, dependencias ni fuentes nuevas.** `sim.ts`, `sim.test.ts`, `levels.ts`, `audio.ts` e `index.html` quedan sin diff; `package.json`/lockfiles sin cambios; sin `@font-face`, `link`, imágenes ni temas nuevos. «Ver pista» es `useState` de UI y no `SimState` ni `localStorage`.
4. **Ante una ambigüedad, reporta: no inventes.** Esto incluye el retroceso de 1 frame con `ArrowLeft` en la timeline (sin avance con `ArrowRight`, según D-005-6), el tratamiento de un estado no expuesto por `deriveWorld` y la decisión de no crear un modal de pausa nuevo.

### Contexto y contratos que debes preservar

- `src/game/sim.ts` puro y determinista: sin DOM, Canvas, `window`, React, timers, aleatoriedad ni I/O; mismo estado + entrada ⇒ mismo resultado.
- Constantes: `TICK_HZ = 60`, `LOOP_SECONDS = 20`, `FRAMES_PER_LAP = 1200` ticks (**1201 muestras por vuelta**), `PLAYER_RADIUS = 12`, `PLAYER_SPEED = 220` px/s, `TRAIL_HALF_WIDTH = 12`, `TRAIL_SAMPLE_INTERVAL = 4`, `SPAWN_SAFE_RADIUS = 44`, `LASER_BEAM_HALF_WIDTH = 5`, `DEATH_SLOWMO_FRAMES = 24`.
- Reglas: placa `plate.r + 4`; meta `player.r + goal.r`; timeout solo en la última vuelta agotada; `rewindStep`/`seekToFrame` truncan el futuro y solo permiten el historial grabado; `finishCurrentLap` fija la posición.
- Tipos a conservar: `SimState`, `Frame`, `InputState`, `DerivedWorld`, `ActiveLaserSegment`, `GhostEntity`, `RenderOptions`, `LevelDef` (con `hint`), `Rect`, `Plate`, `Door`, `Laser`.
- Precedencia D5/F9 de Spec 002: no se redefine ni se implementa aquí; muestra solo lo que expone `deriveWorld`. Si falta un estado, RF-11: documenta y escala, no lo infieras.
- Idioma: código, nombres, comentarios y tests en **inglés**; interfaz, textos, `hint`s y reporte en **español**.

### Decisiones aprobadas (D-005-1..D-005-6)

- **D-005-1:** rediseño artístico integral de todas las superficies, solo presentación.
- **D-005-2:** sustituir la paleta completa; 6 vueltas no cíclicas `V1`–`V6` sin `%`; precedencia D5/F9 y umbrales intactos.
- **D-005-3:** WCAG 2.2 AA con verificación manual; sin herramienta de auditoría nueva.
- **D-005-4:** `hint` bajo demanda con botón secundario «Ver pista»; sin estado ni persistencia nuevos.
- **D-005-5:** mantener las fuentes ya declaradas en `index.html`; sin recursos nuevos.
- **D-005-6:** en la timeline solo `ArrowLeft` retrocede 1 frame; `ArrowRight` se ignora sin avance porque `rewindStep`/`seekToFrame` truncan el futuro y `sim.ts` queda sin cambios.

### Archivos relevantes y expectativas

- **Modificar:** `src/game/colors.ts` (único módulo de tokens: paleta completa, tokens de forma, 6 colores y etiquetas de vuelta; conserva `COLORS` y `getLapColor`), `src/game/render.ts` (tokens + doble codificación + geometría efectiva), `src/App.tsx` (barra superior, HUD, «Ver pista», overlays, teclado), `src/components/TitleMenu.tsx` (menú sin `[0,1,2,3]` ni «4 niveles», «Comenzar»), `src/components/LevelSelectorModal.tsx` (selector derivado y foco), `src/components/TimelineBar.tsx` (1–6 vueltas, ARIA, `ArrowLeft`), `src/index.css` (roles tipográficos, foco, reduced motion).
- **Leer sin modificar:** `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`, la spec, `plan.md`, `tasks.md`, `src/game/levels.ts`, `src/game/sim.ts`, `src/game/sim.test.ts`, `src/game/audio.ts`, `index.html`, artefactos de `specs/004-niveles-8-10/`.

### Tareas (seguir este orden)

1. **T1** Verificar el estado real y documentar/escalar DEP-005-6. Sin tocar código; `node --test` inicial.
2. **T2** Unificar tokens y tipografía en `colors.ts` + `index.css` (6 vueltas sin `%`, fuentes existentes).
3. **T3** Aplicar tokens al render con doble codificación y geometría efectiva; `sim.ts` intacto.
4. **T4** Barra superior, HUD y «Ver pista» en `App.tsx`, incluidas tarjetas de victoria/derrota.
5. **T5** Menú, selector y modal con tokens, derivación y foco (`TitleMenu`, `LevelSelectorModal`).
6. **T6** Timeline dinámica y teclado en `TimelineBar` + `App` (solo `ArrowLeft` retrocede 1 frame dentro del historial; `ArrowRight` se ignora sin avance, D-005-6).
7. **T7** Accesibilidad consolidada: foco 2 px, ≥32 px, 8 px, reduced motion, sin scroll a 1366×768.
8. **T8** Tabla de contraste manual, checklist por pantalla y búsquedas de evidencia.
9. **T9** Verificación final y reporte (`node --test`, `npm run lint`, `npm run build`).

### Criterios de aceptación

- Checklist por pantalla de las 7 superficies con tokens nuevos; ningún rol con dos valores literales divergentes.
- Seis colores de vuelta distintos y no cíclicos con `V1`–`V6` en fantasmas, rastro, timeline, selector y HUD; sin `%`.
- «Ver pista» visible solo bajo demanda, secundario, en español, foco 2 px, ≥32×32 px; `hint` ausente antes de pulsarlo; sin banderas en `sim.ts` ni `localStorage`.
- Selector/contadores derivados de la colección, sin «4 niveles», `[0,1,2,3]` ni botones de nivel en la barra superior; si no hay 10 niveles o N10, desviación escalada.
- Timeline 1–6 con `role="slider"`, ARIA, playhead y `ArrowLeft` dentro del historial sin mover al jugador; el cálculo parte del playhead global real (`state.lap * FRAMES_PER_LAP + state.t`), retrocede 1 frame con tope inferior 0 (nunca `maxLaps * FRAMES_PER_LAP`) y la conversión a `(lap, frameInLap)` precede a `onSeek`. **Cualquier otra tecla, incluido `ArrowRight`, se ignora sin producir avance** (D-005-6): `rewindStep`/`seekToFrame` truncan el futuro y modificar `sim.ts` está fuera de alcance; no agregues cursor paralelo ni atajo que simule avance. Contratos de rewind/seek en verde.
- Overlays con foco inicial, confinamiento, `Escape` y devolución de foco; una sola acción primaria por pantalla; sin «Start».
- Tabla de contraste AA (4,5:1 / 3:1) con fórmula de luminancia, incluidas etiquetas en canvas y los 6 colores de vuelta; foco 2 px; controles ≥32 px y separación ≥8 px; `prefers-reduced-motion` sin afectar el loop.
- `node --test` en verde; `npm run lint` y `npm run build` ejecutados y reportados; revisión visible documentada a 1366×768, escala 100%.
- Toda desviación DEP-005-6 registrada con evidencia y escalada antes de cerrar; ninguna ambigüedad resuelta inventando comportamiento.

### Formato de reporte esperado (responder con esto al terminar)

1. **Resumen:** qué se implementó y qué quedó pendiente o escalado, con el estado real de base encontrado.
2. **Archivos cambiados:** lista con breve descripción por archivo y confirmación de los archivos sin diff (`sim.ts`, `sim.test.ts`, `levels.ts`, `audio.ts`, `index.html`, deps/configs).
3. **Verificación ejecutada:** comandos y resultados (`node --test`, `npm run lint`, `npm run build`) y revisión visible a 1366×768.
4. **Checklist de revisión visible:** una línea por pantalla (menú, juego, selector, reglas, victoria, derrota, pausa) con captura o descripción reproducible; más recorrido por teclado (foco, Tab, Escape, «Ver pista», `ArrowLeft` en timeline y verificación de que `ArrowRight` no avanza) y comprobación de `prefers-reduced-motion`.
5. **Tabla de contraste:** pares texto/fondo e indicador/fondo con ratios calculados y resultado AA, incluidas etiquetas canvas y los 6 colores de vuelta; sin herramientas nuevas.
6. **Decisiones, dudas y desviaciones:** D-005-1..6 aplicadas; cada DEP-005-6 con archivo/línea, RF afectado y escalamiento; cualquier ambigüedad reportada, no inventada.
7. **RF cubiertos / evidencia:** mapeo RF-1..RF-20 → tests/diff/manual.
8. **Confirmación de restricciones:** `sim.ts` puro, sin reglas/niveles/geometría, sin audio/móvil, sin dependencias/fuentes/recursos nuevos, sin backend/red/secretos/persistencia nueva, código en inglés y textos visibles en español.

---
