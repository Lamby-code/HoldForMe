# Handoff 003 — Niveles 5–7 (Google AI Studio)

Copia y pega este prompt en Google AI Studio para implementar la spec aprobada. **La spec es el contrato:** no implementes nada fuera de ella. Si encuentras ambigüedad no cubierta o un nivel no resulta resoluble según RF-10, repórtalo con evidencia reproducible y detente (no inventes comportamiento ni cierres la spec como válida).

---

## Prompt

Actúa como implementador de **Hold For Me (Paradox Loop)**. Implementa `specs/003-niveles-5-7/spec.md` (Estado: borrador revisado con decisiones del usuario 1–5, **aprobada**) siguiendo este handoff y los artefactos de planificación.

### Objetivo y alcance
- Incorporar los niveles de campaña **N5, N6 y N7** (ids 5–7) en canvas lógico **960×400**, con dificultad **media y progresiva**, hints minimalistas en español (base editable), deterministas y verificables.
- **Fuera de alcance:** niveles **8–10** (Spec 004), **pulido visual/UI global** más allá de lo mínimo para operar N5–N7 coherentemente con Specs 001–002 (Spec 005), nuevas mecánicas no definidas, cambios de stack/deps, backend/cuentas/red/telemetría/secretos/persistencia no trivial.

### Base y supuestos (importante)
- Asumir base **Spec 001** y **Spec 002** como vigentes/contrato: canvas 960×400, N1–N4 rediseñados, soporte 10 niveles y `maxLaps` 1–6, UI/colores dinámicos; mecánicas Spec 002 (D1–D8) disponibles: láser móvil A↔B determinista (`P=periodo` ciclo A→B→A, `q=((t+desfase)%P+P)%P`, `u=1-|2q/P-1|`), `laserSegment` entidad referenciable (`id`, `laserId`, geometría/alcance, `initialEnabled`, control por `segmentId`), interruptores/secuencia global con activación por transición **fuera→dentro** solo jugador activo, completar deshabilita segmentos objetivo / error reinicia y restaura `initialEnabled`, estado derivado compatible con **rewind/seek**, precedencia D5/F9 (energía `poweredByPlates` > deshabilitado por secuencia > bloqueado por fantasma/rastro > activo), feedback UI mínimo D6 en español, validación **O1** (rechazo explícito, determinista, detectable).
- **La validación de la implementación de Spec 002 fue omitida por indicación del usuario** y el repo puede no reflejar aún 001/002. **Verifica el estado real** antes de implementar. Si difiere, aplica solo **alineaciones mínimas necesarias** para cumplir Spec 003 (sin ampliar alcance, sin rediseñar N1–N4 salvo corrección estrictamente necesaria y documentada, sin inventar comportamiento). Documenta supuestos/desviaciones en el reporte.


### Decisiones 1–5 y requisitos clave (contrato)
1. **Intención/mecánicas aprobadas, ajuste fino permitido (RF-10):** se aprueba intención y mecánicas de N5–N7. Puedes ajustar fino coordenadas, layout y parámetros numéricos (`A/B`, `periodo`, `desfase`, áreas, `initialEnabled`, etc.) en implementación guiado por **tests de resolubilidad y evidencia reproducible**, preservando intención, progresión, mecánicas y complejidad confirmadas.
2. **`maxLaps`:** N5=3, N6=4, N7=5.
3. **Progresión:** N5 introduce **solo láser móvil** (sin interruptores/`laserSegment`); N6 introduce **solo interruptores ordenados + `laserSegment`** (sin láser móvil); N7 combina **láser móvil + interruptores ordenados/`laserSegment`** con mecánicas existentes según corresponda.
4. **Complejidad:** N6 = **2 interruptores / 1 segmento**, áreas no ambiguas. N7 = **2–3 interruptores / 1–2 segmentos**, áreas no ambiguas.
5. **Textos ES base editable:** nombres/subtítulos/hints aprobados como base (ajustes leves sin cambiar intención ni revelar solución).

**Definiciones de nivel (resumen):**
- **N5 "El pulso"** (`id:5`, `maxLaps:3`): muros, 1 placa, 1 puerta, 1 láser móvil A↔B (bloqueable), meta. Hint: `El láser se mueve con ritmo fijo. Usá tus vueltas para sostener el paso y cruzar en el momento justo.` V1 sostiene placa/puerta; V2 bloquea/sincroniza ventana segura; V3 meta sin morir.
- **N6 "Orden correcto"** (`id:6`, `maxLaps:4`): muros, 1 placa, 1 puerta, 1 láser estático + 2 interruptores secuencia global + 1 `laserSegment` bloqueante (`segmentId`, D1), áreas no ambiguas. Hint: `Activá los interruptores en orden. Si te equivocás, la secuencia vuelve a empezar.` V1 sostiene acceso si aplica; V2 activa 1er interruptor; V3 completa secuencia y deshabilita segmento; V4 meta con segmento deshabilitado.
- **N7 "Sincronía"** (`id:7`, `maxLaps:5`): muros, 1–2 placas, 1–2 puertas, 1 láser móvil A↔B, 2–3 interruptores y 1–2 `laserSegment` (vínculo `laserId` explícito), áreas no ambiguas, precedencia D5/F9. Hint: `Sincronizá tus vueltas: primero dejá el camino listo, después cruzá sin romper el orden.` V1 estado base; V2 progreso parcial sin reinicio definitivo al cierre útil; V3 secuencia completa/segmentos deshabilitados; V4 bloqueo/sostén o condición para ventana final; V5 meta sin morir.

**Exigencias de verificación (RF-9, RF-10, RF-11):** documentar/hacer verificable secuencia esperada V1..Vn por nivel (objetivos observables); rutas/timings concretos fijados en tests/trazas reproducibles. Añadir **resolución válida** y **al menos un fallo relevante** por nivel. Si un nivel no es resoluble de forma determinista con su `maxLaps` y mecánicas/complejidad declaradas: **registrar bloqueo con evidencia reproducible, no cerrar la spec como válida y escalar**.

### Restricciones (no negociables)
- `src/game/sim.ts` **puro y determinista** (sin DOM, Canvas, `window`, React, timers, aleatoriedad, I/O). Mismo estado/datos + misma entrada ⇒ mismo resultado.
- Contratos vigentes: 960×400, 20 s, 60 Hz, **1201 frames/vuelta**, jugador r=12, 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada. Reglas/precedencias Spec 002 cuando aplique.
- **O1:** rechazo explícito, determinista y detectable para datos inválidos/ambiguos (sin normalización silenciosa).
- Sin backend, cuentas, red, telemetría, secretos ni dependencias nuevas.
- Código/nombres/comentarios/tests en **inglés**; UI/textos/hints/subtítulos visibles en **español**.
- No modificar `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`. No crear N8–N10 ni pulido visual global.

### Archivos relevantes y expectativas
- `src/game/levels.ts`: añadir N5, N6, N7 (ids 5–7, datos completos, geometría 960×400 contenida) respetando progresión/complejidad; ajuste fino de parámetros/coords guiado por resolubilidad; mantener N1–N4 salvo corrección mínima indispensable documentada.
- `src/game/sim.test.ts` (u otras suites existentes coherentes): tests deterministas N5–N7 (resolución V1..Vn + ≥1 fallo relevante por nivel) y regresión según base; evidenciar ajuste fino.
- `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`: solo ajustes mínimos necesarios para soportar/representar N5–N7 con contratos 001/002 (estado derivado, feedback D6, selector/HUD/timeline coherentes con `maxLaps`) sin reimplementar Spec 002 fuera de lo necesario ni pulido global.

### Tareas (seguir orden de `tasks.md`)
1. **T1** Verificar base Spec 001/002, ejecutar tests existentes y declarar supuestos/alineaciones mínimas necesarias.
2. **T2** Definir N5 (solo láser móvil, 3 vueltas) en `levels.ts`.
3. **T3** Definir N6 (solo 2 interruptores + 1 segmento, sin móvil, 4 vueltas) en `levels.ts`.
4. **T4** Definir N7 (móvil + 2–3 interruptores + 1–2 segmentos, 5 vueltas) en `levels.ts`.
5. **T5** Añadir/ajustar tests de resolución y fallos relevantes N5–N7; ajuste fino de geometría/parámetros guiado por evidencia (RF-10 si bloqueo).
6. **T6** Verificar/ajustar integración UI mínima y feedback D6 para N6/N7 (sin pulido global).
7. **T7** Verificar regresión N1–N4 y contratos.
8. **T8** Verificación final y reporte.

### Formato de reporte esperado (responder con esto al terminar)
1. **Resumen:** qué se implementó y qué quedó pendiente/bloqueado (incluir estado base 001/002 encontrada).
2. **Archivos cambiados:** lista con breve descripción por archivo.
3. **Verificación ejecutada:** comandos y resultados (`node --test` / `node --test src/game/sim.test.ts`, `npm run lint`, `npm run build`) y verificación UI (N5–N7 seleccionables, `maxLaps` 3/4/5, hints ES, láser móvil N5/N7, feedback D6 N6/N7, sin regresiones evidentes N1–N4).
4. **Evidencia de resolubilidad por nivel:** N5/N6/N7 — test(s) de resolución (objetivos V1..Vn cumplidos) y test(s) de fallo relevante; parámetros/ajustes finos aplicados; o bloqueo RF-10 con evidencia reproducible.
5. **RF cubiertos / evidencia:** mapeo breve RF → cómo se verificó (tests/diff/manual).
6. **Riesgos, decisiones y dudas:** supuestos/desviaciones por base 001/002, ajustes finos realizados, y cualquier ambigüedad (si hubo, debió detenerse/escalarse).
7. **Confirmación de restricciones:** `sim.ts` puro/determinista, sin deps/backend/red/secretos, sin N8–N10, sin pulido visual global, O1 respetado, cambios mínimos fuera de `levels.ts`/tests.

---