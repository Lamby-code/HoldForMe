# Hold For Me

Puzzle 2D top-down: cada vuelta de 20 segundos graba un fantasma sólido que repite exactamente tus movimientos. Coreografiá tus versiones pasadas para abrirte camino.

> **El presente es blando. El pasado es duro.**

## Estado actual

- Campaña de **10 niveles** en un canvas lógico de **960×400**, con topes de vueltas `1 / 2 / 3 / 3 / 2 / 2 / 3 / 3 / 3 / 3`.
- Simulación determinista a **60 Hz**: cada vuelta dura 20 s (1201 frames incluido el frame inicial).
- Mecánicas: placas y puertas, láseres estáticos (con `poweredByPlates`), láseres móviles A↔B, segmentos de láser habilitables/deshabilitables, secuencias globales de interruptores ordenados (con reset por error), bloqueo de haces por fantasmas, rastro sólido, aplastamiento y timeout.
- UI: menú con blueprint de cada nivel y progreso, reanudación automática en el primer nivel sin completar, barra de tiempo con seek, pausa, rebobinado continuo, overlays de victoria/derrota con foco gestionado, música procedural y SFX con toggle.
- Persistencia local: progreso (`paradoxloop_completed_v1`) y preferencia de música (`holdforme_music_enabled_v1`). Sin backend, cuentas, red ni telemetría.

## Controles

| Acción | Control |
|---|---|
| Caminar | `WASD` o Flechas |
| Terminar la vuelta actual | `Espacio` |
| Pausar / Reanudar | `Enter` (o `NumpadEnter`) |
| Rebobinar continuamente | Mantener `R` |
| Saltar a un punto ya grabado | Clic o arrastrar en la línea de tiempo |
| Reiniciar nivel | `Supr` |
| Cerrar modales o overlays | `Esc` |

También hay botones para **Inicio**, **Controles**, **Música**, navegar entre niveles y, al morir, **Reiniciar vuelta** / **Reiniciar nivel**.

## Desarrollo local

Requisitos: Node.js 24 (versión usada por CI) y npm.

```bash
npm install --legacy-peer-deps
npm run dev
```

App de desarrollo: http://localhost:3000

No hacen falta variables de entorno ni claves de API para jugar: el juego es estático y no usa los paquetes de IA del `package.json` en runtime.

## Estructura

- `src/main.tsx` / `index.html`: entrada y montaje.
- `src/App.tsx`: UI, input y loop principal a timestep fijo.
- `src/game/sim.ts`: simulación pura y determinista (sin DOM, Canvas ni `window`).
- `src/game/levels.ts`: campaña, constantes y validación de definiciones (O1).
- `src/game/render.ts`: dibujo en Canvas 2D.
- `src/game/colors.ts`, `src/game/audio.ts`: tema visual y audio procedural.
- `src/game/sim.test.ts`: tests de la simulación y la campaña.
- `specs/001`–`specs/005`: artefactos SDD. `public/assets/aistudio/`: evidencias generadas en AI Studio.

## Verificación

```bash
npm test          # alias de node --test
npm run lint      # tsc --noEmit
npm run build
```

La suite actual tiene 30 tests y pasa en verde. `npm run typecheck` es un alias de `npm run lint`.

## Publicar en GitHub Pages

El proyecto compila a una webapp estática pura con rutas relativas (`base: './'` en `vite.config.ts`). **No** debe apuntar a la raíz del repositorio con *"Deploy from a branch"*, porque el navegador no puede ejecutar `/src/main.tsx` sin compilar.

El workflow `.github/workflows/deploy.yml` corre en pushes a `main`, `master` o `Dev`, y también de forma manual desde la pestaña **Actions**. Instala dependencias con Node 24, ejecuta `node --test`, `npm run lint` y `npm run build`, y publica `dist/`.

1. Subí el repositorio a GitHub.
2. En tu repositorio, entrá a **Settings → Pages**.
3. En **Build and deployment → Source**, elegí **GitHub Actions** (en lugar de *Deploy from a branch*).
4. Hacé push a `main` (o dispará el workflow manualmente) para publicar el juego.

Para probar el build localmente:

```bash
npm install --legacy-peer-deps
npm run build
npm run preview
```

## Gobierno del proyecto

- Lee `AGENTS.md`, `docs/constitution.md` y `MEMORY.md`.
- Los requisitos viven en `specs/NNN-nombre/` (`spec.md`, `plan.md`, `tasks.md`, `handoff.md`). Estado actual: `001` y `005` aprobadas; `002`–`004` en borrador revisado.
- Los topes de vueltas vigentes son los de `src/game/levels.ts`; los specs `003`/`004` conservan el contrato original y no fueron reescritos.
- Flujo SDD: `coordinator` orquesta, `planner` redacta los artefactos y `tester` valida; la implementación la realiza Google AI Studio a partir de specs aprobadas. No hay agente `programmer`.
