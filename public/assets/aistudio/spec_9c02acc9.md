# Spec 004 — Niveles 8–10
Estado: borrador (revisado con decisiones del usuario, D-004-A a D-004-E)

## Contexto y objetivo
Las Specs 001 (base UI/canvas 960×400, rediseño N1–N4, soporte de colección hasta 10 niveles y `maxLaps` 1–6, UI neutra/O1), 002 (lógica jugable: láseres móviles lineales A↔B con convención D8, entidad `laserSegment` referenciable D1, interruptores ordenados con secuencia global y activación fuera→dentro solo por jugador D3, efecto completar/reiniciar con restauración de `initialEnabled` D2, estado derivado compatible con rewind/seek D4, precedencia D5/F9, feedback UI mínimo D6, fixtures en tests D7, validación O1) y 003 (niveles de campaña 5–7, progresión confirmada: N5 solo láser móvil 3 vueltas, N6 solo interruptores+`laserSegment` 2/1 en 4 vueltas, N7 combinación móvil+interruptores/`laserSegment` 2–3/1–2 en 5 vueltas, con ajuste fino guiado por evidencia RF-10) establecen los contratos vigentes sobre los que se completa la campaña. La implementación de specs previas la realiza Google AI Studio (la validación de implementación de Spec 003 fue omitida por indicación del usuario); esta spec asume dichos contratos como vigentes y disponibles.

El objetivo de esta spec es **diseñar y especificar los niveles de campaña 8, 9 y 10** (ids 8–10), completando la colección de 10 niveles. Los niveles deben tener dificultad **media con progresión y cierre apropiado del arco de campaña**, hints **minimalistas en español**, ser resolubles y deterministas en canvas lógico **960×400**, y usar coherentemente las mecánicas existentes y de Spec 002 (placas, puertas, láseres estáticos/móviles, bloqueo por fantasma/rastro, `laserSegment`, interruptores/secuencia global) sin introducir mecánicas nuevas. **N10** debe constituir un **cierre satisfactorio** de la campaña dentro del alcance (integración de lo aprendido, sin mecánicas nuevas ni pulido visual global de Spec 005 salvo lo mínimo necesario para operar/representar los niveles).

**Decisiones del usuario incorporadas (D-004-A a D-004-E):** se aprueban los conceptos propuestos para N8–N10 (N8 "Cruce medido": combinación láser móvil + interruptores/`laserSegment` + placas/puertas; N9 "Paso a paso": mayor coordinación con secuencia/segmentos; N10 "Última coordinación": capstone integrador de todas las mecánicas conocidas, sin mecánicas nuevas). `maxLaps` confirmados: **N8=5, N9=5, N10=6**; **N10 es el único nivel de 6 vueltas** (cierre más exigente, máximo permitido). Complejidad confirmada: **N8: 2 interruptores / 1 segmento; N9: 3 interruptores / 1–2 segmentos; N10: 3 interruptores / 2 segmentos**, con áreas no ambiguas. Composición de N10 confirmada como **base equilibrada** (p. ej. 1 láser móvil + 1 láser estático, 2 placas, 2 puertas, 3 interruptores, 2 segmentos; equilibrio entre timing y secuencia), con ajuste fino en implementación guiado por evidencia/tests de resolubilidad sin mecánicas nuevas y preservando intención y complejidad confirmada. Nombres, subtítulos y hints en español aprobados como base editable (ajustes leves permitidos sin cambiar intención ni revelar la solución). Se permite ajuste fino de geometría, layout y parámetros numéricos (`A/B`, `periodo`, `desfase`, áreas, radios, posiciones, `initialEnabled`, etc.) guiado por tests de resolubilidad y evidencia reproducible (RF-12), dentro de las decisiones confirmadas.

**Supuesto de base:** el estado real del repositorio puede no reflejar implementaciones de Specs 001–003. Si difiere, la implementación deberá documentar desviaciones y resolverlas de forma coherente con `docs/constitution.md`, `AGENTS.md` y los contratos aquí definidos, sin inventar comportamiento no especificado.

## Usuarios
- **Jugador de puzzle (desktop):** quiere desafíos finales de dificultad media/progresiva que integren mecánicas conocidas con objetivos claros y un cierre satisfactorio.
- **Diseñador/autor de niveles:** quiere definiciones de nivel claras (datos, elementos, intención y secuencia esperada por vuelta) para implementar y ajustar con evidencia.
- **Implementador (Google AI Studio) y tester:** necesitan requisitos verificables (EARS), contratos de datos/simulación, criterios de resolubilidad comprobables por tests/trazas reproducibles y revisión visible.

## Historias de usuario
- HU-1. Como jugador, quiero que el nivel 8 profundice la combinación de mecánicas conocidas con un reto legible, para consolidar lo aprendido tras el nivel 7.
- HU-2. Como jugador, quiero que el nivel 9 aumente la coordinación requerida de forma justa, para prepararme para el cierre de la campaña.
- HU-3. Como jugador, quiero que el nivel 10 integre las mecánicas de la campaña en un desafío final resoluble y satisfactorio, para cerrar la experiencia sin mecánicas nuevas.
- HU-4. Como jugador, quiero hints minimalistas en español y feedback coherente con las reglas, para planificar mis vueltas sin que se revele la solución completa.
- HU-5. Como tester, quiero criterios de resolubilidad y secuencias esperadas por vuelta verificables (tests/trazas reproducibles y revisión visible), para validar que cada nivel es determinista y resoluble.

## Definiciones
- **Loop / vuelta / playhead / fantasma / rastro / placa / puerta / láser / meta / rewind:** según contratos vigentes y Specs 001–003 (20 s, 60 Hz, 1201 frames por vuelta, `t` discreto determinista).
- **Canvas lógico:** 960×400 (`CANVAS_W = 960`, `CANVAS_H = 400`), con muros perimetrales y elementos contenidos en 0..960×0..400.
- **Láser móvil, `periodo`, `desfase`, `laserSegment`, interruptor ordenado, secuencia global, activación por proximidad (jugador activo, fuera→dentro), precedencia de estados:** según Spec 002 (D1–D8, O1).
- **Secuencia esperada por vuelta:** objetivos/condiciones observables por vuelta (V1..Vn) que debe cumplir una solución válida; rutas, posiciones y timings concretos se fijan y validan en implementación/tests.
- **Nivel de campaña:** entrada en la colección de niveles (`LevelDef`/datos equivalentes) con `id`, metadatos en español, elementos y parámetros deterministas.
- **Cierre satisfactorio (N10):** nivel final que integra mecánicas ya conocidas en una resolución coherente y legible, sin introducir mecánicas nuevas, con sensación de culminación del arco de coordinación de vueltas.

## Supuestos y dependencias
- **D-004-1 (Spec 001):** base disponible con canvas 960×400, N1–N4 rediseñados, colección soportada hasta 10 niveles, `maxLaps` 1–6, paleta/identificadores dinámicos para 6 vueltas, selector/navegación escalable y rechazo O1 para datos inválidos.
- **D-004-2 (Spec 002):** mecánicas jugables disponibles conforme a contrato (móvil D8, `laserSegment` D1, secuencia/activación/efecto D2–D3, estado derivado/rewind D4, precedencia D5/F9, feedback UI D6, validación O1). Las verificaciones pueden apoyarse en fixtures en tests donde Spec 002 lo permita (D7), sin modificar niveles de campaña existentes salvo lo requerido por specs aprobadas.
- **D-004-3 (Spec 003):** progresión de campaña hasta N7 establecida (N5 móvil, N6 interruptores+`laserSegment`, N7 combinación), con contratos de resolubilidad/evidencia; N8–N10 continúan y cierran esa progresión.
- **D-004-4:** se preservan contratos numéricos/reglas vigentes salvo lo explícitamente definido por specs aprobadas; `src/game/sim.ts` permanece puro y determinista.
- **D-004-5:** los niveles de esta spec son los ids **8, 9 y 10** de la campaña (colección total de 10). N10 es el último nivel de la colección en este alcance.
- **D-004-6:** geometría, layout y parámetros numéricos concretos (`A/B`, `periodo`, `desfase`, áreas, radios, posiciones, `initialEnabled`, etc.) podrán ajustarse/fijarse en implementación mediante evidencia (tests/trazas reproducibles) y criterio de resolubilidad (RF-10), siempre que se preserven la intención, progresión, mecánicas declaradas y ausencia de mecánicas nuevas.
- **D-004-7:** el estado del repo puede no incluir implementaciones completas de 001–003; la spec define el contrato objetivo y dependencias. Cualquier desviación o bloqueo por base faltante se documenta y escala según corresponda.

## Diseño de niveles (aprobado en intención, mecánicas y composición base; ajuste fino en implementación)

> **Nota (D-004-A a D-004-E):** se aprueban la intención y mecánicas de N8–N10, `maxLaps` (5/5/6, N10 único de 6 vueltas), complejidad (2/1, 3/1–2, 3/2, áreas no ambiguas), composición base equilibrada de N10 y textos en español (base editable). Las geometrías, coordenadas, layout y parámetros numéricos concretos (`A/B`, `periodo`, `desfase`, áreas, radios, posiciones, `initialEnabled`, etc.) son base verificable y podrán ajustarse/fijarse en implementación mediante evidencia (tests/trazas reproducibles) y tests de resolubilidad (RF-12), sin cambiar la intención aprobada, la progresión, la complejidad/composición confirmada ni introducir mecánicas nuevas. Hints, nombres y subtítulos pueden recibir ajustes leves sin cambiar intención ni revelar la solución.

### Nivel 8 — "Cruce medido" (confirmado)
- **Identidad:** `id: 8`, nombre `Cruce medido`, subtítulo `Dos ritmos, un solo hueco.` (base editable).
- **Vueltas:** `maxLaps: 5` (confirmado).
- **Progresión mecánica (D-004-A):** profundiza la **combinación** introducida en N7 (láser móvil + interruptores/`laserSegment`) con coordinación más clara de apoyo por fantasmas; sin mecánicas nuevas.
- **Complejidad confirmada (D-004-C):** **2 interruptores** en secuencia global y **1 `laserSegment`** bloqueante controlado, con áreas de activación no ambiguas.
- **Mecánicas/elementos:** muros, 1–2 placas, 1–2 puertas, **1 láser móvil** A↔B (D8), **1 láser estático** (opcionalmente con `poweredByPlates` si aporta claridad), **2 interruptores ordenados** y **1 `laserSegment`** bloqueante (en láser estático o móvil, referencia explícita por `segmentId`, D1). Uso de fantasmas/rastro para sostener/bloquear según reglas vigentes. Aplica precedencia D5/F9.
- **Intención de puzzle:** coordinar en vueltas sucesivas el sostén de placas/puertas, la ejecución correcta de la secuencia de interruptores y el cruce en ventana segura frente al láser móvil (y bloqueo por fantasma cuando corresponda), manteniendo dificultad media.
- **Hint (minimalista, ES, base editable):** "Medí el ritmo del láser y completá el orden sin apurarte."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** el fantasma 1 establece un estado base (p. ej. placa presionada o posición de bloqueo/sostén) necesario para accesos posteriores.
  - **V2:** el jugador/fantasma 2 logra progreso válido en la secuencia de interruptores o prepara acceso sin dejar un error de orden definitivo que impida la solución al cierre útil.
  - **V3:** se completa la secuencia global correcta (2 interruptores) y queda deshabilitado el `laserSegment` objetivo mientras la secuencia siga correcta, en coordinación con placas/puertas requeridas.
  - **V4:** el fantasma 4 asegura la condición/ventana adicional necesaria frente al láser móvil (sostén o bloqueo según diseño final).
  - **V5:** el jugador alcanza la meta sin morir, con puertas/segmentos/energía/timing satisfechos de forma determinista.
- **Notas:** geometría legible en 960×400; parámetros del móvil y definición del segmento ajustables en implementación (O1, D8, RF-12) sin cambiar intención ni complejidad confirmada.

### Nivel 9 — "Paso a paso" (confirmado)
- **Identidad:** `id: 9`, nombre `Paso a paso`, subtítulo `Cada vuelta deja una pieza en su sitio.` (base editable).
- **Vueltas:** `maxLaps: 5` (confirmado).
- **Progresión mecánica (D-004-A):** incrementa la coordinación respecto de N8 manteniendo dificultad media, con mayor carga de secuencia/segmentos y uso combinado de mecánicas conocidas; sin mecánicas nuevas.
- **Complejidad confirmada (D-004-C):** **3 interruptores** en secuencia global y **1–2 `laserSegment`** controlados, con áreas de activación no ambiguas.
- **Mecánicas/elementos:** muros, 2 placas, 1–2 puertas, **1 láser móvil** A↔B, **1 láser estático** (puede requerir energía por placa o ser controlado parcialmente por segmento según diseño, respetando D5), **3 interruptores ordenados** y **1–2 `laserSegment`** controlados (distribuidos en láser estático y/o móvil, referencias explícitas D1), áreas no ambiguas. Fantasmas/rastro para sostén y bloqueo. Aplica precedencia D5/F9.
- **Intención de puzzle:** exigir planificación por etapas (sostener, ordenar, abrir, cruzar) donde varias vueltas preparan condiciones acumulativas antes de la pasada final.
- **Hint (minimalista, ES, base editable):** "Prepará el camino por partes: sostener, ordenar y después cruzar."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** el fantasma 1 sostiene una placa/condición base requerida durante los tramos necesarios.
  - **V2:** el jugador avanza la secuencia global en orden correcto (progreso parcial) o establece una segunda condición de soporte/acceso.
  - **V3:** se completa la secuencia global correcta (3 interruptores) o se alcanza el estado combinado de segmentos necesario (1–2 segmentos deshabilitados mientras la secuencia sea correcta), coordinado con placas/puertas.
  - **V4:** el fantasma 4 provee bloqueo/sostén crítico frente al láser móvil o mantiene abierta una ventana/condición derivada.
  - **V5:** el jugador alcanza la meta sin morir, cumpliendo todas las condiciones de forma determinista.
- **Notas:** complejidad por coordinación y orden, no por ambigüedad espacial; la cantidad exacta dentro del rango confirmado (1–2 segmentos) y su distribución se fijan en implementación con evidencia, preservando intención y complejidad.

### Nivel 10 — "Última coordinación" (confirmado, cierre de campaña)
- **Identidad:** `id: 10`, nombre `Última coordinación`, subtítulo `Todo lo aprendido, en una sola pasada final.` (base editable).
- **Vueltas:** `maxLaps: 6` (confirmado). **N10 es el único nivel de 6 vueltas** de la campaña (cierre más exigente, máximo permitido, D-004-B).
- **Progresión mecánica (D-004-A):** **cierre satisfactorio** de la campaña mediante integración de mecánicas conocidas (sin mecánicas nuevas): placas, puertas, láseres estáticos y móviles, interruptores ordenados con secuencia global, `laserSegment`, bloqueos por fantasma/rastro y coordinación multi-vuelta.
- **Complejidad confirmada (D-004-C):** **3 interruptores** en secuencia global y **2 `laserSegment`** controlados, con áreas de activación no ambiguas.
- **Composición base equilibrada (D-004-D):** muros, **2 placas**, **2 puertas**, **1 láser móvil** A↔B y **1 láser estático**, **3 interruptores ordenados** y **2 `laserSegment`** (distribución legible y equilibrada entre timing y secuencia; p. ej. con combinaciones de `poweredByPlates` y/o control por segmento según diseño, respetando D5). Fantasmas/rastro esenciales para sostén y bloqueo. Esta composición es base confirmada y permite **ajuste fino en implementación** guiado por evidencia/tests de resolubilidad, sin mecánicas nuevas y preservando intención y complejidad confirmada.
- **Intención de puzzle:** capstone de dificultad media-alta dentro del arco (culminación de campaña) que obliga a usar el repertorio completo de forma planificada y legible; la solución debe sentirse como cierre coherente, no como salto de reglas.
- **Hint (minimalista, ES, base editable):** "Usá cada vuelta con un propósito: al final, todo debe quedar en su lugar."
- **Secuencia esperada por vuelta (objetivos observables):**
  - **V1:** el fantasma 1 establece una condición base persistente (placa/sostén) para habilitar el plan.
  - **V2:** el jugador/fantasma 2 abre o prepara un acceso intermedio y/o inicia progreso correcto en la secuencia.
  - **V3:** se consolida progreso o se completa la secuencia global (3 interruptores) dejando los `laserSegment` objetivo en el estado requerido mientras la secuencia sea correcta.
  - **V4:** el fantasma 4 mantiene una condición crítica (placa, puerta habilitada indirectamente o bloqueo frente a láser) necesaria para la fase final.
  - **V5:** el fantasma 5 sincroniza el cruce/ventana frente al láser móvil o asegura el último soporte requerido.
  - **V6:** el jugador alcanza la meta sin morir, con todas las condiciones satisfechas de forma determinista (cierre de campaña).
- **Notas:** N10 no introduce mecánicas nuevas; cualquier combinación debe respetar contratos de Spec 002. El layout debe priorizar legibilidad y justicia en 960×400. Ajustes finos de parámetros/layout guiados por evidencia (RF-12).

## Requisitos funcionales

### A. Incorporación de niveles 8–10 a la campaña
- **RF-1:** EL SISTEMA deberá incluir los niveles de campaña **8, 9 y 10** en la colección de niveles (datos `LevelDef`/`levels.ts` o fuente de verdad equivalente definida por la implementación), con `id` único correlativo (8, 9, 10), `name`, `subtitle`, `maxLaps` (1–6), `hint` en español, `spawn`, `goal` y definición completa de elementos (`walls`, `plates`, `doors`, `lasers` y, cuando aplique, `laserSegment`/interruptores/secuencia) compatibles con canvas 960×400.
- **RF-2:** CUANDO el jugador acceda al selector/progresión de niveles en una base con soporte para 10 niveles (Spec 001), ENTONCES los niveles 8–10 deberán ser seleccionables/jugables en el orden de campaña definido, completando la colección de 10 niveles, sin romper navegación, contadores ni estados existentes de N1–N7.
- **RF-3:** EL SISTEMA deberá definir para cada nivel 8–10 metadatos visibles en español (nombre, subtítulo, hint) minimalistas, coherentes con la mecánica/progresión ejercitada y con dificultad media con cierre apropiado de campaña. Los textos definidos en esta spec están aprobados como base editable (D-004-E): se permiten ajustes leves sin cambiar intención ni revelar la solución.
- **RF-4:** EL SISTEMA deberá definir N10 como el **nivel final** de la campaña dentro de este alcance, con intención de cierre satisfactorio y sin mecánicas nuevas respecto de Specs 001–003/contratos vigentes.

### B. Mecánicas y contenido por nivel
- **RF-5 (Nivel 8, confirmado, D-004-A/B/C):** EL SISTEMA deberá incluir en el nivel 8 (`maxLaps: 5`) un diseño de dificultad media que **combine** mecánicas conocidas —láser móvil e interruptores ordenados con `laserSegment`, además de placas/puertas/fantasmas según diseño— conforme a Spec 002, sin mecánicas nuevas. Complejidad confirmada: **2 interruptores** y **1 `laserSegment`** bloqueante controlado, con áreas no ambiguas.
- **RF-6 (Nivel 9, confirmado, D-004-A/B/C):** EL SISTEMA deberá incluir en el nivel 9 (`maxLaps: 5`) un diseño de dificultad media/progresiva que incremente la coordinación respecto de N8 usando mecánicas conocidas y combinaciones de Spec 002 (láser móvil, interruptores/`laserSegment`, placas/puertas/fantasmas según diseño), sin mecánicas nuevas. Complejidad confirmada: **3 interruptores** y **1–2 `laserSegment`** controlados, con áreas no ambiguas.
- **RF-7 (Nivel 10, confirmado, D-004-A/B/C/D):** EL SISTEMA deberá incluir en el nivel 10 (`maxLaps: 6`, **único nivel de 6 vueltas**) un diseño de **cierre satisfactorio** que integre el repertorio de mecánicas conocidas de la campaña (placas, puertas, láseres estáticos y móviles, interruptores ordenados, `laserSegment`, bloqueos por fantasma/rastro) conforme a contratos vigentes, sin mecánicas nuevas, con equilibrio entre timing y secuencia. Complejidad confirmada: **3 interruptores** y **2 `laserSegment`** controlados, con áreas no ambiguas. Composición base equilibrada confirmada (p. ej. 1 láser móvil + 1 láser estático, 2 placas, 2 puertas, 3 interruptores, 2 segmentos), con ajuste fino en implementación guiado por evidencia/tests de resolubilidad sin mecánicas nuevas y preservando intención y complejidad confirmada.
- **RF-8:** CUANDO un nivel 8–10 declare láseres móviles, `laserSegment` o interruptores, ENTONCES sus datos deberán cumplir los contratos y validaciones O1 de Spec 002 (ids únicos/referencias válidas, `periodo > 0`, `desfase`/extremos válidos, secuencia/áreas/controles consistentes) y el comportamiento en simulación/UI deberá ser el definido por Spec 002 (D1–D8, D5/F9, D6).
- **RF-9:** EL SISTEMA deberá diseñar los niveles 8–10 para canvas 960×400, con geometría contenida y legible, dificultad media con progresión/cierre apropiado, y soluciones deterministas basadas en grabación/replay de vueltas y contratos vigentes. Se permite ajuste fino de coordenadas, layout y parámetros numéricos en implementación (D-004-6, RF-12) preservando intención, progresión, mecánicas declaradas, complejidad/composición confirmadas y ausencia de mecánicas nuevas.

### C. Resolubilidad, secuencias y verificabilidad
- **RF-10:** PARA cada nivel 8–10, la spec/implementación deberá documentar y hacer verificable una **secuencia esperada por vuelta (V1..Vn)** con objetivos/condiciones observables. Las rutas, posiciones y timings concretos dependientes del layout final deberán fijarse y validarse mediante evidencia automatizada (tests/trazas reproducibles en `src/game/sim.ts`/`src/game/sim.test.ts` o mecanismo equivalente aprobado) durante la implementación.
- **RF-11:** CUANDO se actualicen o añadan pruebas automatizadas para N8–N10, ENTONCES deberán verificarse al menos: **una resolución válida por nivel** que cumpla sus objetivos por vuelta, y **al menos un caso de fallo relevante por nivel** (p. ej. timeout en última vuelta, error de orden/reinicio que impide abrir paso, muerte por láser/móvil, incumplimiento de ventana/timing o condición requerida) coherente con contratos vigentes y Spec 002.
- **RF-12:** SI durante la implementación/validación se determina que un nivel 8, 9 o 10 no es resoluble de forma determinista con su `maxLaps` y mecánicas/complejidad declaradas y aprobadas, ENTONCES la implementación no deberá cerrar la spec como válida: deberá registrar el bloqueo con evidencia reproducible, mantener visible el riesgo y escalar la decisión al usuario (ajustar geometría/parámetros dentro del alcance aprobado por D-004-6, o modificar decisiones de diseño con aprobación explícita) antes de marcar la spec como implementada/validada.
- **RF-13:** EL SISTEMA deberá permitir la verificación visible (dev/build o revisión manual documentada) de que N8–N10 se presentan y operan correctamente en desktop (selector, HUD/timeline, render de elementos y feedback) en coherencia con contratos existentes.

### D. UI, feedback y compatibilidad
- **RF-14:** MIENTRAS el jugador esté en niveles 8–10, EL SISTEMA deberá mostrar feedback/UI coherente con Specs 001–003: indicadores de vueltas/timeline/HUD acordes a `maxLaps`, estados observables de placas/puertas/láseres, y para mecánicas de Spec 002 el feedback mínimo obligatorio en español D6 (progreso `actual/esperado`, mensaje breve de error/reinicio, estado observable de interruptores/`laserSegment`) sin inferir comportamiento no respaldado por simulación/datos.
- **RF-15:** EL SISTEMA deberá preservar el comportamiento y resolubilidad de los niveles 1–7 y contratos existentes, sin regresiones introducidas por la incorporación de N8–N10.
- **RF-16:** CUANDO se complete el nivel 10 en una experiencia que expone la colección completa, ENTONCES el sistema deberá reflejar la finalización del nivel/campaña de forma coherente con los flujos de victoria/progreso ya existentes, sin requerir backend ni persistencia no trivial.

## Requisitos no funcionales
- **RNF-1:** `src/game/sim.ts` deberá permanecer puro y determinista (sin DOM, Canvas, `window`, `React`, temporizadores, aleatoriedad ni I/O); mismo estado/datos + misma entrada ⇒ mismo resultado.
- **RNF-2:** Se deberán preservar contratos numéricos y reglas vigentes salvo lo explícitamente definido por specs aprobadas: canvas lógico 960×400, loop 20 s, 60 Hz, 1201 frames por vuelta, jugador r=12, vel 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, zona segura de spawn 44 px, timeout solo en última vuelta agotada, y reglas/precedencias de Spec 002 para las mecánicas nuevas.
- **RNF-3:** Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, Canvas 2D. Sin dependencias nuevas sin aprobación.
- **RNF-4:** Código, nombres, comentarios y tests en inglés; interfaz, textos de juego, hints, subtítulos y mensajes visibles en español.
- **RNF-5:** Sin backend, cuentas, red, telemetría, secretos ni persistencia de datos personales.
- **RNF-6:** Verificación automatizable: `node --test` en verde para contratos/simulación y niveles afectados (incluidos N8–N10). `npm run lint` y `npm run build` aplican cuando el alcance de implementación los afecte. Cambios visuales requieren verificación visible (dev/build o revisión manual documentada).
- **RNF-7:** Rendimiento adecuado en desktop (objetivo 60 Hz) con las mecánicas y elementos de N8–N10.

## Casos límite
- **CL-1 (Canvas 960×400):** todos los elementos de N8–N10 (muros, spawn, goal, placas, puertas, láseres estáticos/móviles, áreas de interruptores, segmentos) deben quedar contenidos y ser interactuables sin desbordes ni colisiones inválidas por geometría.
- **CL-2 (Láser móvil, D8):** en niveles que lo incluyan, posiciones efectivas en `t=0`, extremos de ciclo, `desfase` normalizable y valores altos de `t`/rewind-seek deben ser deterministas y coherentes con `u(t)`; colisión/bloqueo respeta precedencia D5/F9.
- **CL-3 (Secuencia e interruptores, D2/D3):** permanencia en área no re-dispara activación sin transición fuera→dentro; solo jugador activo activa; error de orden reinicia secuencia y restaura `initialEnabled`; tras reinicio la secuencia puede completarse; al completar, segmentos objetivo permanecen deshabilitados mientras la secuencia siga correcta en el historial hasta `t`. Las áreas de activación deben ser no ambiguas y la complejidad debe respetar la configuración confirmada (N8: 2 interruptores/1 segmento; N9: 3 interruptores/1–2 segmentos; N10: 3 interruptores/2 segmentos).
- **CL-4 (Rewind/seek, D4):** volver antes de activaciones/errores ajusta estado derivado (sin estados fantasma); avanzar/reproducir reaplica eventos en orden determinista.
- **CL-5 (Timeout/victoria/muerte):** agotar la última vuelta sin meta ⇒ derrota por timeout según contrato; victoria solo al alcanzar meta vivo; concurrencia temporal de eventos resuelta de forma coherente y determinista con reglas vigentes. En N10, la victoria debe ser compatible con el flujo de cierre/campaña existente.
- **CL-6 (Datos inválidos O1):** definiciones inválidas de N8–N10 (referencias rotas, `periodo <= 0`, áreas/orden inconsistentes, ids duplicados, extremos inválidos, etc.) deben producir rechazo explícito, determinista y detectable en definición/carga/validación.
- **CL-7 (Regresión):** N1–N7 siguen resolubles y con comportamiento/UI coherente tras añadir N8–N10.
- **CL-8 (Escalabilidad UI):** selector, leyenda de vueltas e indicadores funcionan correctamente con `maxLaps` usados por N8–N10 (1–6) y con la colección completa de 10 niveles.
- **CL-9 (Límite de mecánicas):** N8–N10 no requieren ni introducen mecánicas fuera de las definidas por Specs 001–003 y contratos vigentes.

## Fuera de alcance
- Niveles adicionales más allá de N10 o cambios a la colección que excedan completar ids 8–10.
- Pulido visual/UI global (Spec 005), salvo ajustes mínimos estrictamente necesarios para representar/operar N8–N10 coherentemente con Specs 001–003.
- Nuevas mecánicas no definidas en Spec 002 ni en contratos existentes.
- Cambios de stack, dependencias nuevas no aprobadas, backend, cuentas, red, telemetría o persistencia no trivial.
- Arma/stretch u otras features no especificadas.
- Modificar `AGENTS.md`, `docs/constitution.md` o `PARADOX_LOOP_DISENO.md`.

## Criterios de finalización
- La spec define N8–N10 con identidad, `maxLaps` confirmados (N8=5, N9=5, N10=6; N10 único nivel de 6 vueltas), metadatos/hints en español (base editable, D-004-E), mecánicas/elementos, complejidad confirmada (N8 2/1, N9 3/1–2, N10 3/2, áreas no ambiguas), composición base equilibrada de N10 (D-004-D), intención de progresión y cierre (N10), y secuencias esperadas por vuelta (objetivos observables) verificables.
- Los requisitos EARS (RF/RNF) y casos límite cubren incorporación a campaña (ids 8–10, colección de 10), uso coherente de mecánicas de Spec 002 y existentes, compatibilidad con Specs 001–003/contratos vigentes en 960×400, determinismo y ausencia de mecánicas nuevas.
- La verificación exige evidencia automatizable por nivel (resolución válida + fallo relevante, tests/trazas reproducibles) y revisión visible, con criterio de escalamiento si un nivel no resulta resoluble (RF-12).
- Las dependencias, supuestos y decisiones D-004-A a D-004-E quedan incorporadas; no permanecen dudas abiertas bloqueantes para avanzar a planificación/implementación (riesgo de resolubilidad gestionado por RF-12).

## Decisiones resueltas y dudas abiertas
- **D-004-A (resuelta):** aprobados los conceptos y mecánicas por nivel — N8 "Cruce medido": combinación láser móvil + interruptores/`laserSegment` + placas/puertas; N9 "Paso a paso": mayor coordinación con secuencia/segmentos; N10 "Última coordinación": capstone integrador de todas las mecánicas conocidas, sin mecánicas nuevas.
- **D-004-B (resuelta):** `maxLaps` confirmados — N8=5, N9=5, N10=6. N10 es el único nivel de 6 vueltas (cierre más exigente, máximo permitido).
- **D-004-C (resuelta):** complejidad confirmada — N8: 2 interruptores / 1 segmento; N9: 3 interruptores / 1–2 segmentos; N10: 3 interruptores / 2 segmentos, con áreas no ambiguas.
- **D-004-D (resuelta):** composición de N10 confirmada como base equilibrada (p. ej. 1 láser móvil + 1 láser estático, 2 placas, 2 puertas, 3 interruptores, 2 segmentos; equilibrio entre timing y secuencia), con ajuste fino en implementación guiado por evidencia/tests de resolubilidad sin mecánicas nuevas y preservando intención y complejidad confirmada.
- **D-004-E (resuelta):** nombres, subtítulos y hints en español aprobados como base editable (ajustes leves permitidos sin cambiar intención ni revelar la solución).

**Dudas abiertas:** ninguna bloqueante.

**Riesgo residual declarado (no bloqueante, gestionado por RF-12):** la viabilidad real (rutas/timings y parámetros concretos en 960×400) depende de evidencia en simulación/tests (`node --test`) y revisión visible. Si no se logra evidencia determinista de resolución para un nivel, aplica RF-12 (registro de bloqueo con evidencia y escalamiento al usuario para ajustar geometría/parámetros dentro del alcance aprobado u otra alternativa aprobada explícitamente).
