# Plan 005 — Pulido visual y UI

Contrato técnico para implementación por **Google AI Studio** a partir de `specs/005-pulido-visual-ui/spec.md`. La spec fue **aprobada explícitamente por el usuario** con D-005-1..D-005-6 y **veredicto final de `@tester`: APROBADO** tras la revalidación de D-005-6. **La spec manda:** no implementar nada fuera de ella. Este plan no modifica `spec.md` ni código fuente.

## 1. Contexto y objetivo

- Realizar un **rediseño artístico integral de la presentación** de Hold For Me: sustituir por completo la paleta y el lenguaje visual (fondo, superficies, bordes, muros, texto, estados, tokens de forma, jerarquía tipográfica, tratamientos de render y overlays) en menú, vista de juego, selector, reglas, victoria, derrota y pausa.
- El rediseño es **exclusivamente de presentación**: no cambia reglas, niveles, geometría, parámetros ni `src/game/sim.ts`. Se conservan los seis identificadores de vuelta no cíclicos `V1`–`V6`, la precedencia de estados de Spec 002 y los umbrales de contraste.
- El `hint` deja de estar ausente en la vista de juego y pasa a mostrarse **bajo demanda** mediante un control secundario «Ver pista», sin estado nuevo en la simulación ni persistencia.
- Se persigue **WCAG 2.2 AA con verificación manual** (4,5:1 texto normal, 3:1 texto grande/UI, foco 2 px, controles 32 px, teclado en timeline), sin herramientas ni dependencias de auditoría.
- Se mantienen las fuentes ya declaradas en `index.html` (JetBrains Mono, Outfit, Plus Jakarta Sans); no se introducen fuentes, recursos ni dependencias nuevas.

**Estado real observado (DEP-005-6, verificado en este plan):** `src/game/levels.ts` define `CANVAS_H = 600` y solo 4 niveles (`maxLaps` 1–4); `src/game/colors.ts` tiene `COLORS.laps` de 4 colores y `getLapColor` usa `%`; `src/components/TitleMenu.tsx` hardcodea `[0,1,2,3]` y el texto «4 niveles · Elegí por dónde empezar»; `App.tsx` y `TitleMenu.tsx` muestran «Start»; `LevelDef.hint` existe en los datos pero **no se muestra** en la UI; la barra superior de `App.tsx` renderiza un botón por nivel mediante `LEVELS.map`; `render.ts` expone geometría láser efectiva (`blockedByLap`) pero no hay `laserSegment`, láser móvil, interruptores ni secuencia global de Spec 002. `TimelineBar` ya tiene `role="slider"` y ARIA pero no maneja `ArrowLeft`, y `App.tsx` intercepta las flechas globalmente.

**Regla de oro ante esta desviación:** trabajar sobre los **contratos aprobados** (960×400, 10 niveles, `maxLaps` 1–6, seis vueltas) sin ajustar la spec por silencio, sin ampliar alcance para «completar» Specs 001–004 y sin inventar comportamiento. Cada desviación se registra con evidencia y se escala antes de dar por cerrada la spec.

## 2. Supuestos y dependencias

- **DEP-005-1 (Spec 001):** canvas 960×400, N1–N4 rediseñados, 10 niveles soportados, `maxLaps` 1–6, seis identificadores no cíclicos, validación O1. No implementar aquí.
- **DEP-005-2 (Spec 002):** `laserSegment`, láser móvil A↔B, interruptores y secuencia global, estado observable (`actual/esperado`, error/reinicio), precedencia D5/F9 y feedback D6. **No se implementan en Spec 005**: solo se muestra lo que la simulación exponga; si un estado de Spec 002 no está expuesto, se documenta y escala (RF-11), nunca se infiere.
- **DEP-005-3 (Specs 003–004):** campaña N1–N10 y N10 como cierre con 6 vueltas. Si no está presente, documentar y escalar (DEP-005-6 / CL-10); no crear niveles.
- **DEP-005-4:** `src/game/sim.ts` permanece puro y determinista. «Ver pista» es estado exclusivo de UI.
- **DEP-005-5:** se conservan stack, dependencias y las tres fuentes ya declaradas en `index.html`; no se agrega nada externo.
- **DEP-005-6:** la spec se escribe contra los contratos aprobados aunque el repo esté desalineado. La verificación del estado real es la **T1** y su resultado condiciona el reporte final.

## 3. Archivos a leer (obligatorio)

- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`, `specs/005-pulido-visual-ui/spec.md`, `specs/005-pulido-visual-ui/plan.md`, `specs/005-pulido-visual-ui/tasks.md`, `specs/005-pulido-visual-ui/handoff.md`.
- Referencia de formato: `specs/004-niveles-8-10/plan.md`, `tasks.md`, `handoff.md`.
- Código: `src/game/colors.ts`, `src/game/render.ts`, `src/game/levels.ts`, `src/game/sim.ts`, `src/game/sim.test.ts`, `src/App.tsx`, `src/components/TitleMenu.tsx`, `src/components/LevelSelectorModal.tsx`, `src/components/TimelineBar.tsx`, `src/index.css`, `index.html`, `src/game/audio.ts` (solo lectura).

## 4. Archivos a modificar y archivos que NO debe tocar

**Modificar (alcance esperado):**
- `src/game/colors.ts`: pasa a ser el **único módulo de tokens** (paleta completa + tokens de forma + etiquetas de vuelta). Conserva las exportaciones `COLORS` y `getLapColor` para no romper consumidores.
- `src/game/render.ts`: consume tokens para todos los elementos del mundo; doble codificación de estados; sin recálculo de reglas.
- `src/App.tsx`: estilos con tokens, barra superior derivada, HUD jerárquico, control «Ver pista», overlays con foco, ajuste de teclado para no interferir con la timeline.
- `src/components/TitleMenu.tsx`: paleta/tokens, una sola acción primaria «Comenzar», sin `[0,1,2,3]` ni «4 niveles».
- `src/components/LevelSelectorModal.tsx`: tokens, selector derivado, gestión de foco/Escape.
- `src/components/TimelineBar.tsx`: tokens, etiquetas `V1`–`Vn`, teclado con `ArrowLeft` dentro del historial.
- `src/index.css`: variables de rol tipográfico y estados de foco y `prefers-reduced-motion`, reutilizando las fuentes ya declaradas.

**NO tocar:**
- `src/game/sim.ts`, `src/game/sim.test.ts` (Spec 005 no cambia reglas; si un test falla, se reporta como desviación, no se ajusta la simulación), `src/game/levels.ts`, `src/game/audio.ts`, `index.html`.
- `specs/**`, `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`, `MEMORY.md` (salvo actualización de gobierno fuera de esta implementación).
- `package.json`, lockfiles, configs, CI, dependencias, backend, red, telemetría, secretos.

## 5. Contratos, tipos y constantes a preservar

- `src/game/sim.ts` puro y determinista: sin DOM, Canvas, `window`, React, timers, aleatoriedad ni I/O. Mismo estado + entrada ⇒ mismo resultado.
- Constantes: `TICK_HZ = 60`, `LOOP_SECONDS = 20`, `FRAMES_PER_LAP = 1200` ticks (**1201 muestras por vuelta**, índices 0..1200), `PLAYER_RADIUS = 12`, `PLAYER_SPEED = 220` px/s, `STEP_DISTANCE = 220/60`, `TRAIL_HALF_WIDTH = 12`, `TRAIL_SAMPLE_INTERVAL = 4`, `SPAWN_SAFE_RADIUS = 44`, `LASER_BEAM_HALF_WIDTH = 5`, `DEATH_SLOWMO_FRAMES = 24`.
- Reglas derivadas: placa presionada si `dist <= plate.r + 4`; meta si `dist <= player.r + goal.r`; timeout solo al agotar la última vuelta; `rewindStep`/`seekToFrame` truncan el futuro y solo permiten el historial grabado; `finishCurrentLap` fija la posición hasta el cierre de la vuelta.
- Tipos a conservar: `SimState`, `Frame`, `InputState`, `DeathCause`, `GhostEntity`, `ActiveLaserSegment`, `DerivedWorld` (`level`, `ghosts`, `pressedPlates`, `openDoors`, `lasers`, `won`), `RenderOptions` (`showFuturePreview`, `isRewinding`, `isPaused`), `LevelDef` (incluye `hint`), `Rect`, `Plate`, `Door`, `Laser`.
- Precedencia D5/F9 de Spec 002 (energía > deshabilitado por secuencia > bloqueado por fantasma/rastro > activo) **no se redefine ni se implementa aquí**; se muestra solo lo expuesto por `deriveWorld`.
- Canvas lógico aprobado 960×400; valor real 960×600 se reporta como desviación, no se corrige silenciosamente.

## 6. Decisiones aprobadas y alternativa descartada

| Decisión | Elegida | Alternativa descartada | Impacto en RF |
|---|---|---|---|
| **D-005-1** Alcance | **B) Rediseño artístico integral** de todas las superficies | A) Pulido conservador/ajustes puntuales que conservaran el tratamiento anterior | RF-1, RF-4, RF-10–RF-18, CL-11; sigue prohibido tocar reglas, niveles, geometría y `sim.ts` |
| **D-005-2** Paleta | **B) Sustituir la paleta completa** (fondo, superficies, muros, bordes, texto, estados y vueltas) | A) Cambiar solo los colores de vuelta manteniendo el resto | RF-1, RF-2, RF-5, RF-10, RNF-2, CL-1, CL-3; se conservan 6 vueltas no cíclicas `V1`–`V6`, precedencia D5/F9 y umbrales |
| **D-005-3** Accesibilidad | **A) WCAG 2.2 AA con verificación manual** (4,5:1 / 3:1, foco 2 px, 32 px, teclado, tabla documentada) | Auditoría automatizada con herramienta/dependencia nueva y criterios sin umbral medible | RF-5, RF-6, RF-7, RF-16, RF-20; sin dependencias ni herramientas nuevas |
| **D-005-4** `hint` | **C) Botón «Ver pista»** bajo demanda | A) `hint` siempre visible en el HUD (y cualquier muestra sin acción del jugador) | RF-4, RF-14, RF-19, CL-6, CL-7; secundario, español, sin estado ni persistencia nuevos |
| **D-005-5** Tipografía | **A) Mantener las fuentes ya declaradas en `index.html`** | Incorporar familias, archivos de fuente o recursos externos nuevos | RF-3, RNF-3, RNF-5, DEP-005-5; no tocar `index.html` |
| **D-005-6** Teclado timeline | **A) Solo `ArrowLeft` retrocede 1 frame**; `ArrowRight` ignorado | B) Modificar `sim.ts` para permitir avance dentro del historial | RF-16, CL-7, RNF-2; `rewindStep`/`seekToFrame` truncan el futuro y `sim.ts` queda sin cambios |

## 7. Enfoque e implementación (algoritmo / pseudocódigo)

### 7.1 Módulo único de tokens y tipografía (RF-1, RF-2, RF-3)

- `src/game/colors.ts` declara **una sola vez** cada rol: `color` (`bg`, `bgGrid`, `surface`, `surfaceAlt`, `border`, `wall`, `wallEdge`, `text`, `textMuted`, estados: `plateOn/Off`, `doorOpen/Closed`, `laserActive/Inactive/Blocked`, `switchPending/On/Error`, `goal`, `present`, `rewind`), `shape` (`radiusSm`, `radiusMd`, `strokeThin`, `strokeThick`, `gap`, `opacity*`), `LAP_COLORS` (6 entradas distintas) y `LAP_LABELS = ['V1'…'V6']`.
- `getLapColor(i)` indexa **directamente** `LAP_COLORS[i]`; **sin operador `%` y sin fallback cíclico**. Validar `i` entero en 0..5; si llega fuera de rango, fallar de forma visible y reportarlo como desviación, nunca disfrazarlo con módulo:

```ts
function getLapColor(i: number): string {
  if (!Number.isInteger(i) || i < 0 || i >= LAP_COLORS.length) {
    throw new Error(`Invalid lap index: ${i}`); // presentación: reportar, no normalizar
  }
  return LAP_COLORS[i];
}
```

- `src/index.css`: declarar variables de rol (`--type-title`, `--type-body`, `--type-numeric`) reutilizando `--font-display`, `--font-sans`, `--font-mono` ya presentes; aplicar `font-variant-numeric: tabular-nums` a vuelta, tiempo y `actual/esperado`. **`index.html` no se modifica**: conservar las tres fuentes y sus `preconnect` actuales; no `@font-face`, `link` ni descarga nueva.
- Los seis colores de vuelta se eligen dentro de la nueva paleta con contraste ≥3:1 como indicadores sobre superficie; si un tono no llega, se ajusta el **tono**, nunca el umbral.

### 7.2 Render del mundo (RF-1, RF-2, RF-5, RF-10–RF-13)

- `renderGame(ctx, state, options)` mantiene su firma y el orden de capas vigente (fondo, cuadrícula, cableado, rastros, spawn, placas, meta, puertas, muros, láseres, vista anticipada, fantasmas, jugador, indicador de rewind/pausa). Sustituir **todos** los literales de color/radio/grosor por tokens del módulo único (se exceptúan derivados con opacidad documentados en el token).
- Doble codificación por estado: placa (color + icono/etiqueta de estado), puerta (trazo punteado/etiqueta «ABIERTA»/«CERRADA»), láser activo/inactivo/bloqueado (núcleo/punteado/anillo de impacto + etiqueta corta), segmento y interruptor (forma + `actual/esperado` o etiqueta de error) **solo si el estado está expuesto** por `deriveWorld`; si no lo está, RF-11: no inferir, documentar y escalar.
- La geometría dibujada del láser es la efectiva en `t`: usar `laser.x1/y1/x2/y2` y `blockedByLap` tal como los entrega `deriveWorld`, incluido el truncamiento por bloqueo. No recalcular, no dibujar trayectorias futuras como presentes, no tocar `sim.ts`.
- Fantasmas y rastro: badge `V{lapIndex+1}` con el color de vuelta en fantasmas y una marca `Vn` en cada rastro; presente, rastro sólido, vista anticipada (`Futuro +2s`) y rewind/pausa usan tratamientos distintos y tokens; no tapar HUD ni información esencial. Etiquetas dibujadas en canvas cumplen RF-5.
- Progreso `actual/esperado` y error/reinicio: solo si la simulación expone ese estado; sin temporizadores ni persistencia nuevos.

### 7.3 HUD, «Ver pista» y overlays (RF-4, RF-14, RF-17–RF-19)

- Barra superior: marca, accesos esenciales (Inicio/Niveles/Reglas) y **una sola acción primaria**; eliminar `LEVELS.map` de botones de nivel y el rótulo «Start» → «Comenzar». El selector es el único acceso completo. `TitleMenu`: «Comenzar» primaria, «Ver reglas y controles» secundaria; reemplazar `[0,1,2,3]` y «4 niveles» por derivación desde `LEVELS.length`.
- HUD: `Nivel <id>: <nombre>`, subtítulo, badge `V{n}` con color de vuelta, `Vuelta n / maxLaps` y `x.x s / 20.0 s` en dígitos tabulares, con la jerarquía de tokens. **Sin `hint` antes de pulsar el botón.**
- «Ver pista» (RF-19) en la vista de juego, secundario, etiqueta exacta «Ver pista», foco 2 px, ≥32×32 px, separación 8 px:

```ts
const [showHint, setShowHint] = useState(false);
// al cambiar de nivel: setShowHint(false)
<button aria-expanded={showHint} aria-controls="level-hint">Ver pista</button>
{showHint && <p id="level-hint">{level.hint}</p>}
```

  `showHint` vive solo en `App`: **no** agregar banderas a `SimState`, **no** escribir `localStorage`, **no** revelar la solución completa (se muestra el `hint` ya declarado en `levels.ts`, sin editar su texto para convertirlo en solución).
- Overlays: `LevelSelectorModal` (niveles/reglas) y tarjetas de victoria/derrota en `App` reciben foco al abrir, lo confinan mientras estén abiertos, cierran con `Escape` y devuelven el foco al control que los abrió; una sola acción primaria por overlay (derrota: «Reiniciar vuelta»; victoria: «Siguiente nivel»/«Volver a jugar desde el 1»; cierre: secundario). **Nota de implementación:** no crear un modal de pausa nuevo; la pausa conserva su indicador actual en canvas (`RenderOptions.isPaused`) y el foco permanece en «Pausar/Reanudar». Si se considera imprescindible otro overlay, se reporta como desviación en lugar de inventarlo.

### 7.4 Selector y timeline (RF-2, RF-7, RF-15, RF-16)

- Selector, contadores y navegación derivados de `LEVELS.length`; sin literales «4 niveles», `[0,1,2,3]` ni botones de nivel en la barra superior. Si la colección no llega a 10, **no crear niveles**: documentar DEP-005-6 y escalar.
- `TimelineBar`: un segmento por vuelta desde `maxLaps` (1–6), etiqueta `V1`–`Vn`, playhead visible, `role="slider"`, `aria-valuemin/max/now`, `tabIndex=0`, foco 2 px. `handlePointerSeek` ya limita al historial: conservar ese límite.
- Teclado en el slider: **solo `ArrowLeft` retrocede 1 frame** dentro del historial grabado; cualquier otra tecla, **incluido `ArrowRight`, se ignora**. Tope inferior 0; nunca usar `maxLaps * FRAMES_PER_LAP` como tope:

```ts
function onSliderKeyDown(e, state, onSeek) {
  if (e.key !== 'ArrowLeft') return; // sin avance: ArrowRight y demás, ignoradas
  e.preventDefault();
  e.stopPropagation();

  // SimState.t es el frame DENTRO de la vuelta (sim.ts:31-45), no un frame global.
  // El playhead global se calcula igual que en TimelineBar:21.
  const playhead = state.lap * FRAMES_PER_LAP + state.t;

  // Retroceso de 1 frame con tope inferior 0, dentro del historial grabado.
  const target = Math.max(0, playhead - 1);

  // Conversión global -> (lap, frameInLap), igual que handlePointerSeek (TimelineBar:31-33).
  const targetLap = Math.min(state.lap, Math.floor(target / FRAMES_PER_LAP));
  const targetT = target - targetLap * FRAMES_PER_LAP;
  onSeek(targetLap, targetT);
}
```

  En el `onKeyDown` global de `App`, si el objetivo está dentro del elemento `role="slider"`, retornar antes de setear `keysRef` o hacer `preventDefault`, para que `ArrowLeft` no mueva al jugador. Con el foco fuera, el movimiento con flechas/WASD sigue igual.

  **Por qué no hay `ArrowRight` (D-005-6, aprobada):** en `src/game/sim.ts`, `seekToFrame` (637–664) clampa `targetLap <= state.lap` y, para la vuelta actual, `targetT <= state.t`, truncando `current`/`laps`; `rewindStep` (582–635) descarta los frames futuros. El playhead siempre coincide con el final del historial grabado, así que no existe destino válido hacia adelante. Ofrecer avance exigiría modificar `sim.ts`, fuera de alcance (RNF-2); RF-16 y CL-7 ya no lo requieren. No agregar un cursor paralelo ni un `delta = +1` clampado que aparente avanzar sin hacerlo.

### 7.5 Accesibilidad y movimiento reducido (RF-5–RF-9)

- Foco visible de **2 px** con contraste ≥3:1 en todos los controles (`:focus-visible`), incluidos canvas-slider y «Ver pista».
- Controles ≥**32×32 px** (o 32 px de alto con ancho suficiente para la etiqueta) y separación ≥**8 px**; etiquetas en español sin recorte.
- `prefers-reduced-motion: reduce`: desactivar transiciones/animaciones decorativas de UI; **no** tocar el loop a 60 Hz, el playhead ni el render de fantasmas.
- A 1366×768, escala 100%: canvas, HUD, controles y timeline visibles sin scroll vertical de página; overlays extensos pueden tener scroll interno sin ocultar acciones principales.
- Tabla de contraste manual (RF-5), sin dependencias: para cada par texto/fondo y UI/fondo, calcular luminancia relativa con `L = 0.2126R + 0.7152G + 0.0722B` sobre canales linealizados y `ratio = (Lmax + 0.05) / (Lmin + 0.05)`; documentar pares: texto normal/superficie, texto atenuado/superficie, etiquetas canvas/su fondo, indicadores de estado y los 6 colores de vuelta sobre superficie.

### 7.6 Verificación

- `node --test` en verde (no se esperan cambios en `sim.test.ts`); `npm run lint` y `npm run build` ejecutados y reportados.
- Revisión visible documentada a 1366×768 con checklist por pantalla (menú, juego, selector, reglas, victoria, derrota, pausa), recorrido por teclado (incluidas timeline y «Ver pista»), tabla de contraste y comprobación de `prefers-reduced-motion`.

## 8. Estrategia de tests y evidencia

- **Automatizados:** `node --test` (o `node --test src/game/sim.test.ts`). Spec 005 no cambia lógica, por lo que no se agregan tests de simulación; la evidencia nueva es de presentación. Un fallo existente se reporta como desviación, no se arregla `sim.ts`.
- **Manual documentada en el reporte:**
  1. Tabla de pares con ratios calculados y resultado AA (RF-5).
  2. Checklist por pantalla de RF-1/CL-11: paleta y tokens nuevos en las 7 superficies, sin tratamiento anterior.
  3. Recorrido por teclado: foco 2 px, Tab confinado en overlays, `Escape` cierra y devuelve foco, «Ver pista» con `Enter`/`Espacio`, `ArrowLeft` en timeline sin mover al jugador y `ArrowRight` sin producir avance.
  4. Medición en viewport de referencia: controles ≥32 px, separación ≥8 px, sin scroll vertical (RF-7/RF-9).
  5. Búsquedas de evidencia: sin `%` sobre paleta de vueltas, sin `[0,1,2,3]`, sin «4 niveles», sin «Start», sin banderas nuevas en `sim.ts`, sin escrituras nuevas en `localStorage`, sin entradas nuevas en fuentes.
  6. Desviaciones DEP-005-6 con evidencia (archivo/línea y consecuencia RF).

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Repo desalineado (600, 4 niveles, 4 colores módulo 4, «Start», `hint` oculto, sin Spec 002) | RF parcialmente no demostrable | T1 documenta y escala; no ajustar la spec por silencio, no implementar 001–004 aquí, no inventar estados |
| Un color de vuelta no alcanza 3:1 sobre la nueva superficie | RF-5 / RF-2 | Ajustar el tono dentro de la paleta sustituida; nunca bajar el umbral ni reintroducir ciclo de 4 |
| Foco/teclado en timeline (`ArrowLeft`) contra las flechas globales de `App` | RF-16 / CL-7 | Apagar el handler global cuando el foco esté en el slider; verificar recorrido documentado (retroceso y sin avance con `ArrowRight`) |
| «Ver pista» se convierte en estado de simulación o persistencia | RNF-1 / RNF-6 / RF-19 | `useState` local en `App`, `aria-expanded`, sin `SimState` ni `localStorage`; buscar diff |
| Overlays sin focus trap | RF-17 | Aplicar patrón único de apertura/confinamiento/cierre/devolución de foco; checklist por overlay |
| El rediseño se convierte en cambio de reglas/geometría | Fuera de alcance | Prohibición explícita: `sim.ts`, `levels.ts` y constantes numéricas intactos; revisión de diff |
| Dependencias o fuentes nuevas | Constitución / RF-3 / RNF-3 | Solo tokens, CSS y Canvas; `index.html` sin cambios; diff de `package.json`/lockfile vacío |

## 10. Tabla RF → evidencia

| RF | Evidencia esperada |
|---|---|
| RF-1 | Diff de `colors.ts` con módulo único de tokens; búsqueda sin hexadecimales/radios/grosores duplicados por rol; checklist por pantalla de las 7 superficies |
| RF-2 | `LAP_COLORS` con 6 entradas distintas, búsqueda sin `%`, badges `V1`–`V6` en fantasmas/rastro/timeline/selector/HUD; revisión N1 y N10 o DEP-005-6 |
| RF-3 | Escala de roles en `index.css`, `tabular-nums` en vuelta/tiempo/`actual-esperado`; `index.html` sin diff; fuentes existentes |
| RF-4 | Una sola acción primaria por pantalla; «Comenzar» en vez de «Start»; forma+etiqueta además del color |
| RF-5 | Tabla de contraste con ratios (4,5:1 / 3:1), incluidas etiquetas canvas y los 6 colores de vuelta; sin dependencia nueva |
| RF-6 | Recorrido por teclado documentado con indicador de 2 px en menú, juego, timeline, «Ver pista» y overlays |
| RF-7 | Medición de controles ≥32×32 px y separación ≥8 px a 1366×768, etiquetas sin recorte |
| RF-8 | Revisión con `prefers-reduced-motion: reduce`; `node --test` en verde; loop/playhead/fantasmas sin cambios |
| RF-9 | Captura o descripción reproducible a 1366×768, escala 100%, sin scroll vertical de página |
| RF-10 | Escena con doble codificación de estados observables; precedencia D5/F9 sin redefinir; estados no expuestos → RF-11 |
| RF-11 | Diff de `render.ts` contra `deriveWorld`; geometría efectiva y truncamiento dibujados; `sim.ts` sin cambios; bloqueos documentados |
| RF-12 | Revisión en vuelta 1 y 6: presente/fantasma/rastro/Futuro +2s, rewind y pausa sin tapar info esencial |
| RF-13 | Progreso `actual/esperado` y error/reinicio derivados del estado; sin temporizadores ni persistencia; si no expuesto, DEP |
| RF-14 | HUD en español con formato tabular y jerarquía; ausencia de `hint` antes de «Ver pista» |
| RF-15 | Sin literales «4 niveles», `[0,1,2,3]` ni botones de nivel en la barra superior; derivación desde `LEVELS.length`; si no hay 10, DEP |
| RF-16 | Timeline 1–6, `role="slider"` + ARIA, playhead, `ArrowLeft` retrocede 1 frame dentro del historial y `ArrowRight` no produce avance; `node --test` en verde para rewind/seek |
| RF-17 | Recorrido por teclado por overlay: foco inicial, confinamiento, `Escape`, devolución de foco; checklist por pantalla |
| RF-18 | Tarjeta de cierre en N10 con flujos existentes y nueva identidad; si N10 ausente, DEP-005-6 |
| RF-19 | Revisión antes/después de «Ver pista»; `aria-expanded`; foco/tamaño; sin banderas en `sim.ts` ni `localStorage` nuevo |
| RF-20 | Salidas de `node --test`, `npm run lint`, `npm run build`; checklist visible + tabla de contraste adjuntos al reporte |

## 11. Comandos de verificación

- `node --test` (o `node --test src/game/sim.test.ts`).
- `npm run lint`.
- `npm run build`.
- `npm run dev` para revisión visible en desktop 1366×768, escala 100%.

## 12. No se implementa en esta spec

- Mecánicas, reglas, niveles, rebalanceo ni resolubilidad (Specs 002–004 quedan fuera).
- Cambios de geometría/parámetros: ni `CANVAS_H`, ni muros, placas, puertas, láseres, radios, `maxLaps` ni datos de niveles.
- Cambios en `src/game/sim.ts` por motivos visuales ni estado nuevo en `SimState`.
- Rediseño del audio/SFX (se mantienen los efectos vigentes).
- Diseño táctil/móvil ni soporte de viewport móvil.
- Dependencias, fuentes, imágenes, ilustraciones, temas seleccionables, backend, cuentas, red, telemetría, secretos ni persistencia no trivial.
- Modificación de documentos de gobierno, specs, configs, CI o lockfiles.

## 13. Criterio de cierre del plan

- Rediseño integral aplicado en las 7 superficies con un único módulo de tokens, seis vueltas no cíclicas y doble codificación, sin tocar simulación, niveles ni geometría.
- «Ver pista» implementado como control secundario de UI, sin estado ni persistencia nuevos; `hint` ausente hasta su activación.
- Accesibilidad WCAG 2.2 AA verificada manualmente con tabla de contraste, foco 2 px, controles 32 px, teclado en timeline (solo `ArrowLeft`) y `prefers-reduced-motion`.
- `node --test` en verde, `npm run lint` y `npm run build` reportados, checklist visible a 1366×768 documentada.
- Toda desviación DEP-005-6 registrada con evidencia y escalada antes de dar por cerrada la spec; ninguna ambigüedad resuelta inventando comportamiento.
