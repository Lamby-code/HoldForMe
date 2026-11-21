# AGENTS.md — Hold For Me (Paradox Loop)

Puzzle web 2D top-down donde cada vuelta es una grabación de 20 s de vos mismo.
El jugador coreografía versiones pasadas de sí para abrirse camino. Público: jugadores de puzzle en desktop.

## Stack y estructura
- React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Canvas 2D.
- Timestep fijo de 60 Hz; fantasmas kinemáticos grabados; estado derivado de posiciones.
- `src/main.tsx` / `index.html`: entrada y montaje.
- `src/App.tsx` y `src/components/`: UI, input, loop de la app y overlays. Componentes principales: `TitleMenu`, `LevelBlueprint`, `TimelineBar`, `LevelSelectorModal` (modal de controles), `FutureMechanicsLegend`.
- `src/game/sim.ts`: estado, colisiones, grabación, rewind/seek, transición de vueltas y reglas. **Puro y determinista**: sin DOM, Canvas ni `window`.
- `src/game/render.ts`: dibujado en Canvas 2D (escenario, entidades, láseres, trazas, UI visual en canvas).
- `src/game/levels.ts`: campaña (10 niveles), geometría/entidades y constantes de canvas; incluye validación de definiciones (`validateLevels`/`assertValidLevelDef`).
- `src/game/colors.ts`: tokens/tema y paleta de vueltas (V1–V6); `src/game/audio.ts`: SFX y música procedural con preferencia local.
- `src/game/sim.test.ts`: tests de la simulación.
- `specs/001`–`specs/005`: artefactos SDD (spec/plan/tasks/handoff). `public/assets/aistudio/`: evidencias/artefactos generados en AI Studio.

## Estado funcional actual
- **Campaña:** 10 niveles (`Caminar`, `El sostén`, `El relevo`, `La cuadrilla`, `El pulso`, `Orden correcto`, `Sincronía`, `La herradura`, `Cámaras cruzadas`, `Última coordinación`) en canvas lógico **960×400**.
- **Mecánicas:** spawn/meta, muros, placas, puertas, láseres estáticos (`poweredByPlates` opcional), láseres móviles lineales (A↔B), segmentos de láser (`laserSegment`) con habilitación/deshabilitación, secuencias globales de interruptores ordenados (activación fuera→dentro, reinicio por error), bloqueo de láser por fantasmas, fantasmas/rastro sólidos, aplastamiento, timeout, rewind/seek y `finishCurrentLap`.
- **UI/juego:** menú inicial con blueprints y progreso, modal de controles, barra de tiempo interactiva (scrub/seek), pausa, rebobinado continuo, reinicio de vuelta/nivel, overlays de victoria/derrota con foco gestionado, toggle de música. `FutureMechanicsLegend` existe como componente pero no está montado en `App` actualmente.
- **Persistencia local trivial:** progreso completado (`paradoxloop_completed_v1`) y preferencia de música (`holdforme_music_enabled_v1`) en `localStorage`.

## Comandos
- Instalar: `npm install --legacy-peer-deps`
- Desarrollo: `npm run dev` → http://localhost:3000
- Build: `npm run build`
- Typecheck/lint: `npm run lint` (o `npm run typecheck`, `tsc --noEmit`)
- Tests: `npm test` / `node --test`
- Preview: `npm run preview`

## Convenciones
- Idioma: código, nombres y comentarios en inglés; interfaz, textos de juego, documentación y mensajes visibles en español.
- Módulos ES con `import`/`export`; sin flags ocultos: el estado relevante se deriva de posiciones/frames.
- `sim.ts` no depende de React ni del DOM. Mantener la simulación determinista (mismo estado + misma entrada ⇒ mismo resultado).
- Colisiones/reglas base: círculo-AABB (paredes/puertas), círculo-cápsula (rastro), círculo-círculo (fantasmas/jugador), distancia punto-segmento (láser/segmentos), distancia centro-centro (placas/meta/interruptores con margen).
- Números base: canvas 960×400, loop 20 s, 60 Hz (1200 ticks + frame inicial = 1201 frames por vuelta), jugador r=12, velocidad 220 px/s (≈3.6667 px/tick), meta r=24, `TRAIL_HALF_WIDTH=12` (ancho total 24), muestreo de rastro cada 4 frames, `SPAWN_SAFE_RADIUS=44`, umbral placa `plate.r + 4`, `LASER_BEAM_HALF_WIDTH=5`, `SWITCH_ACTIVATION_MARGIN=4`, `MIN_SUPPORTED_LAPS=1`, `MAX_SUPPORTED_LAPS=6`.
- Controles implementados: mover con WASD/Flechas, `Espacio` termina la vuelta actual (si hay vueltas restantes), `Enter`/`NumpadEnter` pausa/reanuda, mantener `R` rebobina, `Supr` reinicia el nivel, `Escape` cierra overlays/modales cuando aplica.

## Límites
- Alcance cerrado por spec: no agregues features fuera de la especificación aprobada sin pasar por SDD.
- Sin backend, cuentas, red ni telemetría en runtime.
- `localStorage` solo para datos locales triviales (p. ej. progreso/preferencias); nunca credenciales, tokens ni datos personales en el repo.
- No agregues dependencias sin necesidad justificada y aprobación explícita.
- Una tarea a la vez; si una tarea toca más de ~5 archivos o supera ~40 min, dividila.
- No refactorices módulos ajenos a la tarea activa ni borres trabajo sin confirmar.
- Ante ambigüedad de diseño o requisito faltante: preguntá, no inventes.
- No modifiques `AGENTS.md`, `docs/constitution.md` ni `PARADOX_LOOP_DISENO.md` sin pedido/aprobación; `MEMORY.md` se actualiza al cerrar cada tarea/fase.

## Reglas y Gobierno SDD
- Lee `docs/constitution.md` y la spec activa/relevante (`specs/NNN-*/`) antes de tocar código o redactar artefactos.
- La spec manda: si algo no está en la spec, no se implementa. Si falta una decisión, se detiene y se pregunta.
- Flujo multiagente: `coordinator` orquesta, `planner` redacta `spec.md`/`plan.md`/`tasks.md`/`handoff.md` en `specs/`, `tester` revisa y valida. **No hay agente `programmer`**: la implementación la realiza Google AI Studio a partir de la spec aprobada.
- Al iniciar una sesión o tarea, lee `MEMORY.md`. Al terminar, actualiza `MEMORY.md` y asegura tests en verde.
