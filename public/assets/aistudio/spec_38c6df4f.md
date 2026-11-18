# Spec 002 — Mecánicas jugables: láser móvil e interruptores ordenados
Estado: borrador (revisado con decisiones D1–D8)

## Contexto y objetivo
La Spec 001 (base UI/canvas 960×400, rediseño N1–N4, soporte 10 niveles/6 vueltas, extensibilidad de datos/tipos y UI neutra con rechazo O1) preparó el terreno para nuevas mecánicas. Esta spec define la **lógica jugable completa** de:
1. **Láseres móviles lineales (ida y vuelta):** trayectoria A↔B interpolada de forma determinista según `t`, con `periodo` (frames totales del ciclo A→B→A) y `desfase` inicial.
2. **Interruptores con orden de activación:** secuencia **global** del nivel, numeración/progreso por activación válida, reinicio al error de orden, cuyo efecto es **deshabilitar segmentos de láser bloqueantes** al completar la secuencia correcta para abrir paso (persistente mientras la secuencia siga correcta; en error vuelve al estado inicial).

El objetivo es llevar estas mecánicas a comportamiento real y verificable en `src/game/sim.ts` y a representación/feedback real en `src/game/render.ts` y UI (`src/App.tsx`, componentes/HUD/leyenda), manteniendo determinismo, compatibilidad con rewind/seek, grabación, fantasmas/rastro, placas, puertas y contratos vigentes, sin introducir backend/red/telemetría/secretos ni dependencias nuevas.

Alcance de contenido: puzzle 2D top-down desktop, dificultad media, hints minimalistas. **Esta spec no crea niveles de campaña nuevos (N5–N10)**. La verificación se apoya en tests automatizados y, cuando sea necesario, en **fixtures de datos/constructores definidos en tests** (`src/game/sim.test.ts` u otros tests aprobados en el plan), **sin modificar** el listado de campaña en `src/game/levels.ts`.

**Supuesto de base (declarado por el usuario):** la implementación de Spec 001 es la base vigente (o lo será). Si el estado real del repo difiere, la implementación deberá documentar desviaciones y resolverlas de forma coherente con `docs/constitution.md`, AGENTS y los contratos aquí definidos, sin inventar comportamiento no especificado.

## Usuarios
- **Jugador de puzzle (desktop):** quiere entender y anticipar el movimiento de láseres y el estado/orden de interruptores para resolver el puzzle.
- **Diseñador/autor de niveles:** quiere declarar láseres móviles, `laserSegment`, interruptores ordenados y sus relaciones en datos tipados y obtener comportamiento determinista y validado.
- **Implementador (Google AI Studio) y tester:** necesitan contratos verificables (datos, simulación, render/UI, rewind/fantasmas), casos límite y criterios de aceptación sin ambigüedad.

## Historias de usuario
- HU-1. Como jugador, quiero que los láseres móviles se muevan de forma predecible (ida y vuelta A↔B) según el tiempo del loop, para planificar mis vueltas y las de mis fantasmas.
- HU-2. Como jugador, quiero activar interruptores en el orden indicado y ver mi progreso `actual/esperado` y errores/reinicio, para saber cómo abrir el paso.
- HU-3. Como jugador, quiero que completar la secuencia correcta deshabilite los segmentos bloqueantes definidos y que un error reinicie la secuencia y restaure su estado inicial, para razonar el puzzle de forma consistente.
- HU-4. Como jugador, quiero que el comportamiento de láseres móviles, interruptores y segmentos sea coherente al rebobinar, avanzar y usar fantasmas, para resolver con soluciones deterministas.
- HU-5. Como autor de niveles, quiero definir `laserSegment` e interruptores con referencias por `id` y validación explícita (O1), para evitar configuraciones ambiguas o inválidas.
- HU-6. Como tester, quiero verificar por tests la posición determinista por `t`, la precedencia de estados, la máquina de secuencia global y la coherencia en rewind/seek usando fixtures en tests.

## Definiciones
- **Loop / vuelta / playhead / fantasma / rastro / placa / puerta / meta / rewind:** según Spec 001 y contratos vigentes del proyecto (20 s, 60 Hz, 1201 frames por vuelta, playhead `t`).
- **`t` (tiempo de simulación):** índice/frame de tiempo discreto y determinista del nivel/loop (60 Hz). Todas las mecánicas de esta spec se definen en función de `t` de forma reproducible.
- **Láser (`Laser`):** entidad de haz existente (identificador, extremos/emisor-receptor según modelo vigente, y opcionalmente `poweredByPlates`). Puede ser **estático** (geometría fija) o **móvil** (geometría dependiente de `t`).
- **Láser móvil lineal (A↔B, ida y vuelta):** láser cuya trayectoria efectiva se interpola linealmente entre `A{x,y}` y `B{x,y}` en ping-pong. Requiere `periodo` y `desfase` (frames).
- **`periodo` (D8):** duración en frames del **ciclo completo A→B→A** (ping-pong). Debe ser un valor finito y entero `> 0` (contrato O1). Convención matemática (determinista, sin implementaciones divergentes):
  - `P = periodo`, `q = ((t + desfase) mod P + P) mod P` (fase normalizada en `[0, P)`).
  - Factor de interpolación `u(t) ∈ [0,1]`: `u = 0` en `A`, `u = 1` en `B`, con recorrido ida y vuelta en un ciclo completo. Definición de referencia: `u = 1 - |(2q / P) - 1|`.
  - Posición/segmento móvil resultante: interpolación lineal entre `A` y `B` con `u(t)` (p. ej. `Punto = A + (B-A)*u` para el punto móvil, o aplicación equivalente a los extremos del haz móvil), determinista para todo `t`.
- **`desfase` (offset):** desplazamiento inicial en frames del ciclo, finito y entero (o valor discreto válido definido por contrato O1), aplicado en el cálculo de `q`.
- **`laserSegment` (entidad propia referenciable, D1):** entidad independiente con `id` propio que representa un tramo de láser controlable por secuencia. Campos mínimos verificables (nombres exactos a concretar en plan, semántica obligatoria):
  - `id`: identificador único del segmento.
  - `laserId`: referencia explícita al `Laser` (estático o móvil) al que pertenece/afecta.
  - Geometría/alcance del segmento: definición explícita y determinista (p. ej. extremos propios, o parámetros/proporción sobre el haz del láser referenciado) suficiente para evaluar colisión/estado; si el láser es móvil, el segmento se evalúa sobre la geometría efectiva del láser en `t`.
  - `initialEnabled` (o equivalente): estado inicial **habilitado/deshabilitado** del segmento al iniciar/reiniciar el contexto de evaluación según esta spec.
  - Control: elegible para ser controlado por la secuencia global mediante referencias de interruptores a `segmentId`.
- **Interruptor ordenado:** elemento interactuable con identidad/posición/área y un **índice de orden** en la secuencia global. Su activación válida es generada **solo por el jugador activo** (los fantasmas no activan interruptores). Los interruptores referencian segmentos controlables por `id` de `laserSegment`.
- **Área de activación (tipo placa):** zona de proximidad/área asociada al interruptor evaluada de forma determinista por `t` con umbral explícito y verificable (regla tipo placa: p. ej. distancia centro-a-centro `<= radioInterruptor + radioJugador` o umbral equivalente documentado y coherente con contratos existentes). Debe ser testeable.
- **Activación (evento de intento, D3):** se produce en un frame `t` cuando el jugador activo **cumple** la condición de área y **no la cumplía** en el frame evaluado inmediatamente anterior dentro de la misma evaluación determinista (transición de entrada fuera→dentro). Esta transición genera exactamente un intento de activación por entrada, evitando repetición por permanencia en frames consecutivos.
- **Activación válida:** intento de activación sobre el interruptor cuyo orden es el **siguiente esperado** en la secuencia global.
- **Error de orden:** intento de activación sobre un interruptor distinto del siguiente esperado (u otra violación de orden definida de forma determinista). Provoca reinicio de la secuencia.
- **Secuencia global de orden:** máquina de estados única del nivel que define el orden esperado de interruptores (1..N o equivalente). Estado mínimo observable: `actual` (progreso completado) y `esperado` (siguiente orden/interruptor), más indicador de error/reinicio reciente cuando aplique.
- **Completar secuencia:** alcanzar el estado en que todos los pasos/interruptores requeridos fueron activados válidamente en orden.
- **Efecto sobre segmentos (D2):** al **completar** la secuencia correcta, los `laserSegment` objetivo definidos como bloqueantes se **deshabilitan** para abrir paso. Este efecto **permanece mientras la secuencia siga correcta**. Si ocurre un **error de orden**, la secuencia se **reinicia** y los segmentos controlados vuelven a su **estado inicial** (`initialEnabled` u equivalente) definido en datos/nivel.
- **Estado declarado/derivado:** valor de configuración o resultado determinista de la simulación en `t`, apto para mostrarse en UI sin inferencia no respaldada.

## Requisitos funcionales

### A. Modelo de datos y validación (D1, D7, O1)
- **RF-1 (Láser móvil):** EL SISTEMA deberá permitir declarar en tipos/datos de nivel (`LevelDef`/estructuras asociadas) láseres móviles lineales con, como mínimo: `id`, extremos `A{x,y}` y `B{x,y}`, `periodo` (frames, ciclo completo A→B→A), `desfase` (frames) y compatibilidad opcional con `poweredByPlates` cuando aplique.
- **RF-2 (`laserSegment`):** EL SISTEMA deberá permitir declarar `laserSegment` como entidad propia referenciable con, como mínimo: `id` único, `laserId` (vínculo explícito a un `Laser` estático o móvil), geometría/alcance determinista del segmento (propia o relativa al láser referenciado), `initialEnabled` y metadatos necesarios para evaluación/render verificable. El segmento deberá poder pertenecer a un láser móvil o estático.
- **RF-3 (Interruptores y secuencia):** EL SISTEMA deberá permitir declarar interruptores ordenados con, como mínimo: `id`, orden/posición en la secuencia global, área de activación tipo placa (posición y radio/umbral explícito) y lista de `segmentId` (`laserSegment.id`) que controla según el efecto definido. La secuencia global del nivel deberá ser derivable de forma inequívoca de los datos.
- **RF-4 (Validación O1):** CUANDO se carguen/validen definiciones de nivel que incluyan láseres móviles, `laserSegment` o interruptores ordenados, EL SISTEMA deberá aplicar **rechazo explícito (O1)**, determinista y detectable, ante datos inválidos o ambiguos, incluyendo como mínimo: `periodo <= 0`, `periodo`/`desfase` no finitos o no válidos según contrato discreto, extremos `A`/`B` inválidos o no utilizables, `laserId` o `segmentId` inexistentes, duplicados de `id` donde corresponda, orden/secuencia inconsistente o incompleta, área de activación inválida, o relaciones de control incompletas.
- **RF-5 (Compatibilidad y fixtures, D7):** EL SISTEMA deberá preservar compatibilidad de datos con niveles de campaña existentes que no usen estas mecánicas. La verificación de estas mecánicas deberá usar **fixtures de datos/constructores en tests** (`src/game/sim.test.ts` u otros tests aprobados en plan) y **no deberá modificar** el listado/contenido de campaña en `src/game/levels.ts`.

### B. Simulación: láser móvil y precedencia (D5, D8, F9)
- **RF-6 (Movimiento determinista, D8):** MIENTRAS un láser móvil esté definido, EL SISTEMA deberá calcular su geometría/posición efectiva en cada `t` mediante interpolación lineal ida y vuelta A↔B usando `periodo` (ciclo completo A→B→A) y `desfase`, conforme a: `q = ((t + desfase) mod P + P) mod P`, `u = 1 - |(2q / P) - 1|`, con resultado determinista para mismo estado/datos y mismo `t`.
- **RF-7 (Evaluación de segmentos móviles):** CUANDO un `laserSegment` pertenezca a un láser móvil, EL SISTEMA deberá evaluar su geometría y colisión en función de la posición/estado efectivo del láser en `t`, combinando movimiento y estado de habilitación de forma determinista.
- **RF-8 (Precedencia de estados, D5/F9):** EL SISTEMA deberá aplicar la siguiente precedencia determinista (de mayor a menor prioridad) para determinar si un láser/segmento es dañino en `t`:
  1. **Apagado por energía (`poweredByPlates`):** si la condición `poweredByPlates` del láser aplicable no se cumple, el láser/segmento asociado es **inactivo/no dañino** (inactivo total por energía).
  2. **Deshabilitado por interruptor/secuencia:** si el `laserSegment` está deshabilitado por el estado de secuencia/control, es **no dañino/abre paso**.
  3. **Bloqueado por fantasma/rastro:** si aplica bloqueo según reglas vigentes, el haz/segmento se considera **truncado/bloqueado** a partir del punto de bloqueo (no dañino más allá del bloqueo), de forma determinista.
  4. **Activo/dañino:** en trayectoria/alcance efectivo normal.
- **RF-9 (Interacciones láser móvil):** EL SISTEMA deberá tratar un láser móvil como **bloqueable por fantasma/rastro igual que un láser estático** (según reglas vigentes) y permitir que tenga `laserSegment` controlados por interruptores; movimiento, energía, control por secuencia y bloqueo se combinan según RF-8.
- **RF-10 (Colisión):** CUANDO el jugador activo intersecte un tramo/segmento de láser que resulte **activo/dañino** tras aplicar RF-8 en `t`, EL SISTEMA deberá aplicar la consecuencia de colisión/muerte por láser conforme a los contratos existentes de la simulación, de forma determinista.

### C. Simulación: interruptores, secuencia global y rewind (D2, D3, D4, F10)
- **RF-11 (Activación por proximidad, solo jugador, D3):** EL SISTEMA deberá evaluar interruptores por proximidad/área tipo placa en cada `t` de forma determinista. **Solo el jugador activo** podrá generar intentos de activación; los fantasmas **no** activarán interruptores. CUANDO el jugador activo realice una transición fuera→dentro del área válida de un interruptor en `t` (y no cumplía en la evaluación anterior), EL SISTEMA deberá generar exactamente un intento de activación para ese interruptor en `t`.
- **RF-12 (Avance de secuencia, D2):** CUANDO se produzca una **activación válida** del interruptor correspondiente al siguiente orden esperado, EL SISTEMA deberá registrar el avance de la secuencia global (incremento de `actual`/actualización de `esperado`) de forma determinista.
- **RF-13 (Error y reinicio, D2):** SI se produce un **error de orden** al intentar activar un interruptor, ENTONCES EL SISTEMA deberá reiniciar la secuencia global al estado inicial y restaurar todos los `laserSegment` controlados por dicha secuencia a su **estado inicial** (`initialEnabled`), dejando constancia observable del error/reinicio para UI en el contexto de `t`.
- **RF-14 (Compleción y persistencia, D2):** CUANDO la secuencia global se complete correctamente, EL SISTEMA deberá deshabilitar los `laserSegment` bloqueantes objetivo definidos para abrir paso, y ese efecto deberá **permanecer mientras la secuencia siga correcta** (sin error de orden posterior en el historial evaluado hasta `t`).
- **RF-15 (Estado derivado y rewind/seek, D4/F10):** EL SISTEMA deberá calcular el estado de interruptores, secuencia global y `laserSegment` como **resultado determinista y reproducible del historial/eventos hasta `t`** (derivado del replay/estado grabado del playhead y sus transiciones). CUANDO se realice **rewind/seek** a un `t` pasado, EL SISTEMA deberá ajustar el estado/historial efectivo a los eventos hasta ese `t`, sin estados fantasma, sin temporizadores no deterministas y sin persistencia oculta entre vueltas salvo lo grabado/reproducible por replay según contratos existentes.

### D. Render y UI (feedback real, D6)
- **RF-16 (Láseres móviles en render):** CUANDO un nivel contenga láseres móviles, EL SISTEMA deberá representar en canvas/render su posición/estado relevante coherente con la simulación en `t`, distinguiendo visualmente estados aplicables (p. ej. apagado por energía, deshabilitado por secuencia, bloqueado, activo) de forma observable.
- **RF-17 (Feedback mínimo obligatorio de secuencia, D6):** CUANDO un nivel contenga interruptores ordenados y/o `laserSegment` controlables, EL SISTEMA deberá mostrar en español y de forma minimalista: **(a)** indicador de progreso/orden `actual/esperado` de la secuencia, **(b)** mensaje breve visible ante **error/reinicio**, y **(c)** representación observable del estado de interruptores/segmentos implicados (habilitado/deshabilitado, activo/inactivo u equivalente) coherente con simulación.
- **RF-18 (Claridad y consistencia):** EL SISTEMA deberá mantener legibilidad, consistencia con paleta/estilo existente y accesibilidad razonable de los indicadores, sin sobrecargar el canvas ni introducir dependencias nuevas.
- **RF-19 (Niveles sin mecánicas):** SI un nivel no usa estas mecánicas, ENTONCES EL SISTEMA no deberá mostrar indicadores específicos innecesarios ni alterar su comportamiento visual/funcional fuera de lo requerido.

### E. Verificación
- **RF-20 (Tests de simulación):** EL SISTEMA deberá ser verificable mediante tests automatizados (`node --test`, incluyendo `src/game/sim.test.ts` u otros archivos aprobados en plan) que cubran, como mínimo: movimiento determinista de láser móvil por `t` (convención D8), precedencia RF-8 (incluido `poweredByPlates`), activación solo por jugador activo y transición de entrada, avance correcto, reinicio por error con restauración de estado inicial, persistencia del efecto mientras la secuencia sea correcta, efecto sobre `laserSegment` y coherencia en rewind/seek.
- **RF-21 (Fixtures en tests, D7):** CUANDO se requieran niveles/datos para verificar estas mecánicas, EL SISTEMA deberá emplear fixtures/constructores en tests y **no** añadir ni modificar niveles de campaña en `src/game/levels.ts`.

## Requisitos no funcionales
- **RNF-1:** `src/game/sim.ts` deberá permanecer puro y determinista: sin DOM, Canvas, `window`, `React`, temporizadores, aleatoriedad ni I/O; mismo estado/datos + misma entrada ⇒ mismo resultado.
- **RNF-2:** Las mecánicas deberán integrarse preservando contratos vigentes salvo lo explícitamente modificado por specs aprobadas: canvas lógico 960×400, loop 20 s, 60 Hz, 1201 frames por vuelta, jugador r=12, vel 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, zona segura de spawn 44 px, timeout solo en última vuelta agotada, fantasmas/rastro sólidos y reglas vigentes de colisiones/láser aplicables.
- **RNF-3:** Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, Canvas 2D. Sin dependencias nuevas sin aprobación.
- **RNF-4:** Código, nombres, comentarios y tests en inglés; interfaz, textos de juego, hints, leyendas y mensajes visibles en español.
- **RNF-5:** Sin backend, cuentas, red, telemetría, secretos ni persistencia de datos personales.
- **RNF-6:** Verificación con `node --test`; `npm run lint` y `npm run build` se consideran en el plan/tareas cuando aplique al alcance de implementación.
- **RNF-7:** Rendimiento adecuado en desktop (objetivo 60 Hz) sin cómputo no acotado por frame derivado de estas mecánicas.

## Casos límite
- **Validación O1:** `periodo <= 0`, `periodo`/`desfase` no finitos o no válidos, `A == B` o extremos inválidos, `laserId`/`segmentId` inexistentes, `id` duplicados, secuencia/orden inconsistente, área inválida, referencias de control incompletas ⇒ rechazo explícito, determinista y detectable.
- **Ciclo y bordes (D8):** `t = 0`, valores altos de `t`, `desfase` positivo/negativo normalizable, extremos de trayectoria (alcance de A y B dentro del ciclo) y múltiples vueltas/rewind ⇒ posición `u(t)` y geometría deterministas conforme a la fórmula definida.
- **Energía y precedencia (F9/D5):** láser con `poweredByPlates` no cumplido ⇒ inactivo total aunque el segmento esté habilitado por secuencia o no bloqueado; segmento deshabilitado por secuencia ⇒ no dañino aunque haya energía y trayectoria libre; bloqueo por fantasma/rastro ⇒ truncado cuando corresponde.
- **Láser móvil controlado:** combinación de movimiento en `t`, estado inicial/habilitado por secuencia y bloqueo por fantasma; el resultado final respeta RF-8 en todo `t`.
- **Activación determinista (D3):** permanencia continua dentro del área no genera nuevos intentos sin transición fuera→dentro; paso rápido por múltiples interruptores en frames consecutivos se resuelve en orden de evaluación determinista por `t`; solo jugador activo genera intentos.
- **Secuencia (D2):** activación válida avanza progreso; error reinicia y restaura `initialEnabled`; tras reinicio puede completarse nuevamente; al completar, segmentos objetivo permanecen deshabilitados mientras no haya error posterior en el historial evaluado.
- **Rewind/seek (D4/F10):** volver a un `t` anterior a una activación/error elimina su efecto en el estado derivado a ese punto; avanzar/reproducir reaplica eventos en orden; sin estados fantasma ni persistencia oculta entre vueltas fuera de lo grabado/reproducible.
- **Compatibilidad:** niveles existentes (N1–N4) y niveles sin estas mecánicas no presentan regresiones en simulación, render ni UI.
- **Conflictos temporales:** si en el mismo tramo temporal concurren colisión letal, timeout o victoria, el resultado debe ser coherente con reglas vigentes y determinista.

## Fuera de alcance
- Crear o balancear niveles de campaña N5–N10.
- Añadir o modificar niveles/fixtures de campaña en `src/game/levels.ts` para estas mecánicas (solo fixtures/constructores en tests, D7).
- Mecánicas distintas a láser móvil lineal (A↔B, ida y vuelta) e interruptores ordenados con secuencia global y control de `laserSegment`.
- Cambios de stack, dependencias nuevas no aprobadas, backend, cuentas, red, telemetría o persistencia no trivial.
- Arma/stretch u otras features no especificadas.
- Modificar `AGENTS.md`, `docs/constitution.md` o `PARADOX_LOOP_DISENO.md`.
- Rediseñar nuevamente N1–N4 o alterar su intención, salvo corrección estrictamente necesaria y aprobada en spec para compatibilidad con la base 001.

## Criterios de finalización
- La spec define de forma verificable el modelo de datos y validación O1 para láser móvil, `laserSegment` (entidad propia referenciable, D1) e interruptores ordenados con referencias por `segmentId`, sin uso de fixtures en `src/game/levels.ts` (D7).
- La spec define la convención matemática del movimiento A→B→A (D8), la máquina de secuencia global (avance, error/reinicio, compleción y persistencia mientras sea correcta, D2), la activación por proximidad solo del jugador activo (D3) y el estado derivado/reproducible en rewind/seek (D4, F10).
- La spec fija la precedencia determinista (F9, D5): `poweredByPlates` > deshabilitado por secuencia/segmento > bloqueado por fantasma/rastro > activo/dañino, incluyendo láser móvil bloqueable y combinable con segmentos controlados.
- La spec define el feedback UI mínimo obligatorio en español (a: `actual/esperado`, b: mensaje breve de error/reinicio, c: estado observable de interruptores/segmentos, D6) y representación coherente de láseres móviles.
- La spec mantiene compatibilidad con contratos y restricciones vigentes y puede servir como contrato de implementación para Google AI Studio y base para `plan.md`, `tasks.md` y `handoff.md`.

## Dudas abiertas
- Ninguna. Las dudas D1–D8 fueron resueltas por decisiones explícitas del usuario e incorporadas en esta revisión (F1–F10 atendidos). Si durante la planificación o implementación surge una ambigüedad no cubierta por estos contratos, deberá registrarse y escalarse antes de implementar comportamiento no especificado.