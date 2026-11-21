# Handoff 004 — Niveles 8–10 (Google AI Studio)

Copia y pega este prompt en Google AI Studio para implementar la spec aprobada. **La spec es el contrato:** no implementes nada fuera de ella. Si encuentras ambigüedad no cubierta o un nivel no resulta resoluble según RF-12, repórtalo con evidencia reproducible y detente (no inventes comportamiento ni cierres la spec como válida).

---

## Prompt

Actúa como implementador de **Hold For Me (Paradox Loop)**. Implementa `specs/004-niveles-8-10/spec.md` (Estado: borrador revisado con decisiones del usuario D-004-A a D-004-E, **aprobada**) siguiendo este handoff y los artefactos de planificación.

### Objetivo y alcance
- Incorporar los niveles de campaña **N8, N9 y N10** (ids 8–10) en canvas lógico **960×400**, completando la colección de **10 niveles**, con dificultad **media con progresión y cierre apropiado**, hints minimalistas en español (base editable), deterministas y verificables, **sin mecánicas nuevas**.
- **N10** es el **nivel final/cierre satisfactorio** de la campaña (capstone integrador de mecánicas conocidas) y el **único nivel de 6 vueltas**.
- **Fuera de alcance:** niveles más allá de N10, **pulido visual/UI global** (Spec 005) salvo ajustes mínimos estrictamente necesarios para operar/representar N8–N10, nuevas mecánicas, cambios de stack/deps, backend/cuentas/red/telemetría/secretos/persistencia no trivial, arma/stretch.

### Base y supuestos (importante)
- Asumir como vigentes/contrato las **Specs 001–003**:
  - **Spec 001:** canvas 960×400, N1–N4 rediseñados, soporte de colección hasta 10 niveles, `maxLaps` 1–6, paleta/identificadores dinámicos para 6 vueltas, selector/UI escalable, validación O1 base, contratos numéricos/reglas vigentes.
  - **Spec 002 (D1–D8):** láser móvil lineal A↔B determinista (`P=periodo` ciclo A→B→A, `q=((t+desfase)%P+P)%P`, `u=1-|2q/P-1|`), `laserSegment` entidad referenciable (`id`, `laserId`, geometría/alcance, `initialEnabled`, control por `segmentId`), interruptores/secuencia global con activación por transición **fuera→dentro** solo jugador activo, completar deshabilita segmentos objetivo / error reinicia y restaura `initialEnabled`, estado derivado compatible con **rewind/seek**, precedencia D5/F9 (energía `poweredByPlates` > deshabilitado por secuencia > bloqueado por fantasma/rastro > activo), feedback UI mínimo D6 en español (`actual/esperado`, mensaje breve error/reinicio, estado observable de interruptores/segmentos), validación **O1** (rechazo explícito, determinista, detectable).
  - **Spec 003:** N5–N7 incorporados con progresión establecida (N5 móvil, N6 interruptores+segmento, N7 combinación).
- **La validación de implementación de Spec 003 fue omitida por indicación del usuario** y el repo puede no reflejar aún 001–003. **Verifica el estado real** antes de implementar (ej. `levels.ts` puede estar en 960×600 con 4 niveles). Si difiere, aplica solo **alineaciones mínimas necesarias** para cumplir Spec 004 (sin ampliar alcance, sin rediseñar N1–N4 salvo corrección estrictamente necesaria y documentada, sin inventar comportamiento ni normalizar datos inválidos silenciosamente). Documenta supuestos/desviaciones y alineaciones aplicadas en el reporte.

### Decisiones D-004-A a D-004-E y requisitos clave (contrato)
- **A (conceptos/mecánicas aprobados):**
  - **N8 "Cruce medido"**: combina láser móvil + interruptores/`laserSegment` + placas/puertas (profundiza N7), sin mecánicas nuevas.
  - **N9 "Paso a paso"**: mayor coordinación con secuencia/segmentos (sostener, ordenar, abrir, cruzar), sin mecánicas nuevas.
  - **N10 "Última coordinación"**: capstone integrador de todas las mecánicas conocidas, cierre satisfactorio, sin mecánicas nuevas.
- **B (`maxLaps` y rol):** **N8=5, N9=5, N10=6**. **N10 es el único nivel de 6 vueltas** (cierre más exigente, máximo permitido). Ningún otro nivel debe quedar con 6 vueltas.
- **C (complejidad):** **N8: 2 interruptores / 1 segmento**; **N9: 3 interruptores / 1–2 segmentos**; **N10: 3 interruptores / 2 segmentos**; áreas de activación **no ambiguas**.
- **D (composición N10, base equilibrada):** muros, **2 placas, 2 puertas, 1 láser móvil A↔B, 1 láser estático, 3 interruptores, 2 segmentos** (distribución legible, equilibrio timing/secuencia; p. ej. con `poweredByPlates` y/o control por segmento según diseño respetando D5/F9). Ajuste fino en implementación guiado por evidencia/tests de resolubilidad (RF-12) sin mecánicas nuevas y preservando intención/complejidad.
- **E (textos ES, base editable):**
  - N8: nombre `Cruce medido`, subtítulo `Dos ritmos, un solo hueco.`, hint `Medí el ritmo del láser y completá el orden sin apurarte.`
  - N9: nombre `Paso a paso`, subtítulo `Cada vuelta deja una pieza en su sitio.`, hint `Prepará el camino por partes: sostener, ordenar y después cruzar.`
  - N10: nombre `Última coordinación`, subtítulo `Todo lo aprendido, en una sola pasada final.`, hint `Usá cada vuelta con un propósito: al final, todo debe quedar en su lugar.`
  Ajustes leves permitidos sin cambiar intención ni revelar solución.

**Secuencias esperadas por vuelta (objetivos observables, verificables en tests/trazas; rutas/timings concretos se fijan en implementación):**
- **N8 (V1–V5):** V1 estado base (placa/bloqueo/sostén); V2 progreso válido de secuencia o acceso sin error definitivo al cierre útil; V3 secuencia completa (2) y segmento deshabilitado coordinado con placas/puertas; V4 condición/ventana adicional frente a láser móvil; V5 meta sin morir con condiciones satisfechas.
- **N9 (V1–V5):** V1 sostiene placa/condición base; V2 progreso parcial en orden o segunda condición de soporte/acceso; V3 secuencia completa (3) o estado combinado de 1–2 segmentos deshabilitados coordinado con placas/puertas; V4 bloqueo/sostén crítico frente a láser móvil o ventana/condición derivada; V5 meta sin morir.
- **N10 (V1–V6, cierre):** V1 condición base persistente; V2 acceso intermedio y/o inicio de progreso correcto; V3 secuencia completa (3) con segmentos objetivo en estado requerido; V4 condición crítica mantenida; V5 sincronización de cruce/ventana móvil o último soporte; V6 meta sin morir (cierre de campaña).

**Requisitos de verificación (RF-10, RF-11, RF-12, RF-13):** secuencias V1..Vn verificables por evidencia automatizada (tests/trazas reproducibles). Añadir **resolución válida** y **al menos un fallo relevante** por nivel. Ajuste fino de geometría/parámetros permitido (D-004-6) preservando intención, progresión, mecánicas, complejidad/composición confirmadas. Si un nivel no es resoluble de forma determinista con su `maxLaps` y mecánicas/complejidad/composición confirmadas: **registrar bloqueo con evidencia reproducible, no cerrar la spec como válida y escalar**. Incluir verificación visible en desktop.

### Restricciones (no negociables)
- `src/game/sim.ts` **puro y determinista** (sin DOM, Canvas, `window`, React, timers, aleatoriedad, I/O). Mismo estado/datos + misma entrada ⇒ mismo resultado.
- Contratos vigentes: 960×400, 20 s, 60 Hz, **1201 frames por vuelta**, jugador r=12, 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada. Reglas/precedencias Spec 002 (D1–D8, D5/F9) cuando aplique.
- **O1:** rechazo explícito, determinista y detectable para datos inválidos/ambiguos (sin normalización silenciosa).
- Sin backend, cuentas, red, telemetría, secretos ni dependencias nuevas.
- Código/nombres/comentarios/tests en **inglés**; UI/textos/hints/subtítulos visibles en **español**.
- No modificar `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`. **No nuevas mecánicas, no pulido visual global**.

### Archivos relevantes y expectativas
- `src/game/levels.ts`: añadir N8, N9, N10 (ids 8–10, datos completos, geometría 960×400 contenida, parámetros O1 válidos) respetando A–E; ajuste fino guiado por resolubilidad; mantener niveles existentes salvo corrección mínima indispensable documentada. Colección final de 10 niveles con **N10 único de 6 vueltas**.
- `src/game/sim.test.ts` (u otras suites existentes coherentes): tests deterministas N8–N10 (resolución V1..Vn + ≥1 fallo relevante por nivel) y regresión según base; evidenciar ajuste fino.
- `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`: solo ajustes mínimos necesarios para soportar/representar N8–N10 con contratos 001–003 (estado derivado, mecánicas D1–D8, feedback D6, selector/HUD/timeline/hints/cierre coherente al completar N10) sin reimplementar Spec 002 fuera de lo necesario ni pulido global.

### Tareas (seguir orden de `tasks.md`)
1. **T1** Verificar base Spec 001–003, ejecutar tests existentes y declarar supuestos/alineaciones mínimas necesarias.
2. **T2** Definir N8 (5 vueltas, 2 interruptores/1 segmento, combinación móvil+interruptores/segmento) en `levels.ts`.
3. **T3** Definir N9 (5 vueltas, 3 interruptores/1–2 segmentos, mayor coordinación) en `levels.ts`.
4. **T4** Definir N10 (6 vueltas, único de 6, 3 interruptores/2 segmentos, composición base equilibrada, cierre) en `levels.ts`.
5. **T5** Añadir/ajustar tests de resolución y fallos relevantes N8–N10; ajuste fino de geometría/parámetros guiado por evidencia (RF-12 si bloqueo).
6. **T6** Verificar/ajustar integración UI mínima y feedback D6/cierre para N8–N10 (sin pulido global).
7. **T7** Verificar regresión de niveles existentes y contratos (colección 10 niveles, N10 único de 6).
8. **T8** Verificación final y reporte.

### Formato de reporte esperado (responder con esto al terminar)
1. **Resumen:** qué se implementó y qué quedó pendiente/bloqueado (incluir estado de base 001–003 encontrada y alineaciones mínimas aplicadas).
2. **Archivos cambiados:** lista con breve descripción por archivo (diff/resumen).
3. **Verificación ejecutada:** comandos y resultados (`node --test` / `node --test src/game/sim.test.ts`, `npm run lint`, `npm run build`) y **verificación UI visible** (N8–N10 seleccionables en colección de 10, `maxLaps` 5/5/6 con N10 único de 6, hints/textos ES, mecánicas/feedback D6 coherentes, cierre al completar N10, sin regresiones evidentes en niveles existentes).
4. **Evidencia de resolubilidad por nivel:** N8/N9/N10 — test(s) de resolución (objetivos V1..Vn cumplidos) y test(s) de fallo relevante; parámetros/ajustes finos aplicados; o bloqueo RF-12 con evidencia reproducible.
5. **RF cubiertos / evidencia:** mapeo breve RF → cómo se verificó (tests/diff/manual).
6. **Riesgos, decisiones y dudas:** supuestos/desviaciones por base 001–003, ajustes finos realizados, confirmación de N10 único de 6 y composición/complejidad preservadas, y cualquier ambigüedad (si hubo, debió detenerse/escalarse).
7. **Confirmación de restricciones:** `sim.ts` puro/determinista, sin deps/backend/red/secretos, sin mecánicas nuevas, sin pulido visual global, O1 respetado, cambios mínimos fuera de `levels.ts`/tests.

---
