# Plan 004 — Niveles 8–10

Contrato técnico para implementación por **Google AI Studio** a partir de `specs/004-niveles-8-10/spec.md` (Estado: borrador revisado con decisiones del usuario D-004-A a D-004-E, **aprobada**). **La spec manda:** no implementar nada fuera de ella.

## 1. Contexto y objetivo
- Diseñar e incorporar los niveles de campaña **8, 9 y 10** (ids 8–10) en canvas lógico **960×400**, completando la colección de **10 niveles**, con dificultad **media con progresión y cierre apropiado**, hints minimalistas en español (base editable), soluciones deterministas y verificables. Sin mecánicas nuevas.
- Progresión, mecánicas y complejidad confirmadas (D-004-A a D-004-E):
  - **N8 — "Cruce medido"** (`id: 8`, `maxLaps: 5`): profundiza la combinación introducida en N7 (láser móvil + interruptores/`laserSegment`) con apoyo por fantasmas. **2 interruptores** (secuencia global) y **1 `laserSegment`** bloqueante controlado, áreas no ambiguas. Base: muros, 1–2 placas, 1–2 puertas, 1 láser móvil A↔B, 1 láser estático (opcional `poweredByPlates` si aporta claridad), 2 interruptores, 1 segmento (en láser estático o móvil, `segmentId` explícito), uso de fantasmas/rastro. Precedencia D5/F9.
  - **N9 — "Paso a paso"** (`id: 9`, `maxLaps: 5`): incrementa coordinación respecto de N8 (sostener, ordenar, abrir, cruzar). **3 interruptores** y **1–2 `laserSegment`** controlados, áreas no ambiguas. Base: muros, 2 placas, 1–2 puertas, 1 láser móvil A↔B, 1 láser estático (energía/segmento según diseño, respetando D5), 3 interruptores, 1–2 segmentos (distribuidos en láser estático y/o móvil), fantasmas/rastro.
  - **N10 — "Última coordinación"** (`id: 10`, `maxLaps: 6`, **único nivel de 6 vueltas**, cierre de campaña): capstone integrador de mecánicas conocidas (placas, puertas, láseres estáticos y móviles, interruptores ordenados, `laserSegment`, bloqueos por fantasma/rastro), equilibrio timing/secuencia, sin mecánicas nuevas. **3 interruptores** y **2 `laserSegment`** controlados, áreas no ambiguas. **Composición base equilibrada:** muros, **2 placas, 2 puertas, 1 láser móvil A↔B, 1 láser estático, 3 interruptores, 2 segmentos** (distribución legible, p. ej. con `poweredByPlates` y/o control por segmento según diseño, respetando D5), fantasmas/rastro esenciales.
- **Secuencias esperadas V1..Vn (objetivos observables):** deben ser verificables por nivel; rutas/posiciones/timings concretos se fijan y validan en tests/trazas reproducibles durante la implementación (RF-10, RF-11, RF-12).
  - N8 (V1–V5): V1 estado base (placa/bloqueo/sostén); V2 progreso válido de secuencia o acceso sin error definitivo al cierre útil; V3 secuencia completa (2) y segmento deshabilitado coordinado con placas/puertas; V4 condición/ventana adicional frente a láser móvil; V5 meta sin morir con condiciones satisfechas.
  - N9 (V1–V5): V1 sostiene placa/condición base; V2 progreso parcial en orden o segunda condición de soporte/acceso; V3 secuencia completa (3) o estado combinado de 1–2 segmentos deshabilitados coordinado con placas/puertas; V4 bloqueo/sostén crítico frente a láser móvil o ventana/condición derivada; V5 meta sin morir.
  - N10 (V1–V6): V1 condición base persistente; V2 acceso intermedio y/o inicio de progreso correcto; V3 secuencia completa (3) con segmentos objetivo en estado requerido; V4 condición crítica mantenida (placa/puerta indirecta/bloqueo); V5 sincronización de cruce/ventana móvil o último soporte; V6 meta sin morir (cierre de campaña).
- **Fuera de alcance:** niveles más allá de N10, pulido visual/UI global (Spec 005) salvo ajustes mínimos estrictamente necesarios para operar/representar N8–N10, nuevas mecánicas, cambios de stack/deps, backend/red/telemetría/secretos/persistencia no trivial, arma/stretch.

## 2. Supuestos y dependencias
- **Specs 001–003 (contratos base asumidos):** 001 aporta canvas 960×400, N1–N4 rediseñados, soporte 10 niveles, `maxLaps` 1–6, paleta/identificadores dinámicos para 6 vueltas, selector/UI escalable, validación O1 base; 002 aporta mecánicas jugables D1–D8 (láser móvil D8, `laserSegment` D1, secuencia/activación/efecto D2–D3, estado derivado/rewind-seek D4, precedencia D5/F9, feedback UI D6 en español, validación O1); 003 aporta N5–N7 y progresión de campaña.
- **Validación de implementación de Spec 003 omitida por indicación del usuario:** las implementaciones de Specs 001–003 pueden no estar presentes o no validadas en el repo. El implementador debe **verificar el estado real** antes de añadir N8–N10 y documentarlo en el reporte.
- **Si el repo difiere de 001–003:** aplicar solo **alineaciones mínimas necesarias** para cumplir Spec 004 (p. ej. constantes 960×400, tipos/datos/validación O1, soporte de mecánicas D1–D8 y feedback D6 requeridos por N8–N10, soporte UI de `maxLaps`/selector para 10 niveles), sin ampliar alcance (no N nuevos distintos de 8–10, no pulido global, no rediseño de N1–N4 salvo corrección estrictamente necesaria y documentada). No inventar comportamiento ni normalizar silenciosamente datos inválidos.
- **Estado de partida observado (referencia, puede cambiar):** repo actual con 4 niveles y canvas 960×600 en `src/game/levels.ts` y tests orientados a N1–N4 (base pre-001/002/003). Tratar como dato a confirmar, no como contrato.
- **Ajuste fino (D-004-6, RF-12):** geometría, layout y parámetros numéricos (`A/B`, `periodo`, `desfase`, áreas, radios, posiciones, `initialEnabled`, etc.) ajustables en implementación con evidencia (tests/trazas) preservando intención, progresión, mecánicas declaradas, complejidad/composición confirmadas y ausencia de mecánicas nuevas.

## 3. Archivos a leer (obligatorio)
- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`
- `specs/004-niveles-8-10/spec.md`, `plan.md`, `tasks.md`
- Referencia base: `specs/001-base-ui-y-ajuste-nivel-4/spec.md`, `plan.md`, `handoff.md`; `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md`, `plan.md`, `handoff.md`; `specs/003-niveles-5-7/spec.md`, `plan.md`, `handoff.md`
- Código: `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/game/sim.test.ts`, `src/App.tsx`, `src/components/*`

## 4. Archivos a modificar (alcance esperado) y archivos a no tocar
- **Modificar (según necesidad):**
  - `src/game/levels.ts`: añadir definiciones de campaña **N8, N9, N10** (ids 8–10) con datos completos y compatibles con 960×400 y contratos Spec 002/O1; mantener N1–N7 existentes sin cambios de intención/comportamiento salvo corrección estrictamente necesaria por alineación mínima documentada. **No** añadir niveles distintos de 8–10.
  - `src/game/sim.test.ts` (y/u otras suites de test existentes/aprobadas si el proyecto ya las usa): tests deterministas de N8–N10 (resolución V1..Vn + al menos un fallo relevante por nivel) y verificación de regresión según base disponible (N1–N4 y N5–N7 si presentes).
  - `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`: **solo ajustes mínimos necesarios** para soportar/representar N8–N10 y contratos ya definidos por Specs 001–003 (p. ej. alineación 960×400/tipos/validación/derivación de estado, render de elementos móviles/segmentos, feedback D6, selector/HUD/timeline/hints/cierre de victoria para colección completa). **No** introducir mecánicas nuevas ni pulido visual global.
- **No tocar:** `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`, `MEMORY.md` (salvo actualización fuera de esta implementación si se solicita), configs/deps/CI/lockfiles salvo necesidad estrictamente justificada y aprobada (no prevista), contenido de campaña fuera del alcance aprobado.

## 5. Contratos a preservar
- `src/game/sim.ts` puro y determinista (sin DOM, Canvas, `window`, React, timers, aleatoriedad, I/O). Mismo estado/datos + misma entrada ⇒ mismo resultado.
- Numéricos/reglas vigentes (salvo lo explícito de specs aprobadas): canvas 960×400, 20 s, 60 Hz, **1201 frames por vuelta**, jugador r=12, 220 px/s, meta r=24, rastro 24 px, muestreo cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada.
- Mecánicas Spec 002 cuando aplique: D8 (ping-pong), D1 (`laserSegment` referenciable por `segmentId`), D2 (completar deshabilita; error reinicia/restaura `initialEnabled`), D3 (activación fuera→dentro solo jugador), D4 (estado derivado compatible rewind/seek), D5/F9 (energía > deshabilitado por secuencia > bloqueado por fantasma/rastro > activo), D6 (feedback UI mínimo en español), O1 (rechazo explícito, determinista, detectable).
- Sin backend/red/telemetría/secretos/deps nuevas. Código/nombres/comentarios/tests en inglés; UI/textos/hints/subtítulos en español.

## 6. Contrato de contenido N8–N10 (D-004-A a D-004-E)

| Nivel | id | Nombre | maxLaps | Progresión/mecánicas (confirmadas) | Complejidad confirmada | Composición base |
|---|---:|---|---:|---|---|---|
| N8 "Cruce medido" | 8 | Cruce medido | 5 | Profundiza combinación N7: láser móvil + interruptores/`laserSegment` + placas/puertas/fantasmas; sin mecánicas nuevas | 2 interruptores, 1 segmento, áreas no ambiguas | Muros, 1–2 placas, 1–2 puertas, 1 láser móvil A↔B, 1 láser estático (opcional `poweredByPlates`), 2 interruptores, 1 segmento (láser estático o móvil) |
| N9 "Paso a paso" | 9 | Paso a paso | 5 | Mayor coordinación (sostener, ordenar, abrir, cruzar); sin mecánicas nuevas | 3 interruptores, 1–2 segmentos, áreas no ambiguas | Muros, 2 placas, 1–2 puertas, 1 láser móvil A↔B, 1 láser estático, 3 interruptores, 1–2 segmentos (estático y/o móvil) |
| N10 "Última coordinación" | 10 | Última coordinación | 6 (**único nivel de 6 vueltas**) | Cierre satisfactorio/capstone integrador de todas las mecánicas conocidas; equilibrio timing/secuencia; sin mecánicas nuevas | 3 interruptores, 2 segmentos, áreas no ambiguas | Muros, **2 placas, 2 puertas, 1 láser móvil A↔B, 1 láser estático, 3 interruptores, 2 segmentos** (distribución legible, D5), ajuste fino guiado por evidencia |

- **Textos base editables (ES, D-004-E):**
  - N8: subtítulo `Dos ritmos, un solo hueco.` — hint `Medí el ritmo del láser y completá el orden sin apurarte.`
  - N9: subtítulo `Cada vuelta deja una pieza en su sitio.` — hint `Prepará el camino por partes: sostener, ordenar y después cruzar.`
  - N10: subtítulo `Todo lo aprendido, en una sola pasada final.` — hint `Usá cada vuelta con un propósito: al final, todo debe quedar en su lugar.`
  Ajustes leves permitidos sin cambiar intención ni revelar solución.
- **N10 único de 6 vueltas (D-004-B):** ningún otro nivel debe quedar con `maxLaps: 6` como resultado de esta implementación (verificar colección resultante).

## 7. Enfoque de implementación

### 7.1 Verificación de base y alineación mínima
- Confirmar estado real de Specs 001–003: canvas/dimensiones, formato de `LevelDef`, soporte de láser móvil/`laserSegment`/interruptores (D1–D8), validación O1, render/UI (D6, selector, timeline/HUD para 1–6 vueltas), presencia de N5–N7. Ejecutar `node --test` y revisar diffs/archivos.
- Si faltan piezas necesarias para N8–N10, implementar **solo lo mínimo** requerido por contratos 001–003 para soportar los niveles (sin features extra), documentando supuestos/desviaciones y manteniendo compatibilidad con lo existente.

### 7.2 Datos de niveles (`levels.ts`)
- Añadir N8, N9, N10 al final de la colección de campaña (orden 8,9,10) completando 10 niveles. Geometría contenida en 0..960×0..400 con perímetro/muros coherentes con el canvas vigente.
- Declarar láseres móviles con `A`, `B`, `periodo`, `desfase` válidos (O1, D8); `laserSegment` con `id`, `laserId`, geometría/alcance e `initialEnabled` explícitos (D1); interruptores/secuencia global inequívoca con áreas no ambiguas y referencias por `segmentId` (D2/D3). Respetar complejidades confirmadas (2/1, 3/1–2, 3/2).
- N10: aplicar composición base equilibrada (2 placas, 2 puertas, 1 móvil + 1 estático, 3 interruptores, 2 segmentos) con distribución legible; ajuste fino permitido por RF-12 sin cambiar intención/complejidad.
- Mantener N1–N7 (o N1–N4 si es el estado base) sin cambios de comportamiento/intención salvo corrección estrictamente necesaria por alineación mínima documentada.

### 7.3 Simulación/render/UI (ajustes mínimos)
- No modificar `sim.ts` para lógica nueva fuera de Spec 002; solo correcciones/ajustes mínimos si la base 002 está incompleta y es indispensable para N8–N10, preservando pureza/determinismo y contratos (incluido rewind/seek D4).
- Render/UI: asegurar representación coherente de láseres móviles/estáticos, segmentos e interruptores y feedback D6 en español (`actual/esperado`, error/reinicio, estados observables) en N8–N10; selector/HUD/timeline/hints coherentes con `maxLaps` 5/5/6 y colección de 10; comportamiento de victoria/cierre coherente al completar N10 (RF-16) sin persistencia no trivial. Evitar indicadores innecesarios en niveles sin mecánicas y no aplicar pulido visual global.

### 7.4 Tests y ajuste fino por resolubilidad (RF-10, RF-11, RF-12)
- Añadir tests deterministas para N8, N9, N10 (en `src/game/sim.test.ts` o suite existente coherente):
  - **Resolución válida** por nivel que cumpla objetivos observables V1..Vn (secuencia de inputs/ticks reproducible).
  - **Al menos un fallo relevante** por nivel (p. ej. timeout en última vuelta, error de orden/reinicio que impide abrir paso, muerte por láser/móvil, ventana/timing o condición no cumplida) coherente con contratos.
- Iterar ajuste fino de geometría/parámetros de nivel (D-004-6) hasta obtener evidencia determinista en `node --test`. Si no se logra resolubilidad para un nivel con `maxLaps`/mecánicas/complejidad/composición confirmadas, **no cerrar**: registrar bloqueo con evidencia reproducible y escalar (RF-12).
- Mantener/actualizar regresión de niveles existentes solo si es necesario por alineación mínima documentada de base.

### 7.5 Verificación
- `node --test` (o `node --test src/game/sim.test.ts`) en verde.
- `npm run lint` y `npm run build` ejecutados y reportados (si el entorno tiene dependencias).
- Revisión UI manual en dev: N8–N10 seleccionables en colección de 10, `maxLaps` 5/5/6, N10 único de 6, hints/textos ES, láseres/segmentos/interruptores visibles y feedback D6 coherente, cierre al completar N10 coherente, sin regresiones evidentes en niveles existentes.

## 8. Riesgos y mitigaciones
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Base Specs 001–003 incompleta o ausente en repo | N8–N10 no funcionan o contratos rotos | Verificar estado real, aplicar alineación mínima necesaria y documentar supuestos/desviaciones; no ampliar alcance |
| Resolubilidad difícil (especialmente N10, 6 vueltas, 3/2) | No se puede cerrar con evidencia determinista | Ajuste fino iterativo guiado por tests (D-004-6/RF-12); si persiste, bloqueo con evidencia y escalamiento sin cerrar spec |
| Regresión en N1–N7 o contratos vigentes | Pérdida de funcionalidad/campaña | Suite `node --test` completa, diffs mínimos, aislar cambios a datos N8–N10 y ajustes indispensables |
| N10 no queda como único nivel de 6 vueltas | Incumplimiento D-004-B | Revisar `maxLaps` de toda la colección en datos/tests/UI |
| Ambigüedad en distribución de 1–2 segmentos (N9) o 2 segmentos (N10) | Diseño inconsistente o no verificable | Declarar explícitamente `laserId`, geometría/alcance e `initialEnabled`; validar O1 y cubrir con tests |
| Cambios UI mínimos se convierten en pulido global | Desvío de alcance (Spec 005) | Limitar a lo estrictamente necesario para operar/representar N8–N10 y cierre coherente |

## 9. Tabla RF → evidencia
| RF | Evidencia esperada |
|---|---|
| RF-1 N8–N10 en colección con ids 8-10, maxLaps 5/5/6, metadatos ES y elementos completos 960×400 | Definiciones en `src/game/levels.ts` + revisión diff |
| RF-2 Seleccionables/jugables en orden completando colección de 10 sin romper existentes | Revisión UI/dev + diff colección |
| RF-3 Metadatos/hints minimalistas ES (base editable D-004-E) | Textos en `levels.ts`/UI, revisión visual |
| RF-4 N10 nivel final con cierre satisfactorio, sin mecánicas nuevas | Datos N10 + flujo victoria/cierre coherente + revisión UI |
| RF-5 N8 confirmado (móvil + interruptores/segmento, 2/1, 5 vueltas) | Datos N8 + test resolución/fallo |
| RF-6 N9 confirmado (mayor coordinación, 3/1–2, 5 vueltas) | Datos N9 + test resolución/fallo |
| RF-7 N10 confirmado (capstone, 3/2, 6 vueltas único, composición base equilibrada) | Datos N10 + verificación `maxLaps` único + tests |
| RF-8 Datos cumplen contratos O1 y comportamiento Spec 002 (D1–D8, D5/F9, D6) | Validación/O1 + tests que ejercitan mecánicas |
| RF-9 Diseño 960×400, progresivo, determinista, ajuste fino permitido | Layouts en `levels.ts` + evidencia tests |
| RF-10 Secuencia V1..Vn observable verificable por nivel | Tests/trazas reproducibles en `sim.test.ts` (o suite) |
| RF-11 Resolución válida + al menos un fallo relevante por nivel | `node --test` en verde con casos N8–N10 |
| RF-12 Bloqueo/escalamiento si no resoluble | Reporte de implementación con evidencia reproducible si aplica; no cerrar como válido |
| RF-13 Verificación visible en desktop | Notas/captura descriptiva en dev/build |
| RF-14 Feedback/UI coherente (vueltas, estados, D6 en español) | Revisión visual en dev |
| RF-15 Sin regresiones N1–N7 | `node --test` regresión + revisión manual |
| RF-16 Cierre/campaña coherente al completar N10 | Revisión visual/flujo existente |
| RNF-1..RNF-7 | `sim.ts` puro (diff), `node --test`, lint/build, sin deps/red/secretos, revisión rendimiento visual |

## 10. Comandos de verificación
- `node --test src/game/sim.test.ts` (o `node --test`)
- `npm run lint`
- `npm run build`
- `npm run dev` para verificación UI manual (N8–N10 seleccionables en colección de 10, `maxLaps` 5/5/6 con N10 único de 6, hints/textos ES, mecánicas/feedback D6 coherentes, cierre N10, sin regresiones evidentes en niveles existentes)

## 11. Criterio de cierre del plan
- N8–N10 implementados conforme a Spec 004 y decisiones D-004-A a D-004-E, con evidencia automatizable (resolución + fallo relevante por nivel) y revisión UI visible.
- Contratos de Specs 001–003 preservados o alineados mínimamente donde sea indispensable y documentado; base 001–003 verificada y supuestos/desviaciones reportados.
- `node --test` en verde (o bloqueo RF-12 documentado con evidencia reproducible y sin cierre de spec), lint/build reportados, sin dependencias nuevas ni cambios fuera de alcance.
