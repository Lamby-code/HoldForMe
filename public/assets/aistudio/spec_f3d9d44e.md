# Spec 003 — Niveles 5–7
Estado: borrador (revisado con decisiones del usuario, 1–5)

## Contexto y objetivo
Las Specs 001 (base UI/canvas 960×400, rediseño N1–N4, soporte 10 niveles y hasta 6 vueltas, UI neutra) y 002 (lógica jugable: láseres móviles lineales A↔B e interruptores ordenados con `laserSegment`, decisiones D1–D8, validación O1, estado derivado compatible con rewind/seek) definen la base técnica y mecánica sobre la que se expande la campaña. La implementación de Spec 001/002 la realiza Google AI Studio (la validación de la implementación de Spec 002 fue omitida por indicación del usuario); esta spec asume sus contratos como vigentes y disponibles.

El objetivo de esta spec es **diseñar y especificar los niveles de campaña 5, 6 y 7** dentro de la colección de hasta 10 niveles, con dificultad **media y progresiva**, hints **minimalistas en español**, resolubles y deterministas en canvas lógico **960×400**. Los niveles introducen y combinan de forma coherente las mecánicas de Spec 002 (láser móvil, `laserSegment`, interruptores/secuencia global) junto con mecánicas existentes (placas, puertas, láser estático/bloqueo por fantasma), manteniendo compatibilidad con contratos vigentes y sin introducir backend/red/telemetría/secretos ni dependencias nuevas.

**Decisiones del usuario incorporadas (1–5):** se aprueba la intención y mecánicas propuestas para N5–N7, permitiendo ajuste fino en implementación de coordenadas, layout y parámetros numéricos (`A/B`, `periodo`, `desfase`, áreas, `initialEnabled`, etc.) guiado por tests de resolubilidad y evidencia reproducible (RF-10). `maxLaps` confirmados: **N5=3, N6=4, N7=5**. Progresión confirmada: N5 introduce solo láser móvil; N6 introduce solo interruptores ordenados + `laserSegment`; N7 combina láser móvil + interruptores/`laserSegment` (con mecánicas existentes según corresponda). Complejidad confirmada: **N6 = 2 interruptores / 1 segmento**; **N7 = 2–3 interruptores / 1–2 segmentos**, con áreas no ambiguas. Nombres, subtítulos y hints en español aprobados como base editable (ajustes leves permitidos sin cambiar intención ni revelar la solución).

## Usuarios
- **Jugador de puzzle (desktop):** quiere desafíos de dificultad media que enseñen y combinen mecánicas nuevas de forma legible y justa.
- **Diseñador/autor de niveles:** quiere definiciones de nivel claras (datos, elementos, intención y secuencia esperada) para implementar y ajustar con evidencia.
- **Implementador (Google AI Studio) y tester:** necesitan requisitos verificables (EARS), contratos de datos/simulación y criterios de resolubilidad comprobables por tests/trazas.

## Historias de usuario
- HU-1. Como jugador, quiero que el nivel 5 me introduzca el láser móvil con un reto comprensible, para aprender a coordinar timing y fantasmas.
- HU-2. Como jugador, quiero que el nivel 6 me introduzca los interruptores ordenados y el control de `laserSegment`, para entender secuencia, error/reinicio y apertura de paso.
- HU-3. Como jugador, quiero que el nivel 7 combine mecánicas conocidas y nuevas de forma progresiva, para resolver un puzzle medio sin ambigüedad injusta.
- HU-4. Como jugador, quiero hints minimalistas en español y feedback coherente con las reglas, para planificar mis vueltas sin que se revele la solución completa.
- HU-5. Como tester, quiero criterios de resolubilidad y secuencias esperadas por vuelta verificables (tests/trazas reproducibles), para validar que cada nivel es determinista y resoluble.

## Definiciones
- **Loop / vuelta / playhead / fantasma / rastro / placa / puerta / láser / meta / rewind:** según contratos vigentes y Specs 001–002 (20 s, 60 Hz, 1201 frames por vuelta, `t` discreto determinista).
- **Canvas lógico:** 960×400 (`CANVAS_W = 960`, `CANVAS_H = 400`), con muros perimetrales y elementos contenidos en 0..960×0..400.
- **Láser móvil, `periodo`, `desfase`, `laserSegment`, interruptor ordenado, secuencia global, activación por proximidad (jugador activo, fuera→dentro), precedencia de estados:** según Spec 002 (D1–D8, O1).
- **Secuencia esperada por vuelta:** objetivos/condiciones observables por vuelta (V1..Vn) que debe cumplir una solución válida; rutas/timings concretos se fijan y validan en implementación/tests.
- **Nivel de campaña:** entrada en la colección de niveles (`LevelDef`/datos equivalentes) con `id`, metadatos en español, elementos y parámetros deterministas.

## Supuestos y dependencias
- **D-001 (Spec 001):** base disponible con canvas 960×400, N1–N4 rediseñados, soporte de colección hasta 10 niveles, `maxLaps` 1–6, paleta/identificadores dinámicos para 6 vueltas, selector escalable y rechazo O1 para datos inválidos en carga/validación.
- **D-002 (Spec 002):** mecánicas jugables disponibles y conforme a contrato: láser móvil A↔B (fórmula D8), entidad `laserSegment` referenciable (D1), interruptores con secuencia global/activación fuera→dentro solo jugador (D3), efecto completar/reiniciar con restauración de `initialEnabled` (D2), estado derivado compatible con rewind/seek (D4), precedencia D5/F9, feedback UI mínimo D6, validación O1. Las verificaciones de Spec 002 pueden residir en fixtures de tests (D7).
- **D-003:** se preservan contratos numéricos/reglas vigentes salvo lo explícitamente indicado; `sim.ts` permanece puro y determinista.
- **D-004:** los IDs/orden de campaña continúan desde los existentes (N1–N4) como niveles 5, 6 y 7; los niveles 8–10 quedan fuera de esta spec.
- **D-005 (Decisiones 1–5):** intención/mecánicas de N5–N7 aprobadas; ajuste fino de geometría/layout y parámetros numéricos permitido en implementación guiado por tests de resolubilidad y evidencia reproducible (RF-10). Progresión y complejidad confirmadas (N5: solo láser móvil, 3 vueltas; N6: solo interruptores+`laserSegment`, 4 vueltas, 2 interruptores/1 segmento; N7: combinación móvil+interruptores/`laserSegment`, 5 vueltas, 2–3 interruptores/1–2 segmentos, áreas no ambiguas). Textos en español (nombre/subtítulo/hint) aprobados como base editable.

## Diseño de niveles (aprobado en intención/mecánicas, ajuste fino en implementación)

> **Nota (Decisión 1):** se aprueba la intención y mecánicas de N5–N7. Las geometrías, coordenadas, layout y parámetros numéricos concretos (`A/B`, `periodo`, `desfase`, áreas, radios, `initialEnabled`, etc.) son base verificable y podrán ajustarse/fijarse en implementación mediante evidencia (tests/trazas) y tests de resolubilidad (RF-10), sin cambiar la intención ni la progresión aprobadas. Nombres, subtítulos y hints en español están aprobados como base editable (ajustes leves sin cambiar intención ni revelar la solución).

### Nivel 5 — "El pulso" (confirmado)
- **Identidad:** `id: 5`, nombre `El pulso`, subtítulo `Un haz que va y viene marca tu momento.` (base editable).
- **Vueltas:** `maxLaps: 3` (confirmado).
- **Progresión mecánica:** introduce **solo láser móvil** (Spec 002), sin interruptores ni `laserSegment`.
- **Mecánicas/elementos:** muros, 1 placa, 1 puerta dependiente de placa, 1 **láser móvil** lineal A↔B que cruza un corredor crítico (bloqueable por fantasma/rastro según reglas vigentes), meta.
- **Intención de puzzle:** coordinar una vuelta de soporte (placa/puerta) y/o bloqueo/ventana temporal frente al láser móvil para que la última vuelta alcance la meta; enseña anticipación determinista por `t`/`periodo`/`desfase`.
- **Hint (minimalista, ES, base editable):** "El láser se mueve con ritmo fijo. Usá tus vueltas para sostener el paso y cruzar en el momento justo."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** el fantasma 1 queda en estado que mantiene presionada la placa requerida para habilitar la puerta en los tramos necesarios de la solución.
  - **V2:** el fantasma 2 se posiciona/bloquea o sincroniza su rastro de forma que el corredor afectado por el láser móvil sea seguro en la ventana necesaria (según reglas de bloqueo vigentes) para el cruce final.
  - **V3:** el jugador alcanza la meta sin morir, aprovechando puerta abierta y ventana/estado seguro frente al láser móvil.
- **Parámetros láser móvil:** `A`, `B`, `periodo` y `desfase` explícitos y válidos (O1), ajustables en implementación; compatibles opcionalmente con `poweredByPlates` solo si se declara; trayectoria contenida en canvas.

### Nivel 6 — "Orden correcto" (confirmado)
- **Identidad:** `id: 6`, nombre `Orden correcto`, subtítulo `No todo botón se aprieta cuando querés.` (base editable).
- **Vueltas:** `maxLaps: 4` (confirmado).
- **Progresión mecánica:** introduce **solo interruptores ordenados + `laserSegment`** (Spec 002), sin láser móvil.
- **Complejidad confirmada:** **2 interruptores** en secuencia global y **1 `laserSegment`** bloqueante controlado, con áreas de activación no ambiguas.
- **Mecánicas/elementos:** muros, 1 placa, 1 puerta, 1 láser estático (existente) asociado a un tramo crítico, 2 interruptores ordenados que controlan 1 `laserSegment` referenciado por `segmentId` (D1). Puede incluir `poweredByPlates` en láser/segmento según precedencia D5 solo si aporta claridad (opcional, a declarar explícitamente).
- **Intención de puzzle:** introducir secuencia global, activación válida fuera→dentro solo por jugador activo, progreso `actual/esperado`, reinicio por error con restauración de estado inicial, y deshabilitación persistente del segmento al completar mientras la secuencia siga correcta.
- **Hint (minimalista, ES, base editable):** "Activá los interruptores en orden. Si te equivocás, la secuencia vuelve a empezar."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** el fantasma 1 sostiene la placa necesaria para mantener acceso/energía requerida por el diseño (si aplica) durante las vueltas posteriores.
  - **V2:** el jugador activa en orden correcto el primer interruptor requerido (según secuencia global) sin completar, dejando progreso/estado derivado coherente al cierre de vuelta.
  - **V3:** el jugador completa la secuencia global correcta (activaciones válidas en orden de los 2 interruptores) deshabilitando el `laserSegment` bloqueante objetivo para abrir paso.
  - **V4:** el jugador alcanza la meta con el segmento deshabilitado (secuencia correcta) y sin colisión letal.
- **Notas de diseño:** áreas de interruptores separadas/legibles y no ambiguas; feedback mínimo D6 observable (progreso, error/reinicio, estado interruptores/segmento).

### Nivel 7 — "Sincronía" (confirmado)
- **Identidad:** `id: 7`, nombre `Sincronía`, subtítulo `Ritmo, orden y una última pasada limpia.` (base editable).
- **Vueltas:** `maxLaps: 5` (confirmado).
- **Progresión mecánica:** combina **láser móvil + interruptores ordenados/`laserSegment`** (Spec 002) con mecánicas existentes según corresponda.
- **Complejidad confirmada:** **2–3 interruptores** en secuencia global y **1–2 `laserSegment`** controlados, con áreas de activación no ambiguas.
- **Mecánicas/elementos:** combinación de mecánicas existentes y Spec 002: muros, 1–2 placas, 1–2 puertas, 1 **láser móvil** A↔B, interruptores ordenados controlando `laserSegment` (en láser estático o móvil según diseño final, explícito en datos) y uso de fantasmas/rastro para sostener/bloquear. Aplica precedencia D5/F9 completa.
- **Intención de puzzle:** combinar timing de láser móvil con ejecución de secuencia ordenada y soporte por fantasmas; dificultad media-progresiva (integración, no mecánica aislada).
- **Hint (minimalista, ES, base editable):** "Sincronizá tus vueltas: primero dejá el camino listo, después cruzá sin romper el orden."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** fantasma 1 establece un estado base (placa presionada y/o posición útil) requerido por pasos posteriores.
  - **V2:** jugador/fantasma logra progreso parcial en la secuencia de interruptores o prepara acceso sin provocar reinicio definitivo al cierre útil de la vuelta.
  - **V3:** se completa la secuencia correcta o se alcanza el estado de segmentos necesario (segmentos objetivo deshabilitados mientras la secuencia sea correcta) coordinado con el estado de placas/puertas.
  - **V4:** fantasma 4 provee bloqueo/sostén adicional frente a láser móvil o mantiene condición requerida para la ventana final.
  - **V5:** el jugador alcanza la meta sin morir, con todas las condiciones (puertas/segmentos/energía/bloqueo/timing) satisfechas de forma determinista.
- **Notas de diseño:** complejidad por coordinación, no por geometría ilegible; cantidad de interruptores/segmentos dentro del rango confirmado (2–3 / 1–2) y áreas no ambiguas.

## Requisitos funcionales

### A. Incorporación de niveles 5–7 a la campaña
- **RF-1:** EL SISTEMA deberá incluir los niveles de campaña **5, 6 y 7** en la colección de niveles (datos `LevelDef`/`levels.ts` o fuente de verdad equivalente definida por la implementación), con `id` único correlativo (5, 6, 7), `name`, `subtitle`, `maxLaps` (1–6), `hint` en español, `spawn`, `goal` y definición completa de elementos (`walls`, `plates`, `doors`, `lasers` y, cuando aplique, `laserSegment`/interruptores/secuencia) compatibles con canvas 960×400.
- **RF-2:** CUANDO el jugador acceda al selector/progresión de niveles en una base con soporte para 10 niveles (Spec 001), ENTONCES los niveles 5–7 deberán ser seleccionables/jugables en el orden de campaña definido, sin romper navegación, contadores ni estados existentes de N1–N4.
- **RF-3:** EL SISTEMA deberá definir para cada nivel 5–7 metadatos visibles en español (nombre, subtítulo, hint) minimalistas, coherentes con la mecánica enseñada/ejercitada y con dificultad media progresiva.

### B. Mecánicas y contenido por nivel
- **RF-4 (Nivel 5, confirmado):** EL SISTEMA deberá incluir en el nivel 5 (`maxLaps: 3`) **solo** la mecánica nueva de **láser móvil** lineal A↔B conforme a Spec 002 (D8, validación O1), sin interruptores ni `laserSegment`, integrado con mecánicas existentes necesarias para el puzzle (p. ej. placa/puerta y/o interacción con fantasmas/rastro) de modo que la solución requiera coordinación temporal determinista.
- **RF-5 (Nivel 6, confirmado):** EL SISTEMA deberá incluir en el nivel 6 (`maxLaps: 4`) **solo** las mecánicas nuevas de **interruptores ordenados** con secuencia global y `laserSegment` conforme a Spec 002, sin láser móvil. La complejidad deberá ser **2 interruptores y 1 `laserSegment`** bloqueante controlado (referencia por `segmentId`, D1), con áreas de activación no ambiguas, de forma que la resolución requiera activaciones en orden correcto, gestione reinicio por error (D2/D3) y haga observable el feedback mínimo D6.
- **RF-6 (Nivel 7, confirmado):** EL SISTEMA deberá incluir en el nivel 7 (`maxLaps: 5`) la combinación de **láser móvil + interruptores ordenados/`laserSegment`** conforme a Spec 002 junto con mecánicas existentes según diseño (fantasmas/placas/puertas). La complejidad de secuencia deberá ser **2–3 interruptores y 1–2 `laserSegment`** controlados, con áreas no ambiguas, aplicando la precedencia de estados de Spec 002 (D5/F9) cuando corresponda.
- **RF-7:** CUANDO un nivel declare láseres móviles, `laserSegment` o interruptores, ENTONCES sus datos deberán cumplir los contratos y validaciones O1 de Spec 002 (ids únicos/referencias válidas, `periodo > 0`, `desfase`/extremos válidos, secuencia/áreas/controles consistentes), y el comportamiento en simulación/UI deberá ser el definido por Spec 002.

### C. Diseño, resolubilidad y verificabilidad
- **RF-8:** EL SISTEMA deberá diseñar los niveles 5–7 para canvas 960×400, con geometría contenida, dificultad media progresiva (5 introduce móvil, 6 introduce interruptores/segmentos, 7 combina) y soluciones deterministas basadas en grabación/replay de vueltas y contratos vigentes. Se permite ajuste fino de coordenadas, layout y parámetros numéricos en implementación (Decisión 1), preservando intención, progresión, mecánicas y complejidad confirmadas.
- **RF-9:** PARA cada nivel 5–7, la spec/implementación deberá documentar y hacer verificable una **secuencia esperada por vuelta (V1..Vn)** con objetivos/condiciones observables. Las rutas, posiciones y timings concretos dependientes del layout final deberán fijarse y validarse mediante evidencia automatizada (tests/trazas reproducibles en `sim.ts`/`sim.test.ts` o mecanismo equivalente aprobado) durante la implementación.
- **RF-10:** SI durante la implementación/validación se determina que un nivel 5, 6 o 7 no es resoluble de forma determinista con su `maxLaps` (3/4/5) y mecánicas/complejidad declaradas, ENTONCES la implementación no deberá cerrar la spec como válida: deberá registrar el bloqueo con evidencia reproducible, mantener visible el riesgo y escalar la decisión al usuario (ajustar geometría/parámetros dentro del alcance aprobado por Decisión 1, u otra alternativa aprobada) antes de marcar la spec como implementada/validada.
- **RF-11:** CUANDO se actualicen o añadan pruebas automatizadas para N5–N7, ENTONCES deberán verificarse al menos: una resolución válida por nivel que cumpla sus objetivos por vuelta, y al menos un caso de fallo relevante por nivel (p. ej. timeout en última vuelta, error de orden/reinicio que impide abrir paso, muerte por láser/móvil o incumplimiento de ventana) coherente con contratos vigentes y Spec 002.

### D. UI, feedback y compatibilidad
- **RF-12:** MIENTRAS el jugador esté en niveles 5–7, EL SISTEMA deberá mostrar feedback/UI coherente con Specs 001–002: indicadores de vueltas/timeline/HUD acordes a `maxLaps`, estados observables de placas/puertas/láseres, y para mecánicas de Spec 002 el feedback mínimo obligatorio en español D6 (progreso `actual/esperado`, mensaje breve de error/reinicio, estado observable de interruptores/`laserSegment`) sin inferir comportamiento no respaldado por simulación/datos.
- **RF-13:** EL SISTEMA deberá preservar el comportamiento y resolubilidad de los niveles 1–4 y contratos existentes, sin regresiones introducidas por la incorporación de N5–N7.

## Requisitos no funcionales
- **RNF-1:** `src/game/sim.ts` deberá permanecer puro y determinista (sin DOM, Canvas, `window`, `React`, temporizadores, aleatoriedad ni I/O); mismo estado/datos + misma entrada ⇒ mismo resultado.
- **RNF-2:** Se deberán preservar contratos numéricos y reglas vigentes salvo lo explícitamente definido por specs aprobadas: canvas lógico 960×400, loop 20 s, 60 Hz, 1201 frames por vuelta, jugador r=12, vel 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, zona segura de spawn 44 px, timeout solo en última vuelta agotada, y reglas/precedencias de Spec 002 para las mecánicas nuevas.
- **RNF-3:** Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, Canvas 2D. Sin dependencias nuevas sin aprobación.
- **RNF-4:** Código, nombres, comentarios y tests en inglés; interfaz, textos de juego, hints, subtítulos y mensajes visibles en español.
- **RNF-5:** Sin backend, cuentas, red, telemetría, secretos ni persistencia de datos personales.
- **RNF-6:** Verificación automatizable: `node --test` en verde para contratos/simulación y niveles afectados (incluidos N5–N7). `npm run lint` y `npm run build` aplican cuando el alcance de implementación los afecte. Cambios visuales requieren verificación visible (dev/build o revisión manual documentada).
- **RNF-7:** Rendimiento adecuado en desktop (objetivo 60 Hz) con las mecánicas y elementos de N5–N7.

## Casos límite
- **CL-1 (Canvas 960×400):** todos los elementos de N5–N7 (muros, spawn, goal, placas, puertas, láseres estáticos/móviles, áreas de interruptores, segmentos) deben quedar contenidos y ser interactuables sin desbordes ni colisiones inválidas por geometría.
- **CL-2 (Láser móvil, D8):** en N5/N7, posiciones efectivas en `t=0`, extremos de ciclo, `desfase` normalizable y valores altos de `t`/rewind-seek deben ser deterministas y coherentes con `u(t)`; colisión/bloqueo respeta precedencia D5/F9.
- **CL-3 (Secuencia e interruptores, D2/D3):** en N6/N7, permanencia en área no re-dispara activación sin transición fuera→dentro; solo jugador activo activa; error de orden reinicia secuencia y restaura `initialEnabled`; tras reinicio la secuencia puede completarse; al completar, segmentos objetivo permanecen deshabilitados mientras la secuencia siga correcta en el historial hasta `t`. Las áreas de activación deben ser no ambiguas y la complejidad debe respetar lo confirmado (N6: 2 interruptores/1 segmento; N7: 2–3 interruptores/1–2 segmentos).
- **CL-4 (Rewind/seek, D4):** volver antes de activaciones/errores ajusta estado derivado (sin estados fantasma); avanzar/reproducir reaplica eventos en orden determinista.
- **CL-5 (Timeout/victoria/muerte):** agotar la última vuelta sin meta ⇒ derrota por timeout según contrato; victoria solo al alcanzar meta vivo; concurrencia temporal de eventos resuelta de forma coherente y determinista con reglas vigentes.
- **CL-6 (Datos inválidos O1):** definiciones inválidas de N5–N7 (referencias rotas, `periodo <= 0`, áreas/orden inconsistentes, ids duplicados, etc.) deben producir rechazo explícito, determinista y detectable en definición/carga/validación.
- **CL-7 (Regresión):** N1–N4 siguen resolubles y con comportamiento/UI coherente tras añadir N5–N7.
- **CL-8 (Escalabilidad UI):** selector, leyenda de vueltas e indicadores funcionan correctamente con `maxLaps` usados por N5–N7 (hasta 6) y con la colección ampliada.

## Fuera de alcance
- Niveles 8–10 (Spec 004).
- Pulido visual/UI global más allá de lo mínimo necesario para representar/operar N5–N7 coherentemente con Specs 001–002 (Spec 005).
- Nuevas mecánicas no definidas en Spec 002 ni en contratos existentes.
- Cambios de stack, dependencias nuevas no aprobadas, backend, cuentas, red, telemetría o persistencia no trivial.
- Arma/stretch u otras features no especificadas.
- Modificar `AGENTS.md`, `docs/constitution.md` o `PARADOX_LOOP_DISENO.md`.

## Criterios de finalización
- La spec define N5–N7 con identidad, `maxLaps` confirmados (3/4/5), metadatos/hints en español (base editable), mecánicas/elementos, progresión y complejidad confirmadas (N5 solo móvil; N6 solo interruptores+`laserSegment`, 2/1; N7 combinación, 2–3/1–2, áreas no ambiguas), intención y secuencia esperada por vuelta (objetivos observables) verificable.
- Los requisitos EARS (RF/RNF) y casos límite cubren uso coherente de mecánicas Spec 002 (móvil, interruptores, `laserSegment`, precedencias, rewind) y compatibilidad con Spec 001/contratos vigentes en 960×400, con ajuste fino de geometría/parámetros permitido según Decisión 1 y RF-10.
- La verificación exige evidencia automatizable por nivel (resolución + fallo relevante, tests/trazas reproducibles) y revisión visible; incluye criterio de escalamiento si un nivel no resulta resoluble.
- Las dependencias (001/002), supuestos y decisiones 1–5 quedan incorporadas; no permanecen dudas abiertas bloqueantes para avanzar a plan/implementación (salvo riesgo de resolubilidad gestionado por RF-10).

## Decisiones resueltas y dudas abiertas
- **Decisión 1 (resuelta):** aprobada la intención y mecánicas de N5–N7; se permite ajuste fino de coordenadas, layout y parámetros numéricos (`A/B`, `periodo`, `desfase`, áreas, `initialEnabled`, etc.) en implementación, guiado por tests de resolubilidad y evidencia reproducible (RF-10).
- **Decisión 2 (resuelta):** `maxLaps` confirmados — N5=3, N6=4, N7=5.
- **Decisión 3 (resuelta):** progresión confirmada — N5 solo láser móvil; N6 solo interruptores ordenados + `laserSegment`; N7 combina láser móvil + interruptores/`laserSegment` (con mecánicas existentes según corresponda).
- **Decisión 4 (resuelta):** complejidad confirmada — N6: 2 interruptores / 1 segmento; N7: 2–3 interruptores / 1–2 segmentos, con áreas no ambiguas.
- **Decisión 5 (resuelta):** nombres, subtítulos y hints en español aprobados como base editable (ajustes leves sin cambiar intención ni revelar la solución).

**Dudas abiertas:** ninguna bloqueante.

**Riesgo residual declarado (no bloqueante):** la viabilidad real (rutas/timings) de los layouts 960×400 depende de evidencia en simulación/tests (`node --test`). Si no se logra evidencia determinista de resolución para un nivel, aplica RF-10 (registro de bloqueo con evidencia y escalamiento al usuario para ajustar geometría/parámetros dentro del alcance aprobado u otra alternativa aprobada).