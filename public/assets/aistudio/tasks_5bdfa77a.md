# Tasks 004 — Niveles 8–10

Spec aprobada: `specs/004-niveles-8-10/spec.md` (D-004-A a D-004-E). Plan: `specs/004-niveles-8-10/plan.md`. Orden de dependencia T1→T8. Sin mecánicas nuevas, sin pulido visual global (Spec 005). **Implementación por Google AI Studio.**

- [ ] **T1. Verificar base Spec 001–003 y declarar supuestos de alineación mínima.** (D-004-1 a D-004-4, D-004-7, RF-15, RNF-1, RNF-2, RNF-6)
  - Archivos: lectura de `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`, `src/game/sim.test.ts` (modificación solo si se requiere ajuste mínimo indispensable y documentado; preferir registrar en reporte).
  - Dependencias: ninguna.
  - Hecho cuando: se confirma el estado real de base (canvas/dimensiones, formato de niveles, soporte 10 niveles/`maxLaps` 1–6, mecánicas Spec 002 D1–D8/O1/D6, presencia de N5–N7 o N1–N4) y se documentan supuestos/desviaciones; si faltan piezas necesarias para N8–N10, se acota el conjunto mínimo de ajustes alineados a 001–003 sin ampliar alcance.
  - Evidencia: `node --test` ejecutado (resultado registrado) + notas de verificación/diff y supuestos en reporte.

- [ ] **T2. Definir Nivel 8 "Cruce medido" (id 8, 5 vueltas, 2 interruptores / 1 segmento).** (RF-1, RF-2, RF-3, RF-5, RF-8, RF-9, RF-14, CL-1, CL-2, CL-3, CL-6, CL-9)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en `src/game/sim.ts`/`render.ts`/`colors.ts`/UI solo si la base 001–003 no soporta el caso declarado).
  - Dependencias: T1.
  - Hecho cuando: N8 añadido a la campaña con `id:8`, `maxLaps:5`, nombre/subtítulo/hint en español (base editable D-004-E), geometría 960×400 contenida, mecánicas confirmadas D-004-A (láser móvil + interruptores/`laserSegment` + placas/puertas/fantasmas), complejidad **2 interruptores / 1 segmento** con áreas no ambiguas (D-004-C), datos válidos O1 y coherentes con D1–D8/D5, intención/secuencia V1–V5 observable. Parámetros/coords sujetos a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos + ausencia de rechazo O1 + verificación visual en dev si es posible.

- [ ] **T3. Definir Nivel 9 "Paso a paso" (id 9, 5 vueltas, 3 interruptores / 1–2 segmentos).** (RF-1, RF-2, RF-3, RF-6, RF-8, RF-9, RF-14, CL-1, CL-2, CL-3, CL-6, CL-9)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en sim/render/UI solo si la base no soporta el caso declarado).
  - Dependencias: T1.
  - Hecho cuando: N9 añadido con `id:9`, `maxLaps:5`, textos ES base editable, geometría 960×400 contenida, mecánicas confirmadas D-004-A (mayor coordinación), complejidad **3 interruptores / 1–2 segmentos** con áreas no ambiguas (D-004-C), referencias `segmentId`/`laserId` y parámetros explícitos/válidos (O1, D1–D8, D5), intención/secuencia V1–V5 observable, sin romper N8. Sujeto a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos + ausencia de rechazo O1 + verificación visual si disponible.

- [ ] **T4. Definir Nivel 10 "Última coordinación" (id 10, 6 vueltas, único de 6, 3 interruptores / 2 segmentos, cierre).** (RF-1, RF-2, RF-3, RF-4, RF-7, RF-8, RF-9, RF-14, RF-16, CL-1, CL-2, CL-3, CL-5, CL-6, CL-8, CL-9)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en sim/render/UI solo si la base no soporta el caso declarado).
  - Dependencias: T1, T2, T3.
  - Hecho cuando: N10 añadido con `id:10`, `maxLaps:6` (**único nivel de 6 vueltas** en la colección), textos ES base editable, geometría 960×400 contenida, capstone integrador D-004-A sin mecánicas nuevas, complejidad **3 interruptores / 2 segmentos** con áreas no ambiguas (D-004-C), composición base equilibrada D-004-D (p. ej. 2 placas, 2 puertas, 1 láser móvil + 1 estático, 3 interruptores, 2 segmentos, distribución legible y equilibrio timing/secuencia, D5), datos válidos O1, intención/secuencia V1–V6 observable y cierre de campaña coherente. Sin niveles más allá de 10. Sujeto a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos y `maxLaps` de la colección + ausencia de rechazo O1 + verificación visual si disponible.

- [ ] **T5. Implementar y ajustar tests de resolubilidad y fallos relevantes para N8–N10 (ajuste fino guiado por evidencia, RF-12).** (RF-8, RF-9, RF-10, RF-11, RF-12, CL-2, CL-3, CL-4, CL-5, RNF-1, RNF-2, RNF-6)
  - Archivos: `src/game/sim.test.ts` (y/o suite de test existente coherente), `src/game/levels.ts` (ajuste fino de geometría/parámetros permitido por D-004-6/RF-12, preservando intención, progresión, mecánicas, complejidad/composición confirmadas y ausencia de mecánicas nuevas).
  - Dependencias: T2, T3, T4.
  - Hecho cuando: existen tests deterministas para N8, N9 y N10 con **resolución válida** que cumple objetivos observables V1..Vn y **al menos un fallo relevante** por nivel (timeout en última vuelta, error de orden/reinicio que impide abrir paso, muerte por láser/móvil, ventana/timing o condición no cumplida, etc.) coherente con contratos; geometría/parámetros fijados con evidencia. Si un nivel no resulta resoluble con `maxLaps`/mecánicas/complejidad/composición confirmadas, se registra bloqueo con evidencia reproducible y se escala (RF-12) sin cerrar la spec como válida.
  - Evidencia: `node --test src/game/sim.test.ts` (o `node --test`) en verde, o reporte de bloqueo RF-12 con traza/comando reproducible.

- [ ] **T6. Verificar/ajustar integración UI mínima y feedback D6/cierre para N8–N10 (sin pulido global).** (RF-2, RF-3, RF-4, RF-13, RF-14, RF-16, CL-5, CL-7, CL-8, RNF-4, RNF-7)
  - Archivos: `src/App.tsx`, `src/components/*`, `src/game/render.ts`, `src/game/colors.ts` (solo ajustes mínimos necesarios).
  - Dependencias: T2, T3, T4 (y preferiblemente T5 para estados finales).
  - Hecho cuando: N8–N10 seleccionables/jugables en orden completando la colección de 10; HUD/timeline/indicadores coherentes con `maxLaps` 5/5/6 (N10 único de 6); mecánicas visibles/coherentes (láseres móviles/estáticos, segmentos, interruptores) y feedback D6 en español (`actual/esperado`, mensaje breve de error/reinicio, estado observable de interruptores/segmentos) donde aplique; hints/subtítulos coherentes; flujo de victoria/cierre al completar N10 coherente con comportamiento existente (sin persistencia no trivial); sin indicadores innecesarios en niveles sin mecánicas; sin pulido visual global.
  - Evidencia: verificación visual en `npm run dev` o revisión manual documentada (notas/captura descriptiva en reporte) + revisión de diff.

- [ ] **T7. Regresión de niveles existentes y contratos.** (RF-15, CL-7, CL-8, RNF-1, RNF-2, RNF-6)
  - Archivos: los afectados por implementación; `src/game/sim.test.ts` u otras suites existentes solo si requieren actualización por alineación mínima documentada de base 001–003.
  - Dependencias: T5, T6.
  - Hecho cuando: niveles existentes en la base vigente (N1–N4 y, si presentes, N5–N7) mantienen comportamiento/resolubilidad esperado; no hay regresiones en contratos (960×400 según base objetivo, 1201 frames, rewind/seek, timeout última vuelta, reglas de colisión/láser/placas/puertas, determinismo, precedencias D5/F9). Colección final coherente con 10 niveles y N10 único de 6 vueltas.
  - Evidencia: `node --test` en verde (incluyendo regresión existente) o desviaciones justificadas y documentadas por alineación mínima de base.

- [ ] **T8. Verificación final y reporte para handoff.** (RF-1..RF-16, RNF-1..RNF-7)
  - Archivos: todos los modificados/creados.
  - Dependencias: T1–T7.
  - Hecho cuando: `node --test` en verde (salvo bloqueo RF-12 explícitamente documentado con evidencia); `npm run lint` y `npm run build` ejecutados y reportados; verificación UI visible de N8–N10 realizada; reporte incluye archivos cambiados, resultados de comandos, evidencia de resolubilidad/fallo por nivel (V1..Vn) y de N10 único de 6/cierre, cobertura RF, supuestos/desviaciones de base 001–003, ajustes finos realizados, confirmación de restricciones (sin mecánicas nuevas, sin pulido visual global, sin deps/backend/red/secretos, `sim.ts` puro) y bloqueos/riesgos.
  - Evidencia: salidas de comandos + notas de verificación UI + mapeo RF→evidencia en reporte.
