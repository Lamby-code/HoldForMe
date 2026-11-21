# Plan 001 — Base UI y ajuste Nivel 4

Contrato técnico para implementación por **Google AI Studio** a partir de `specs/001-base-ui-y-ajuste-nivel-4/spec.md` (Estado: aprobada).

## Contexto y estado actual
- Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Canvas 2D. Canvas lógico actual 960×600 (`CANVAS_W=960`, `CANVAS_H=600` en `src/game/levels.ts`), 4 niveles (Nivel 4 con `maxLaps: 4`), paleta de 4 vueltas cíclica (`src/game/colors.ts`), UI/components con supuestos de 4 niveles/vueltas (`TitleMenu` usa `[0,1,2,3]` y texto "4 niveles"; `App.tsx` fija contenedor/aspecto del canvas; `LevelSelectorModal` y `TimelineBar` escalan parcialmente pero dependen de datos/colores actuales).
- `sim.ts` es puro y determinista (sin DOM/Canvas/React). Tests actuales en `src/game/sim.test.ts` (8) incluyen secuencias de solución/fallo para Nivel 4 en 4 vueltas y coordenadas dependientes de 960×600.
- Objetivo aprobado: canvas 960×400, rediseño niveles 1–4 (Nivel 4 a 3 vueltas conservando conjunto/rol/relaciones A,B,D1,D2,L1 reubicados), base UI para 10 niveles y 6 vueltas, feedback/HUD/pulido/accesibilidad desktop, sin scroll vertical en viewport 1366×768, extensibilidad de datos/tipos + UI neutra metadatos/leyenda (sin lógica jugable nueva en `sim.ts`), validación O1 (rechazo explícito) de datos inválidos.

## Archivos a leer (obligatorio antes de cambiar)
- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`, `specs/001-base-ui-y-ajuste-nivel-4/spec.md`
- `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/game/sim.test.ts`
- `src/App.tsx`, `src/components/TitleMenu.tsx`, `src/components/TimelineBar.tsx`, `src/components/LevelSelectorModal.tsx`
- `index.html` / estilos globales si afectan layout/scroll (solo si es necesario)

## Archivos a modificar (alcance esperado)
- `src/game/levels.ts` — canvas 960×400, perímetro, rediseño niveles 1–4, tipos/extensibilidad de datos y validación O1 (definición/carga).
- `src/game/sim.ts` — solo adaptaciones mínimas necesarias para contratos existentes y/o validación de definiciones si se decide allí; **sin implementar lógica jugable** de láseres móviles ni interruptores ordenados.
- `src/game/sim.test.ts` — actualizar tests a nuevo canvas/diseños y nueva solución/fallos de Nivel 4 en 3 vueltas; añadir/verificar casos de validación O1 si corresponde.
- `src/game/colors.ts` — 6 colores de vuelta explícitos no cíclicos y `getLapColor` por índice directo (1–6).
- `src/game/render.ts` — ajuste a 960×400 si aplica, feedback visual consistente y uso de paleta/indicadores dinámicos; sin simular mecánicas futuras en canvas.
- `src/App.tsx` — layout/HUD/controles/timeline/overlays sin scroll en 1366×768, textos español, hints/HUD, leyenda/metadatos neutros si aplica, navegación escalable.
- `src/components/TitleMenu.tsx`, `src/components/TimelineBar.tsx`, `src/components/LevelSelectorModal.tsx` — escalabilidad 10 niveles/6 vueltas, dinámico (sin hardcode 4), pulido visual/accesibilidad básica.

## Archivos que no se deben tocar
- `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md` (salvo pedido/aprobación explícita; no requerido por esta spec).
- Configuración de dependencias/stack (`package.json`, lockfiles, `vite.config.*`, `tsconfig*`, workflows) salvo necesidad estrictamente justificada y aprobada (no prevista).
- Módulos ajenos al alcance (`src/game/audio.ts`, assets, otros) salvo ajuste menor imprescindible y trazable.

## Contratos y constantes a preservar (salvo cambio explícito)
- `sim.ts` puro y determinista: sin DOM, Canvas, `window`, React.
- Tiempo: 20 s por vuelta, 60 Hz, **1201 frames por vuelta** (`FRAMES_PER_LAP`/contrato vigente), `STEP_DISTANCE` coherente con 220 px/s.
- Jugador/meta/rastro: jugador r=12, velocidad 220 px/s, meta r=24, rastro 24 px, muestreo rastro cada 4 frames.
- Reglas: umbral placa `plate.r + 4`, spawn safe 44 px, sin colisión de fantasmas/rastro en spawn, timeout solo en última vuelta agotada, estado derivado de posiciones, colisiones según convención actual.
- Canvas: **cambia** a `CANVAS_W = 960`, `CANVAS_H = 400` y perímetro/muros adaptados.
- Niveles 1–4 rediseñados y resolubles en 960×400; Nivel 4 `maxLaps: 3` conservando conjunto/rol/relaciones de A,B,D1,D2,L1 (posiciones reubicadas).
- Sin backend/cuentas/red/telemetría/secretos/deps nuevas; progreso local trivial permitido si ya existe.

## Decisiones (y alternativas descartadas)
| Decisión | Elección | Alternativa descartada | Motivo |
|---|---|---|---|
| Alto de canvas | 960×400 | Mantener 600 o escalar solo CSS | Requisito aprobado; debe ser lógico/simulado y permitir vista sin scroll |
| Rediseño niveles 1–4 | Rediseño completo para 400px + tests actualizados | Ajuste mínimo/no tocar 1–3 | Confirmado por usuario; necesario por geometría y resolubilidad |
| Nivel 4 | 3 vueltas, conserva conjunto/rol/relaciones A,B,D1,D2,L1 reubicados | Conservar posiciones literales 600px | Contradicción resuelta por cambio de alto; se preserva intención/elementos |
| Vueltas/colores | 6 identificadores explícitos no cíclicos | Reutilización cíclica de 4 | RF-14 aprobado para legibilidad hasta 6 |
| Datos inválidos | **O1 rechazo explícito** determinista y detectable | O2 normalización, O3 otra | Decisión confirmada |
| UI mecánicas futuras | **Metadatos/leyenda** en HUD/panel/leyenda | Dibujar/inferir comportamiento en canvas | UI neutra mínima confirmada; lógica diferida |
| Visibilidad desktop | Sin scroll vertical en viewport 1366×768 (≥768px alto, 100%) | Sin referencia concreta | Criterio confirmado para verificación |
| Lógica mecánicas nuevas | Diferida (sin implementación jugable en `sim.ts`) | Implementar movimiento/orden en esta spec | Alcance aprobado de base/extensibilidad |

## Enfoque por área (algoritmo/pseudocódigo)
### 1) Canvas y niveles (`levels.ts`)
- Definir `CANVAS_H = 400`; actualizar `PERIMETER_WALLS` usando `CANVAS_H` (top/bottom/side walls coherentes con `WALL_T`).
- Rediseñar niveles 1–4 para caber en 0..960×0..400 manteniendo intención:
  - N1: ruta alrededor de obstáculo hasta meta (1 vuelta).
  - N2: placa A abre D1, relevo con rastro/fantasma (2 vueltas).
  - N3: A->D1, B con A->D2, encadenado (3 vueltas).
  - N4: A, B, D1(A), D2(B), L1 poweredBy B bloqueable; `maxLaps: 3`. Conservar ids/relaciones/roles; reubicar para viabilidad en 400px.
- Actualizar `hint`/`subtitle` en español (minimalistas) coherentes con nuevas soluciones; Nivel 4 debe reflejar 3 vueltas.
- Añadir tipos/extensibilidad (datos, sin comportamiento sim): p. ej. `Laser`/nuevo tipo para láser móvil con extremos A↔B `{x1,y1,x2,y2}` o forma equivalente, `periodo` (frames), `desfase`, determinista por `t`, opcional `poweredByPlates`; tipos para interruptores ordenados con secuencia global, orden/número registrado por activación válida, reinicio por error, efecto previsto habilitar/deshabilitar segmentos de láser (referencias/ids). Mantener compatibilidad con niveles existentes.
- Validación O1: función/helper de validación (p. ej. `validateLevelDef` / `assertValidLevelDef`) invocada en punto definido (carga/export/arranque o tests) que lance/retorne error determinista y detectable ante `maxLaps < 1 || maxLaps > 6`, láser móvil `periodo <= 0` o no finito/desfase no finito o puntos iguales A=B, referencias inexistentes/incompletas de interruptores/segmentos/láseres. No normalizar silenciosamente.

### 2) Simulación (`sim.ts`)
- No cambiar contratos de tiempo/física/reglas salvo lo implícito por datos de nivel (geometrías vienen de `levels.ts`).
- **No** implementar movimiento de láser por periodo/desfase ni máquina de estados de interruptores ordenados. Si se añaden campos opcionales a tipos importados, asegurar que no afecten `deriveWorld`/`stepSim` actuales; ignorar extensiones futuras en runtime de esta fase.
- Opcional (solo si necesario para O1 en runtime): exponer/usar validación de nivel al crear estado o documentar que validación ocurre en carga/tests; preferir punto único y determinista.

### 3) Tests (`sim.test.ts`)
- Reescribir coordenadas/rutas/timings de tests de niveles 1–4 para canvas 960×400 y nuevas geometrías.
- Nivel 4: `maxLaps` esperado 3; nuevo test de resolución que cumpla V1–V3 (fantasma 1 sostiene A para habilitar D1 cuando se requiere; fantasma 2 usa A/D1 para lograr estado sobre B y/o bloqueo de L1 habilitando D2/corredor; vuelta 3 alcanza meta sin morir). Añadir/ajustar al menos un caso de fallo relevante coherente.
- Mantener tests de contratos generales (rewind/seek/finishCurrentLap/timeout) y niveles 1–3 en verde.
- Añadir tests de rechazo O1 para casos inválidos representativos (maxLaps fuera de rango, periodo<=0 o A=B en láser móvil, referencias inválidas) en el helper/punto de validación definido.
- **Riesgo bloqueante:** si no se logra secuencia resoluble para Nivel 4 en 3 vueltas conservando conjunto/rol/relaciones, documentar evidencia y detener cierre (ver RF-9).

### 4) UI/Render/Colores
- `colors.ts`: definir 6 colores explícitos para vueltas (ej. ampliar `laps` a 6 entradas distinguidas) y cambiar `getLapColor` para acceso directo por índice (sin `% 4`); mantener contraste/identidad.
- `render.ts`: ya usa `CANVAS_W/H` (ok al cambiar constante), grid/overlays deben adaptarse a 400px; mejorar feedback visual de placa/puerta/láser si es necesario para claridad (consistente con estado derivado). No dibujar mecánicas futuras simuladas en canvas.
- `App.tsx`: ajustar contenedor/canvas (quitar `aspect-[16/10]` rígido si impide 960×400 sin scroll; usar relación 960:400 o tamaño que quepa en 1366×768), compactar header/HUD/timeline/leyenda de controles y overlays para cumplir RF-19; textos en español; HUD/hints minimalistas; añadir leyenda/metadatos neutros solo si el nivel declara mecánicas futuras (mostrar tipo/parámetros clave/estado declarado en panel/leyenda, no en mundo).
- `TitleMenu.tsx`: quitar `[0,1,2,3]` hardcodeado y "4 niveles"; generar indicadores desde niveles/`maxLaps` o representación escalable; lista desde `LEVELS`.
- `TimelineBar.tsx`: ya usa `maxLaps`; asegurar legibilidad con 6 segmentos/colores.
- `LevelSelectorModal.tsx`: soportar más niveles (grid/scroll interno del modal si crece, pero juego base sin scroll de página); mantener progreso/selección.
- Accesibilidad básica: foco visible, `aria-label`/roles donde aplique, contraste legible, teclado existente funcional.

## Estrategia de tests y verificación
- **Simulación/contratos:** `node --test src/game/sim.test.ts` (o `node --test`).
- **Lint:** `npm run lint` (si el entorno tiene dependencias).
- **Build:** `npm run build` (si aplica).
- **UI manual (evidencia):** ejecutar `npm run dev`, abrir en viewport 1366×768 (escala 100%) y verificar: sin scroll vertical en vista de juego, canvas 960×400 correcto, niveles 1–4 jugables/resolubles, Nivel 4 en 3 vueltas, timeline/selector/colores para 6 vueltas, feedback placa/puerta/láser, hints/HUD en español, menús/overlays pulidos y accesibles por teclado/foco.

## Tabla RF → evidencia
| RF | Evidencia esperada |
|---|---|
| RF-1 canvas 960×400 | `levels.ts` (`CANVAS_W/H`, perímetro), render/canvas en UI, revisión visual |
| RF-2 maxLaps 1–6 | tipos/validación O1 + UI/timeline/colores soportan 6; tests/helpers |
| RF-3 hasta 10 niveles en UI | `TitleMenu`/`LevelSelectorModal`/`App` derivados de `LEVELS`, sin textos fijos "4" |
| RF-4 niveles 1–4 rediseñados y resolubles | `levels.ts` + tests de solución N1–N4 en `sim.test.ts` |
| RF-5 tests actualizados | `node --test src/game/sim.test.ts` en verde con nuevas secuencias |
| RF-6 contratos vigentes preservados | tests generales (rewind/seek/finish/timeout) + revisión `sim.ts` puro |
| RF-7 Nivel 4: 3 vueltas, A,B,D1,D2,L1 roles/relaciones | definición N4 en `levels.ts` + tests |
| RF-8 secuencia V1–V3 verificable | test de resolución N4 + test de fallo relevante; evidencia en reporte |
| RF-9 riesgo/bloqueo si no resoluble | reporte de implementación y, si aplica, nota en handoff/tareas; no cerrar spec |
| RF-10 datos láser móvil (A↔B, periodo, desfase, det. por t, opc. poweredByPlates) | tipos/definiciones en `levels.ts` + validación O1 |
| RF-11 datos interruptores ordenados (secuencia global, numeración, reinicio por error, habilitar/deshabilitar segmentos) | tipos/definiciones en `levels.ts` + validación O1 |
| RF-12 separación extensibilidad vs lógica | `sim.ts` sin lógica jugable nueva; revisión de diff |
| RF-13 carga/validación O1 + UI neutra metadatos/leyenda | helper/validación + tests O1 + UI muestra metadatos sin dibujar en canvas |
| RF-14 paleta/leyenda 6 vueltas no cíclica | `colors.ts`, `getLapColor`, render/componentes, revisión visual |
| RF-15 selector/navegación escalable | `TitleMenu`, `LevelSelectorModal`, `App` |
| RF-16 feedback placa/puerta/láser | render/UI consistente con `deriveWorld` |
| RF-17 HUD/hints minimalistas español (N1–4) | textos en `levels.ts`/UI, revisión visual |
| RF-18 pulido menús/overlays e indicadores dinámicos | componentes UI, sin `[0,1,2,3]` hardcode |
| RF-19 layout sin scroll 1366×768 | revisión visual/devtools viewport 1366×768 @100% |
| RF-20 accesibilidad/controles desktop | foco visible, labels/roles, teclado; revisión manual |
| RNF-1..RNF-6 | diff `sim.ts`, tests/lint/build, ausencia de deps/red/secretos |

## Notas para el implementador
- Resolver primero canvas+validación+datos/niveles+tests (base determinista), luego UI/layout/colores/accesibilidad.
- Si Nivel 4 en 3 vueltas no resulta viable con las relaciones requeridas, **no** inventar una solución cerrada: documentar evidencia (intentos/tests) y reportar bloqueo según RF-9.
- `TitleMenu.tsx` tiene hardcode `[0,1,2,3]` y texto "4 niveles": debe quedar dinámico.
- `App.tsx` usa `aspect-[16/10]` para 960×600; debe ajustarse a 960×400 y al criterio sin scroll.
- Mantener textos visibles en español y código en inglés. No agregar dependencias.
