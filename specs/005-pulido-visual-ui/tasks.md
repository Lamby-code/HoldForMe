# Tasks 005 — Pulido visual y UI

Spec aprobada: `specs/005-pulido-visual-ui/spec.md` (D-005-1 a D-005-6 aprobadas; `@tester` aprobó la base sin cambios y D-005-6 fue aprobada por el usuario). Plan: `specs/005-pulido-visual-ui/plan.md`. Orden de dependencia T1→T9. **Rediseño de presentación únicamente**: sin reglas, niveles, geometría, `sim.ts`, audio, móvil ni dependencias/fuentes nuevas. **Implementación por Google AI Studio.** No se modifica `spec.md`.

- [ ] **T1. Verificar el estado real del repo y documentar/escalar DEP-005-6 antes de tocar nada.** RF-15, RF-18, RF-20, CL-10; DEP-005-1..DEP-005-6
  - Archivos: solo lectura de `src/game/levels.ts`, `src/game/colors.ts`, `src/game/sim.ts`, `src/game/sim.test.ts`, `src/game/render.ts`, `src/App.tsx`, `src/components/*`, `src/index.css`, `index.html`. Sin modificaciones de código.
  - Dependencias: ninguna.
  - Hecho cuando: se confirma con evidencia cada desviación —`CANVAS_H = 600` vs 960×400, 4 niveles vs 10, `maxLaps` 1–4 vs 1–6, `COLORS.laps` de 4 con `getLapColor` usando `%`, `[0,1,2,3]` y «4 niveles» en `TitleMenu`, «Start» en `App`/`TitleMenu`, `hint` en datos pero no visible, botones de nivel en la barra superior, ausencia de `laserSegment`/láser móvil/interruptores de Spec 002, timeline sin soporte de `ArrowLeft` y `App` interceptando las flechas—. Se decide y registra qué RF son demostrables con la base real y cuáles quedan condicionados a la desviación. **No se ajusta la spec por silencio, no se amplía alcance para implementar 001–004, no se inventa comportamiento.**
  - Evidencia: notas de verificación con archivo/línea por desviación en el reporte + salida de `node --test` inicial (resultado registrado). Cualquier bloqueo se marca como escalado, no como cierre válido.

- [ ] **T2. Consolidar el módulo único de tokens (paleta completa, tokens de forma y 6 vueltas no cíclicas) y la escala tipográfica.** RF-1, RF-2, RF-3, RF-5, CL-1
  - Archivos: `src/game/colors.ts`, `src/index.css` (2 archivos). `index.html` solo lectura: conservar las fuentes ya declaradas.
  - Dependencias: T1.
  - Hecho cuando: `src/game/colors.ts` declara una sola vez la paleta completa (fondo, cuadrícula, superficies, bordes, muros, texto principal/atenuado, estados y vueltas) y los tokens de forma (radios, grosores, separación, opacidades); `LAP_COLORS` tiene **6 entradas distintas** y `LAP_LABELS = ['V1'…'V6']`; `getLapColor(i)` indexa directamente sin `%` y valida `i` en 0..5 sin fallback cíclico; se conservan las exportaciones `COLORS` y `getLapColor`. `src/index.css` declara roles tipográficos reutilizando las tres fuentes existentes y aplica `tabular-nums` a vuelta/tiempo/progreso. Sin `index.html` modificado, sin `@font-face`, `link`, fuentes ni recursos nuevos.
  - Evidencia: diff de ambos archivos; búsqueda de `%` sobre la paleta de vueltas (sin resultados); búsqueda de definiciones de fuentes (sin entradas nuevas); `index.html` sin diff.

- [ ] **T3. Aplicar los tokens al render del mundo con doble codificación de estados observables.** RF-1, RF-2, RF-5, RF-10, RF-11, RF-12, RF-13, CL-3, CL-4
  - Archivos: `src/game/render.ts` (1 archivo).
  - Dependencias: T2.
  - Hecho cuando: `renderGame` mantiene firma y capas vigentes pero usa solo tokens del módulo único para fondo, cuadrícula, cableado, rastros, spawn, placas, meta, puertas, muros, láseres, vista anticipada, fantasmas, jugador e indicadores; cada estado expuesto lleva color **y** forma/etiqueta; los láseres se dibujan con la geometría efectiva y el truncamiento de `deriveWorld` (`blockedByLap`), sin recalcular reglas; fantasmas y rastro muestran `V1`–`V6`; presente, rastro, `Futuro +2s`, rewind y pausa son distinguibles sin tapar info esencial. Si un estado de Spec 002 no está expuesto, no se infiere: se documenta y escala (RF-11). `sim.ts` queda sin diff.
  - Evidencia: diff de `render.ts` y de `sim.ts` (vacío); revisión visible de una escena que exponga cada estado; registro de estados no expuestos si aplica.

- [ ] **T4. Rediseñar barra superior, HUD y incorporar el control secundario «Ver pista» (incluye overlays de victoria/derrota).** RF-3, RF-4, RF-14, RF-17, RF-19, CL-6
  - Archivos: `src/App.tsx` (1 archivo).
  - Dependencias: T2, T3.
  - Hecho cuando: la barra superior conserva marca e Inicio/Niveles/Reglas con **una sola acción primaria**, sin `LEVELS.map` de botones de nivel y con «Comenzar» en lugar de «Start»; el HUD muestra `Nivel <id>: <nombre>`, subtítulo, badge `V{n}`, `Vuelta n / maxLaps` y `x.x s / 20.0 s` tabulares con la jerarquía nueva y **sin `hint`**; el botón «Ver pista» está en la vista de juego, es secundario, lleva etiqueta exacta, `aria-expanded`, foco 2 px y ≥32×32 px, y muestra el `hint` ya existente sin revelar la solución; `showHint` es `useState` local, se reinicia al cambiar de nivel y **no** entra en `SimState` ni en `localStorage`. Las tarjetas de victoria/derrota usan los tokens y el patrón de foco (abrir, confinar, `Escape`, devolver foco). No se crea un modal de pausa nuevo.
  - Evidencia: diff de `App.tsx`; revisión visible antes/después de «Ver pista»; búsqueda de banderas nuevas en `sim.ts` y de escrituras nuevas en `localStorage` (sin resultados); recorrido por teclado documentado.

- [ ] **T5. Rediseñar menú, selector y modal con tokens, derivación de niveles y foco.** RF-1, RF-4, RF-15, RF-17, RF-18, CL-2, CL-5, CL-11
  - Archivos: `src/components/TitleMenu.tsx`, `src/components/LevelSelectorModal.tsx` (2 archivos).
  - Dependencias: T2, T4.
  - Hecho cuando: `TitleMenu` tiene «Comenzar» como única acción primaria («Ver reglas y controles» secundaria) y ya no contiene `[0,1,2,3]` ni el texto «4 niveles»; el contador y la lista se derivan de `LEVELS.length`; el selector y el modal de reglas usan los tokens, derivan niveles y badges `V1`–`Vn`, y aplican foco inicial, confinamiento de `Tab`, cierre con `Escape` y devolución de foco con una sola acción primaria. Si la colección no tiene 10 niveles o no hay N10, se documenta DEP-005-6 y se escala: **no se crean niveles ni se edita `levels.ts`**.
  - Evidencia: diff de ambos componentes; búsqueda de `[0,1,2,3]`, «4 niveles» y «Start» (sin resultados); checklist de foco por modal; registro de desviación si la colección no llega a 10.

- [ ] **T6. Hacer la línea de tiempo dinámica y operable por teclado sin interferir con el movimiento.** RF-2, RF-7, RF-16, CL-1, CL-7
  - Archivos: `src/components/TimelineBar.tsx`, `src/App.tsx` (2 archivos).
  - Dependencias: T2, T5.
  - Hecho cuando: la timeline se genera desde `maxLaps` (1–6) con un segmento por vuelta etiquetado `V1`–`Vn`, playhead visible, `role="slider"`, `aria-valuemin/max/now`, `tabIndex=0` y foco 2 px; el teclado parte del playhead global real (`state.lap * FRAMES_PER_LAP + state.t`, porque `state.t` es por vuelta), **solo `ArrowLeft` retrocede 1 frame** con tope inferior 0 dentro del historial grabado (nunca `maxLaps * FRAMES_PER_LAP`), convierte global→`(lap, frameInLap)` antes de `onSeek` como `handlePointerSeek`, y llama a `preventDefault`/`stopPropagation`; cualquier otra tecla, **incluido `ArrowRight`, se ignora sin producir avance**; el handler global de `App` retorna antes de setear `keysRef` cuando el foco está en el slider, de modo que `ArrowLeft` no mueva al jugador; con el foco fuera, WASD/flechas siguen igual; los contratos de `rewindStep`/`seekToFrame` siguen vigentes. Sin cursor paralelo ni `delta = +1` que simule avance: `sim.ts` queda sin cambios (D-005-6 / RNF-2).
  - Evidencia: diff de ambos archivos; recorrido por teclado documentado en N1 y N10 (o desviación registrada si no hay N10) que verifique el retroceso de 1 frame con `ArrowLeft` y que `ArrowRight` no produce avance; `node --test` en verde para contratos de rewind/seek.

- [ ] **T7. Consolidar accesibilidad: foco, tamaños, movimiento reducido y viewport sin scroll.** RF-5, RF-6, RF-7, RF-8, RF-9, RNF-7, CL-7, CL-8, CL-9
  - Archivos: `src/index.css`, `src/App.tsx`, `src/components/TimelineBar.tsx` (3 archivos; corregir en `TitleMenu`/`LevelSelectorModal` solo si T5 dejó algo pendiente, sin superar 5 archivos).
  - Dependencias: T4, T5, T6.
  - Hecho cuando: todos los controles interactivos muestran indicador de foco de 2 px con contraste ≥3:1 y son operables por teclado; miden ≥32×32 px (o 32 px de alto con ancho suficiente) con separación ≥8 px y etiquetas en español sin recorte; con `prefers-reduced-motion: reduce` desaparecen transiciones/animaciones decorativas sin alterar el loop, el playhead ni los fantasmas; a 1366×768 y escala 100% no hay scroll vertical de página y los overlays extensos conservan sus acciones principales visibles.
  - Evidencia: capturas o descripción reproducible del recorrido por teclado y de la medición en viewport; revisión con la preferencia de movimiento reducido activada; `node --test` en verde.

- [ ] **T8. Producir la tabla de contraste manual, el checklist por pantalla y las búsquedas de evidencia.** RF-1, RF-2, RF-5, RF-19, RF-20, CL-1, CL-3, CL-11, RNF-1..RNF-7
  - Archivos: ninguno de código; solo el reporte de verificación (lectura de todos los archivos modificados).
  - Dependencias: T2, T3, T4, T5, T6, T7.
  - Hecho cuando: la tabla documenta cada par texto/fondo e indicador/UI con su ratio calculado (4,5:1 / 3:1), incluidas etiquetas dibujadas en canvas y los 6 colores de vuelta; el checklist cubre menú, juego, selector, reglas, victoria, derrota y pausa con token nuevo en cada una; las búsquedas confirman ausencia de `%` sobre la paleta, `[0,1,2,3]`, «4 niveles», «Start», banderas nuevas en `sim.ts`, escrituras nuevas en `localStorage`, dependencias/fuentes nuevas y diff en `levels.ts`/`sim.ts`/`index.html`.
  - Evidencia: tabla de contraste + checklist + salidas de búsqueda adjuntas al reporte; desviaciones DEP-005-6 listadas una a una con su RF afectado.

- [ ] **T9. Verificación final y reporte para handoff.** RF-20 y RF-1..RF-19, RNF-1..RNF-7
  - Archivos: todos los modificados/creados (revisión final; sin cambios nuevos de código salvo correcciones menores ya cubiertas por T2–T7).
  - Dependencias: T1–T8.
  - Hecho cuando: `node --test` en verde; `npm run lint` y `npm run build` ejecutados y reportados; revisión visible a 1366×768 completada; el reporte incluye archivos cambiados, resultados de comandos, tabla de contraste, checklist por pantalla, recorrido por teclado, cobertura RF→evidencia, decisiones D-005-1..6 aplicadas, desviaciones DEP-005-6 escaladas y confirmación de restricciones (`sim.ts` puro, sin niveles/geometría/reglas, sin audio/móvil/deps/fuentes/red/secretos/persistencia nueva). Ninguna ambigüedad se resuelve inventando comportamiento: se reporta.
  - Evidencia: salidas de `node --test`, `npm run lint`, `npm run build`; notas de verificación visible; mapeo RF→evidencia y lista de bloqueos/riesgos.
