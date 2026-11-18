# Plan 003 — Niveles 5–7

Contrato técnico para implementación por **Google AI Studio** a partir de `specs/003-niveles-5-7/spec.md` (Estado: borrador revisado con decisiones del usuario, 1–5, **aprobada**). **La spec manda:** no implementar nada fuera de ella.

## 1. Contexto y objetivo
- Diseñar e incorporar los niveles de campaña **5, 6 y 7** a la colección de niveles (canvas lógico 960×400), con dificultad **media y progresiva**, hints **minimalistas en español** (base editable, sin revelar solución), soluciones deterministas y verificables.
- Progresión y complejidad confirmadas (Decisiones 1–5):
  - **N5 — "El pulso"** (`id: 5`, `maxLaps: 3`): introduce **solo láser móvil** lineal A↔B (Spec 002), sin interruptores ni `laserSegment`. Mecánicas base: muros, 1 placa, 1 puerta dependiente de placa, 1 láser móvil (bloqueable por fantasma/rastro), meta.
  - **N6 — "Orden correcto"** (`id: 6`, `maxLaps: 4`): introduce **solo interruptores ordenados + `laserSegment`** (Spec 002), sin láser móvil. Complejidad: **2 interruptores** (secuencia global) y **1 `laserSegment`** bloqueante controlado, áreas no ambiguas. Base: muros, 1 placa, 1 puerta, 1 láser estático asociado a tramo crítico + segmento controlado.
  - **N7 — "Sincronía"** (`id: 7`, `maxLaps: 5`): combina **láser móvil + interruptores ordenados/`laserSegment`** con mecánicas existentes. Complejidad: **2–3 interruptores** y **1–2 `laserSegment`** controlados, áreas no ambiguas. Base: muros, 1–2 placas, 1–2 puertas, 1 láser móvil A↔B, interruptores/secuencia/segmentos (en láser estático o móvil según diseño explícito), uso de fantasmas/rastro.
- **Fuera de alcance:** niveles 8–10 (Spec 004), pulido visual/UI global más allá de lo mínimo para operar N5–N7 coherentemente con Specs 001–002 (Spec 005), nuevas mecánicas no definidas, cambios de stack/deps, backend/red/telemetría/secretos/persistencia no trivial.

## 2. Supuestos y dependencias (base Spec 001/002)
- **D-001/D-002:** se asume base vigente según `specs/001-base-ui-y-ajuste-nivel-4/spec.md` y `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md` (canvas 960×400, N1–N4 rediseñados, soporte 10 niveles y `maxLaps` 1–6, paleta/UI dinámica, mecánicas jugables Spec 002 D1–D8: láser móvil A↔B fórmula D8, `laserSegment` entidad referenciable, interruptores/secuencia global con activación fuera→dentro solo jugador, completar/reiniciar con restauración `initialEnabled`, estado derivado compatible con rewind/seek D4, precedencia D5/F9, feedback UI mínimo D6 en español, validación O1).
- **Validación Spec 002 omitida por indicación del usuario:** la implementación de Spec 002 puede no estar verificada/mergeada en el repo. El implementador debe **verificar el estado real** antes de añadir N5–N7 y documentarlo en el reporte.
- **Si el repo difiere de 001/002:** aplicar solo **alineaciones mínimas necesarias** para cumplir Spec 003 (p. ej. constantes/tipos/validación/UI/derivación de estado ya exigidos por 001/002 y requeridos por N5–N7), sin ampliar alcance (no N8–N10, no pulido global, no rediseño de N1–N4 salvo corrección estrictamente necesaria y documentada). No inventar comportamiento ni normalizar silenciosamente datos inválidos.
- **Estado de partida observado (referencia, puede cambiar):** `src/game/levels.ts` con 4 niveles y canvas 960×600 en algunas versiones previas; tests actuales orientados a N1–N4. Tratar como dato a confirmar, no como contrato.

## 3. Archivos a leer (obligatorio)
- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`
- `specs/003-niveles-5-7/spec.md`, `plan.md`, `tasks.md`
- Referencia: `specs/001-base-ui-y-ajuste-nivel-4/spec.md`, `plan.md`, `handoff.md`; `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md`, `plan.md`, `handoff.md`
- Código: `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/game/sim.test.ts`, `src/App.tsx`, `src/components/*`

## 4. Archivos a modificar (alcance esperado)
- `src/game/levels.ts`: añadir definiciones de campaña **N5, N6, N7** (ids 5–7, `name`, `subtitle`, `maxLaps` 3/4/5, `hint`, `spawn`, `goal`, `walls`, `plates`, `doors`, `lasers` y, cuando aplique, `laserSegment`/interruptores/secuencia) compatibles con canvas 960×400 y contratos Spec 002/O1. Ajuste fino de geometría/parámetros permitido (Decisión 1, RF-10). **No** añadir N8–N10.
- `src/game/sim.test.ts` (y/u otros archivos de test existentes/aprobados si el proyecto ya los usa): tests deterministas de N5–N7 (resolución V1..Vn + al menos un fallo relevante por nivel) y verificación de regresión N1–N4 según aplique.
- `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`: **solo ajustes mínimos necesarios** para que los niveles declarados funcionen/se representen correctamente con los contratos ya definidos por Specs 001/002 (p. ej. exposición/consumo de estado derivado, soporte de datos/validación, feedback D6/UI dinámica existente). **No** reimplementar Spec 002 fuera de lo necesario ni introducir pulido visual global.
- Archivos que **no** se deben tocar: `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`, `MEMORY.md` (salvo actualización fuera de implementación si se solicita), configs/deps/CI/lockfiles salvo necesidad estrictamente justificada y aprobada (no prevista).

## 5. Contratos a preservar
- `sim.ts` puro y determinista (sin DOM, Canvas, `window`, React, timers, aleatoriedad, I/O). Mismo estado/datos + misma entrada ⇒ mismo resultado.
- Numéricos/reglas vigentes: canvas 960×400, 20 s, 60 Hz, **1201 frames por vuelta**, jugador r=12, 220 px/s, meta r=24, rastro 24 px, muestreo cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada.
- Mecánicas Spec 002 cuando aplique: D8 (ping-pong `u(t)`), D1 (`laserSegment` referenciable por `segmentId`), D2 (completar deshabilita, error reinicia/restaura `initialEnabled`), D3 (activación fuera→dentro solo jugador), D4 (estado derivado compatible rewind/seek), D5/F9 (precedencia energía > deshabilitado por secuencia > bloqueado por fantasma > activo), D6 (feedback UI mínimo en español), O1 (rechazo explícito determinista).
- Sin backend/red/telemetría/secretos/deps nuevas. Código/nombres/comentarios/tests en inglés; UI/textos/hints/subtítulos en español.

## 6. Contrato de contenido N5–N7 (Decisiones 1–5)

| Nivel | id | Nombre | maxLaps | Mecánicas nuevas (progresión) | Complejidad secuencia | Intención / objetivos observables (V1..Vn) |
|---|---:|---|---:|---|---|---|
| N5 "El pulso" | 5 | El pulso | 3 | Solo láser móvil A↔B (sin interruptores/`laserSegment`) | N/A | V1: fantasma sostiene placa/puerta requerida. V2: fantasma bloquea/sincroniza ventana segura frente a láser móvil. V3: jugador alcanza meta sin morir con puerta/ventana segura. |
| N6 "Orden correcto" | 6 | Orden correcto | 4 | Solo interruptores ordenados + `laserSegment` (sin láser móvil) | 2 interruptores, 1 segmento, áreas no ambiguas | V1: fantasma sostiene placa/acceso si aplica. V2: activa 1er interruptor en orden (progreso coherente). V3: completa secuencia (2) y deshabilita segmento bloqueante. V4: alcanza meta con segmento deshabilitado y sin colisión. |
| N7 "Sincronía" | 7 | Sincronía | 5 | Combinación láser móvil + interruptores/`laserSegment` + mecánicas existentes | 2–3 interruptores, 1–2 segmentos, áreas no ambiguas | V1: estado base (placa/posición útil). V2: progreso parcial de secuencia o acceso sin reinicio definitivo al cierre útil. V3: secuencia completa/segmentos objetivo deshabilitados coordinado con placas/puertas. V4: bloqueo/sostén adicional o condición para ventana final. V5: meta sin morir con condiciones satisfechas. |

- **Textos (base editable, ES):** N5 subtítulo `Un haz que va y viene marca tu momento.` hint `El láser se mueve con ritmo fijo. Usá tus vueltas para sostener el paso y cruzar en el momento justo.`; N6 subtítulo `No todo botón se aprieta cuando querés.` hint `Activá los interruptores en orden. Si te equivocás, la secuencia vuelve a empezar.`; N7 subtítulo `Ritmo, orden y una última pasada limpia.` hint `Sincronizá tus vueltas: primero dejá el camino listo, después cruzá sin romper el orden.` Ajustes leves permitidos sin cambiar intención ni revelar solución.
- **Ajuste fino (Decisión 1/RF-10):** coordenadas, layout, `A/B`, `periodo`, `desfase`, áreas, `initialEnabled` y parámetros numéricos pueden ajustarse/fijarse en implementación mediante tests de resolubilidad y evidencia reproducible, preservando intención, progresión, mecánicas y complejidad confirmadas.

## 7. Enfoque de implementación

### 7.1 Verificación de base y alineación mínima
- Confirmar presencia/contratos de Spec 001 (960×400, `maxLaps` 1–6, UI/colores/selector dinámicos, N1–N4 según base) y Spec 002 (tipos/datos de láser móvil, `laserSegment`, interruptores, validación O1, sim/render/UI D6). Ejecutar `node --test` y revisar diff/archivos.
- Si faltan piezas de 001/002 necesarias para N5–N7, implementar **solo lo mínimo** requerido por esos contratos para soportar los niveles (sin features extra), documentando supuestos/desviaciones.

### 7.2 Datos de niveles (`levels.ts`)
- Añadir N5, N6, N7 al final de la colección de campaña (orden 5,6,7). Respetar perímetro y canvas 960×400 (elementos contenidos en 0..960×0..400).
- N5: definir 1 láser móvil con `A`, `B`, `periodo`, `desfase` válidos (O1, D8), opcional `poweredByPlates` solo si se declara explícitamente; sin `laserSegment`/interruptores.
- N6: definir 2 interruptores ordenados (secuencia global inequívoca) y 1 `laserSegment` bloqueante con `initialEnabled` explícito, referenciado por `segmentId`; láser estático asociado (sin móvil). Áreas separadas/legibles/no ambiguas.
- N7: definir 1 láser móvil + 2–3 interruptores y 1–2 `laserSegment` (vínculo `laserId` explícito, estático o móvil según diseño), áreas no ambiguas, parámetros coherentes con precedencia D5/F9.
- Mantener N1–N4 sin cambios de comportamiento/intención salvo corrección estrictamente necesaria por alineación de base documentada.

### 7.3 Simulación/render/UI (ajustes mínimos)
- No modificar `sim.ts` para lógica nueva fuera de Spec 002; solo correcciones/ajustes mínimos si la base 002 está incompleta y es indispensable para N5–N7, manteniendo pureza/determinismo y contratos.
- Render/UI: asegurar que N5 muestre/ejecute láser móvil; N6/N7 muestren feedback D6 (`actual/esperado`, error/reinicio, estado interruptores/segmentos) y estados coherentes con derivación en `t`. Evitar indicadores innecesarios en niveles sin mecánicas. No pulido visual global.

### 7.4 Tests y ajuste fino por resolubilidad (RF-9, RF-10, RF-11)
- Añadir tests deterministas en `src/game/sim.test.ts` (o suite existente coherente) para N5, N6, N7:
  - **Resolución válida** por nivel que cumpla objetivos observables V1..Vn (secuencia de inputs/ticks/replay reproducible).
  - **Al menos un fallo relevante** por nivel, coherente con contratos (ejemplos: N5 timeout o muerte por ventana móvil perdida; N6 error de orden/reinicio que impide abrir paso o timeout sin completar secuencia; N7 error de secuencia/ventana móvil perdida o timeout).
- Usar ajuste fino iterativo de geometría/parámetros de nivel (Decisión 1) hasta obtener evidencia determinista en `node --test`. Si no se logra resolubilidad para un nivel con `maxLaps`/mecánicas/complejidad declaradas, **no cerrar**: registrar bloqueo con evidencia reproducible y escalar (RF-10).
- Mantener/actualizar regresión de N1–N4 solo si es necesario por alineación de base documentada.

### 7.5 Verificación
- `node --test` (o `node --test src/game/sim.test.ts`) en verde.
- `npm run lint` y `npm run build` ejecutados y reportados (si el entorno tiene dependencias).
- Revisión UI manual en dev: selector/navegación incluye N5–N7, HUD/timeline/indicadores acordes a `maxLaps` 3/4/5, feedback D6 en N6/N7, láser móvil visible en N5/N7, hints/textos en español, sin regresiones evidentes en N1–N4.

## 8. Riesgos y mitigaciones
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Base Spec 001/002 incompleta o no validada en repo | N5–N7 no funcionan o rompen contratos | Verificar estado real, aplicar alineación mínima necesaria y documentar supuestos/desviaciones en reporte |
| Resolubilidad difícil con layout/params iniciales (especialmente N7) | No se puede cerrar nivel con evidencia | Ajuste fino iterativo de geometría/parámetros guiado por tests (Decisión 1); si persiste, bloqueo RF-10 con evidencia y escalamiento |
| Regresión en N1–N4 o en mecánicas 002 | Pérdida de funcionalidad existente | Ejecutar suite completa `node --test`, revisar diffs mínimos, aislar cambios a datos de N5–N7 y ajustes indispensables |
| Ambigüedad en vínculo de `laserSegment` a láser móvil/estático en N7 | Implementación inconsistente | Declarar explícitamente `laserId` y geometría/alcance coherente; validar O1 y cubrir con test |
| Complejidad de tests deterministas (timings largos) | Flakiness o tiempos altos | Usar secuencias reproducibles, `stepSim`/helpers existentes, inputs discretos deterministas |

## 9. Tabla RF → evidencia
| RF | Evidencia esperada |
|---|---|
| RF-1 N5–N7 en colección con ids 5-7, maxLaps 3/4/5, metadatos ES y elementos completos 960×400 | Definiciones en `src/game/levels.ts` + revisión diff |
| RF-2 Seleccionables/jugables en orden sin romper N1–N4 | Revisión UI/dev + ausencia de regresiones |
| RF-3 Metadatos/hints minimalistas ES coherentes | Textos en `levels.ts`/UI, revisión visual |
| RF-4 N5 solo láser móvil A↔B (Spec 002), sin interruptores/segmentos | Datos N5 + test de resolución/fallo N5 |
| RF-5 N6 solo interruptores+`laserSegment` (2/1), sin móvil, D2/D3/D6 | Datos N6 + tests (avance/error/reinicio/compleción, fallo relevante) |
| RF-6 N7 combinación móvil + interruptores/`laserSegment` (2–3/1–2), D5/F9 | Datos N7 + test de resolución/fallo N7 |
| RF-7 Datos cumplen contratos/O1 y comportamiento Spec 002 | Validación existente/O1 + tests que ejercitan mecánicas |
| RF-8 Diseño 960×400, progresivo, determinista, ajuste fino permitido | Layouts en `levels.ts` + evidencia tests |
| RF-9 Secuencia V1..Vn observable verificable por nivel | Tests/trazas reproducibles en `sim.test.ts` (o suite) |
| RF-10 Bloqueo/escalamiento si no resoluble | Reporte de implementación con evidencia si aplica; no cerrar como válido |
| RF-11 Resolución + al menos un fallo relevante por nivel | `node --test` en verde con casos N5–N7 |
| RF-12 Feedback/UI coherente (vueltas, placas/puertas/láseres, D6 en N6/N7) | Revisión visual en dev |
| RF-13 Sin regresiones N1–N4 | `node --test` regresión + revisión manual |
| RNF-1..RNF-7 | `sim.ts` puro (diff), `node --test`, lint/build, sin deps/red/secretos, revisión rendimiento visual |

## 10. Comandos de verificación
- `node --test src/game/sim.test.ts` (o `node --test`)
- `npm run lint`
- `npm run build`
- `npm run dev` para verificación UI manual (N5–N7 seleccionables, hints ES, `maxLaps` 3/4/5, láser móvil N5/N7, feedback D6 N6/N7, sin regresiones evidentes N1–N4)

## 11. Criterio de cierre del plan
- N5–N7 implementados conforme a Spec 003 y Decisiones 1–5, con evidencia automatizable (resolución + fallo por nivel) y revisión UI.
- Contratos de Spec 001/002 preservados o alineados mínimamente donde sea indispensable y documentado.
- `node --test` en verde (o bloqueo RF-10 documentado con evidencia reproducible y sin cierre de spec), lint/build reportados, sin dependencias nuevas ni cambios fuera de alcance.
