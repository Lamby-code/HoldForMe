# Plan 002 — Mecánicas jugables: láser móvil e interruptores ordenados

Contrato técnico para implementación por **Google AI Studio** a partir de `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md` (Estado: borrador revisado con decisiones D1–D8, aprobado explícitamente por el usuario). **La spec manda:** no implementar nada fuera de ella.

## 1. Contexto y objetivo
- Implementar la **lógica jugable completa** de: (1) **láseres móviles lineales** A↔B ida y vuelta, deterministas por `t` con `periodo` y `desfase`; (2) **interruptores ordenados** con secuencia global, activación válida por proximidad/área (transición fuera→dentro) solo del jugador activo, numeración/progreso, error/reinicio, y control de **`laserSegment`** para abrir paso.
- Integrar comportamiento en `src/game/sim.ts` (puro/determinista) y feedback/representación real en `src/game/render.ts` y UI (`src/App.tsx`, componentes/HUD/leyenda), manteniendo rewind/seek, grabación, fantasmas/rastro, placas, puertas y contratos vigentes.
- **No** crear ni balancear niveles de campaña N5–N10. **No** modificar el listado/contenido de campaña en `src/game/levels.ts` para fixtures (D7).

## 2. Supuestos y dependencias (base Spec 001)
- **Supuesto declarado:** Spec 001 implementada/vigente como base (canvas lógico 960×400, rediseño N1–N4, soporte 10 niveles/6 vueltas, extensibilidad de datos/tipos y UI neutra con rechazo O1, contratos RNF-2 Spec 001).
- **Si el repo difiere:** el implementador debe documentar la desviación en el reporte y aplicar solo las alineaciones mínimas necesarias para cumplir Spec 002 (p. ej. constantes 960×400, tipos base/validación O1, puntos de integración UI), sin ampliar alcance ni rediseñar N1–N4/campaña salvo corrección estrictamente necesaria y aprobada. No inventar comportamiento.
- **Estado de partida a verificar:** `src/game/sim.ts`, `src/game/levels.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, componentes UI y `src/game/sim.test.ts` pueden estar pre/post 001; contratos de Spec 002 prevalecen para las mecánicas aquí definidas.

## 3. Archivos a leer (obligatorio)
- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`
- `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md` (contrato), `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/plan.md`, `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/tasks.md`
- Referencia: `specs/001-base-ui-y-ajuste-nivel-4/spec.md`, `plan.md`, `handoff.md`
- Código: `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/game/sim.test.ts`, `src/App.tsx`, `src/components/*` (especialmente HUD/timeline/leyenda/overlays si existen)

## 4. Archivos a modificar/crear (alcance esperado)
- `src/game/levels.ts` (o módulos de tipos/datos en `src/game/` coherentes con arquitectura): tipos/extensiones para láser móvil, `laserSegment`, interruptores/secuencia global; validación O1 de datos/relaciones (punto determinista y detectable). **Sin** añadir niveles de campaña/fixtures.
- `src/game/sim.ts`: lógica determinista de movimiento por `t`, evaluación de `laserSegment`, activación fuera→dentro solo jugador activo, máquina de secuencia global, precedencia y colisiones/bloqueos, estado derivado/reproducible compatible con rewind/seek.
- `src/game/render.ts`: representación de láseres móviles y estados visuales (energía/segmento/bloqueo/activo) y elementos de interruptores/segmentos en canvas coherentes con simulación.
- `src/App.tsx` y/o componentes UI (`src/components/*`): feedback mínimo obligatorio D6 en español (progreso `actual/esperado`, mensaje breve error/reinicio, estado observable interruptores/segmentos) y leyenda/HUD minimalista.
- `src/game/sim.test.ts` (y/u otros archivos de test aprobados, p. ej. `src/game/sim.mechanics.test.ts` si se justifica): fixtures/constructores de niveles **en tests**, casos RF-20 y O1.
- Archivos que **no** se deben tocar: `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`, `src/game/levels.ts` (contenido de campaña/N1–N4), configs/deps/CI/lockfiles salvo necesidad estrictamente justificada y aprobada (no prevista).

## 5. Contratos a preservar
- `sim.ts` puro y determinista: sin DOM, Canvas, `window`, `React`, timers, aleatoriedad, I/O. Mismo estado/datos + misma entrada ⇒ mismo resultado.
- Tiempo/física/reglas vigentes (salvo lo explícito de esta spec): canvas 960×400, loop 20 s, 60 Hz, 1201 frames por vuelta, jugador r=12, 220 px/s, meta r=24, rastro 24 px, muestreo cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada, fantasmas/rastro sólidos, colisiones y reglas de láser aplicables.
- Rewind/seek/finish/grabación: comportamiento coherente con contratos existentes; el estado de mecánicas nuevas debe ser reproducible al mover el playhead (truncar futuro / reevaluar hasta `t`).
- Idioma: código/nombres/comentarios/tests en inglés; UI/textos/docs visibles en español. Sin backend/red/telemetría/secretos/deps nuevas.

## 6. Decisiones de diseño fijadas (D1–D8)

| ID | Decisión | Contrato de implementación |
|---|---|---|
| D1 | `laserSegment` entidad propia | `id` único, `laserId` (Laser estático o móvil), geometría/alcance determinista (propia o relativa al láser), `initialEnabled`, controlable por secuencia vía `segmentId`. Interruptores referencian segmentos por `segmentId`. |
| D2 | Efecto y persistencia | Completar secuencia correcta ⇒ **deshabilita** segmentos bloqueantes objetivo (abrir paso). Persiste **mientras la secuencia siga correcta**. Error de orden ⇒ reinicio de secuencia y segmentos a **estado inicial** (`initialEnabled`). |
| D3 | Activación | Proximidad/área tipo placa, determinista por `t`, umbral explícito y testeable. **Solo jugador activo** (fantasmas no). Evento: transición **fuera→dentro** (en `t` cumple área y en evaluación anterior no) ⇒ exactamente un intento por entrada. |
| D4 | Temporalidad/rewind | Estado de interruptores/secuencia/segmentos **derivado y reproducible** del historial/eventos hasta `t`; recalculado/ajustado en **rewind/seek** a eventos hasta ese `t`. Sin estados fantasma, sin timers no deterministas, sin persistencia oculta entre vueltas salvo lo grabado/replayable. |
| D5/F9 | Precedencia e interacciones | (1) `poweredByPlates` no cumplido ⇒ inactivo total por energía. (2) Deshabilitado por secuencia/segmento ⇒ no dañino. (3) Bloqueado por fantasma/rastro (reglas vigentes) ⇒ truncado. (4) Activo/dañino. Láser móvil bloqueable como estático y puede tener segmentos controlados; movimiento y habilitación se combinan por precedencia. |
| D6 | Feedback UI mínimo (ES) | Obligatorio: **(a)** progreso/orden `actual/esperado`, **(b)** mensaje breve visible ante error/reinicio, **(c)** estado observable de interruptores/segmentos (habilitado/deshabilitado, activo/inactivo o equivalente). Minimalista, coherente con estilo/paleta. |
| D7 | Fixtures | Solo datos/constructores en tests (`src/game/sim.test.ts` u otros tests aprobados). **No** modificar `src/game/levels.ts` campaña. |
| D8 | Periodo ping-pong | `P = periodo` frames del ciclo completo **A→B→A** (`P` finito, entero `> 0`). `q = ((t + desfase) mod P + P) mod P`. `u = 1 - |(2q / P) - 1|`, `u∈[0,1]`, `u=0` en A, `u=1` en B. Geometría móvil = interpolación lineal A + (B-A)*u (o aplicación equivalente a extremos del haz), determinista para todo `t`. |

## 7. Enfoque de implementación

### 7.1 Datos, tipos y validación (`levels.ts` / tipos en `src/game/`)
- Extender modelo de nivel (compatible con existentes) con:
  - Láser móvil: campos para `A{x,y}`, `B{x,y}`, `periodo`, `desfase` (además de `id`, `poweredByPlates` opcional y campos vigentes). Decisión de forma: reutilizar/extender `Laser` o introducir tipo discriminado; debe quedar inequívoco y validable (O1).
  - `laserSegment`: colección en `LevelDef` (o estructura equivalente) con `id`, `laserId`, geometría/alcance, `initialEnabled`.
  - Interruptores ordenados y secuencia global: definición inequívoca del orden (1..N), área/umbral y `segmentId[]`/control asociado.
- Implementar/ubicar validación O1 determinista y detectable (lanzar error o resultado explícito) invocable en carga/definición/tests: `periodo<=0`, valores no finitos/no válidos, extremos inválidos, referencias inexistentes, ids duplicados relevantes, secuencia inconsistente, áreas inválidas, relaciones incompletas, etc. (RF-4). No normalización silenciosa.
- Preservar N1–N4 y niveles existentes sin cambios de contenido de campaña.

### 7.2 Simulación (`sim.ts`)
- **Movimiento (RF-6, RF-7, D8):** función pura para geometría efectiva de láser móvil en `t` según fórmula. Si `laserSegment` es relativo a láser móvil, evaluar sus extremos/alcance efectivos en `t`.
- **Activaciones (RF-11, D3):** detectar transición fuera→dentro para jugador activo contra área de cada interruptor. Debe ser determinista y no disparar por permanencia. Sugerencia de enfoque compatible con D4: derivar presencia/activaciones desde posiciones registradas por frame (`current`/`laps`) hasta `t` (o mantener estado por frame reproducible) para que rewind/seek y replay sean coherentes; el historial efectivo al hacer seek debe corresponder a eventos hasta ese `t` (RF-15, F10).
- **Secuencia global (RF-12–RF-14, D2):** estado `actual/esperado` y señal de error/reinicio. Avance solo con activación válida del siguiente esperado; error ⇒ reinicio y restauración de `initialEnabled` de segmentos controlados; completar ⇒ deshabilitar segmentos bloqueantes objetivo y mantener mientras siga correcta. La evaluación debe ser función determinista del historial/eventos hasta `t`.
- **Precedencia y daño (RF-8–RF-10, D5/F9):** para cada láser/segmento en `t`: (1) energía `poweredByPlates` (inactivo total si no cumple), (2) habilitación por secuencia/`initialEnabled` tras historial, (3) bloqueo por fantasma/rastro (truncado) aplicando reglas vigentes de bloqueo de láser a geometría estática o móvil efectiva, (4) activo/dañino. Colisión jugador ⇒ muerte por láser según contrato existente.
- **Derivación de mundo/estado expuesto:** extender `deriveWorld` (o estructuras derivadas) y/o estado de simulación según sea necesario para que render/UI lean estados declarados/derivados (posición móvil, activo/inactivo, truncado, secuencia actual/esperado, error/reinicio, estados de interruptores/segmentos) sin romper API existente de forma innecesaria.
- **Rewind/seek:** garantizar que truncar/posicionar en `t` produce el mismo estado derivado que un replay determinista hasta `t` (D4). No introducir dependencias temporales externas.

### 7.3 Render (`render.ts`)
- Dibujar láseres móviles en su posición efectiva por `t` (o estado derivado pasado desde sim/app) con distinción visual observable de estados aplicables (apagado por energía, deshabilitado por secuencia, bloqueado/truncado, activo).
- Dibujar interruptores y, cuando aporte claridad, segmentos/indicadores de estado en canvas de forma coherente con simulación y minimalista. Respetar paleta/estilo existente (`colors.ts`).
- No mostrar indicadores específicos en niveles sin estas mecánicas (RF-19).

### 7.4 UI (`App.tsx`, `components/`)
- Mostrar feedback mínimo obligatorio D6 en español, minimalista: (a) `actual/esperado`, (b) mensaje breve visible en error/reinicio, (c) estado observable de interruptores/segmentos. Ubicación sugerida: HUD/leyenda/panel existente o extensión coherente (sin sobrecargar).
- Asegurar legibilidad/accesibilidad razonable (RNF, RF-18). No dependencias nuevas.

### 7.5 Tests y verificación
- **Fixtures D7:** construir niveles/datos en tests (helpers/builders/factories en archivos de test) cubriendo casos mínimos: láser móvil ping-pong, `poweredByPlates`, `laserSegment` en láser estático y móvil, secuencia global con éxito/error/reintento, activación solo jugador y transición entrada, rewind/seek.
- **Cobertura mínima RF-20:** determinismo de posición por `t` (D8), precedencia RF-8, activación jugador-only + fuera→dentro, avance, error + restauración `initialEnabled`, persistencia mientras correcta, efecto sobre segmentos, coherencia rewind/seek.
- **O1:** casos inválidos representativos rechazan de forma determinista y detectable.
- **Regresión:** tests existentes de N1–N4 y contratos generales deben seguir en verde (ajustar solo si dependencia de Spec 001/base lo requiere y está documentado).

## 8. Riesgos y mitigaciones
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Base Spec 001 no totalmente presente en repo | Desajuste de tipos/UI/canvas | Declarar supuestos, alinear mínimamente lo requerido por Spec 002, documentar en reporte |
| D4: derivación por historial compleja con seek/rewind | Estados inconsistentes | Preferir estado derivado puro desde frames/eventos hasta `t`; tests específicos de seek antes/después de activaciones y errores |
| Ambigüedad de geometría de `laserSegment` (propia vs relativa) | Implementaciones divergentes | Fijar contrato concreto en tipos/validación y tests; si surge ambigüedad no cubierta, escalar antes de implementar |
| Regresión en rendimiento/60 Hz | UX degradada | Cálculos O(n) acotados por entidades/frames evaluados, evitar recomputaciones no acotadas por frame |
| Cambios de API en `deriveWorld`/estado rompen UI | Build/runtime roto | Mantener compatibilidad o actualizar usos en mismo cambio atómico por tarea, verificar `npm run build` |

## 9. Tabla RF → evidencia

| RF | Evidencia esperada |
|---|---|
| RF-1 Láser móvil datos | Tipos/definiciones en `src/game/levels.ts` (o tipos) + revisión diff |
| RF-2 `laserSegment` entidad propia | Tipos/campos mínimos (`id`, `laserId`, geometría/alcance, `initialEnabled`) + tests/fixtures |
| RF-3 Interruptores y secuencia global | Tipos/datos (orden, área, `segmentId`) + tests |
| RF-4 Validación O1 | Helper/validación determinista + tests de rechazo (periodo, refs, ids, secuencia, área, etc.) |
| RF-5 Compatibilidad y fixtures en tests | Sin cambios en campaña `levels.ts`; fixtures solo en tests |
| RF-6 Movimiento determinista D8 | Función pura + tests de `u(t)`/posición en `t`, bordes y `desfase` |
| RF-7 Segmento en láser móvil | Test con segmento sobre láser móvil combinando movimiento+estado |
| RF-8 Precedencia D5/F9 | Tests: energía off, deshabilitado por secuencia, bloqueado por fantasma, activo |
| RF-9 Móvil bloqueable + segmentos | Test: láser móvil truncado por fantasma y con segmento controlado |
| RF-10 Colisión letal | Test de muerte por láser activo tras precedencia |
| RF-11 Activación fuera→dentro, solo jugador | Tests: entrada genera intento, permanencia no, fantasma no activa |
| RF-12 Avance válido | Test de progreso `actual/esperado` |
| RF-13 Error/reinicio + restore | Test de error restaura `initialEnabled` y reinicia secuencia |
| RF-14 Compleción y persistencia | Test: deshabilita bloqueantes y persiste mientras correcta |
| RF-15 Derivado + rewind/seek D4/F10 | Tests seek/rewind antes/después de eventos, sin estados fantasma |
| RF-16 Render láser móvil/estados | Revisión visual en dev/build + coherencia con estado simulado |
| RF-17 Feedback UI mínimo D6 (ES) | Revisión visual: `actual/esperado`, mensaje error/reinicio, estado observable |
| RF-18 Claridad/accesibilidad | Revisión visual/manual, sin sobrecarga |
| RF-19 Sin mecánicas ⇒ sin indicadores extra | Revisión en N1–N4/existente |
| RF-20 Cobertura tests simulación | `node --test` en verde con casos mínimos listados |
| RF-21 No campaña modificada | Diff de `levels.ts` sin fixtures/campaña nueva |
| RNF-1..7 | Diff `sim.ts` puro, `node --test`, `npm run lint`, `npm run build`, revisión de deps/red |

## 10. Comandos de verificación
- `node --test src/game/sim.test.ts` (o `node --test` si hay más suites relevantes)
- `npm run lint`
- `npm run build`
- Verificación UI manual: `npm run dev` y comprobar en nivel/fixture de prueba (vía tests/datos en tests o mecanismo temporal no commiteado en campaña, según corresponda al flujo) feedback D6, movimiento visual y coherencia con rewind/seek; confirmar que N1–N4 no muestran regresiones.

## 11. Criterio de cierre del plan
Implementación completa y alineada con Spec 002, tests en verde, lint/build reportados, sin regresiones observables en campaña existente, y reporte de AI Studio con archivos, comandos, evidencias RF y desviaciones/supuestos documentados. Si aparece ambigüedad no cubierta, detener e informar (no inventar).