# Tasks 003 — Niveles 5–7

Spec aprobada: `specs/003-niveles-5-7/spec.md` (Decisiones 1–5). Plan: `specs/003-niveles-5-7/plan.md`. Orden de dependencia T1→T8. Sin N8–N10, sin pulido visual global. **Implementación por Google AI Studio.**

- [ ] **T1. Verificar base Spec 001/002 y declarar supuestos de alineación mínima.** (D-001, D-002, RNF-1, RNF-2, RNF-6)
  - Archivos: lectura de `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/App.tsx`, `src/components/*`, `src/game/sim.test.ts` (modificación solo si se requiere ajuste mínimo indispensable y documentado; preferir registrar en reporte).
  - Dependencias: ninguna.
  - Hecho cuando: se confirma el estado real de base (canvas 960×400, soporte 10 niveles/`maxLaps` 1–6, mecánicas Spec 002 D1–D8/O1/D6 disponibles o gaps identificados) y se documentan supuestos/desviaciones; si faltan piezas necesarias para N5–N7, se acota el conjunto mínimo de ajustes alineados a 001/002 (sin ampliar alcance).
  - Evidencia: `node --test` ejecutado (resultado registrado) + notas de verificación/diff en reporte.

- [ ] **T2. Definir Nivel 5 "El pulso" (id 5, 3 vueltas, solo láser móvil).** (RF-1, RF-2, RF-3, RF-4, RF-7, RF-8, RF-12, CL-1, CL-2, CL-6)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en `src/game/sim.ts`/`render.ts`/UI solo si la base 002 no soporta el caso declarado).
  - Dependencias: T1.
  - Hecho cuando: N5 añadido a la campaña con `id:5`, `maxLaps:3`, nombre/subtítulo/hint en español (base editable), geometría 960×400 contenida y **1 láser móvil** A↔B con `periodo`/`desfase` válidos (O1, D8), sin interruptores/`laserSegment`; mecánicas base (muros, 1 placa, 1 puerta, meta) coherentes con intención V1–V3. Parámetros/coords sujetos a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos + validación/carga sin rechazo O1 + verificación visual en dev si es posible.

- [ ] **T3. Definir Nivel 6 "Orden correcto" (id 6, 4 vueltas, solo interruptores + `laserSegment`).** (RF-1, RF-2, RF-3, RF-5, RF-7, RF-8, RF-12, CL-1, CL-3, CL-6)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en sim/render/UI solo si la base 002/D6 no soporta el caso declarado).
  - Dependencias: T1.
  - Hecho cuando: N6 añadido con `id:6`, `maxLaps:4`, textos ES base editable, geometría 960×400 contenida, **2 interruptores** en secuencia global y **1 `laserSegment`** bloqueante controlado (`segmentId`, D1), áreas no ambiguas, láser estático asociado (sin móvil), sin romper N5. Estado inicial `initialEnabled` y referencias explícitas/válidas (O1). Sujeto a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos + ausencia de rechazo O1 + verificación visual de elementos/feedback D6 si disponible.

- [ ] **T4. Definir Nivel 7 "Sincronía" (id 7, 5 vueltas, combinación móvil + interruptores/`laserSegment`).** (RF-1, RF-2, RF-3, RF-6, RF-7, RF-8, RF-12, CL-1, CL-2, CL-3, CL-6)
  - Archivos: `src/game/levels.ts` (y ajustes mínimos estrictamente necesarios en sim/render/UI solo si la base 002 no soporta combinación declarada).
  - Dependencias: T1, T2, T3.
  - Hecho cuando: N7 añadido con `id:7`, `maxLaps:5`, textos ES base editable, geometría 960×400 contenida, **1 láser móvil** A↔B + **2–3 interruptores** y **1–2 `laserSegment`** (vínculos `laserId` explícitos, estático o móvil según diseño), áreas no ambiguas, combinación con mecánicas existentes coherente con D5/F9. Sin N8–N10. Sujeto a ajuste fino en T5.
  - Evidencia: revisión de datos/tipos + ausencia de rechazo O1 + verificación visual si disponible.

- [ ] **T5. Implementar y ajustar tests de resolubilidad y fallos relevantes para N5–N7 (ajuste fino guiado por evidencia).** (RF-8, RF-9, RF-10, RF-11, CL-2, CL-3, CL-4, CL-5, RNF-1, RNF-2, RNF-6)
  - Archivos: `src/game/sim.test.ts` (y/o suite de test existente coherente), `src/game/levels.ts` (ajuste fino de geometría/parámetros permitido por Decisión 1, preservando intención/progresión/complejidad).
  - Dependencias: T2, T3, T4.
  - Hecho cuando: existen tests deterministas para N5, N6 y N7 con **resolución válida** que cumple objetivos observables V1..Vn y **al menos un fallo relevante** por nivel (timeout/muerte láser o móvil/ventana perdida, error de orden-reinicio que impide abrir paso, etc.) coherente con contratos; geometría/parámetros fijados con evidencia. Si un nivel no resulta resoluble con `maxLaps`/mecánicas/complejidad declaradas, se registra bloqueo con evidencia reproducible y se escala (RF-10) sin cerrar la spec como válida.
  - Evidencia: `node --test src/game/sim.test.ts` (o `node --test`) en verde, o reporte de bloqueo RF-10 con traza/comando reproducible.

- [ ] **T6. Verificar/ajustar integración UI y feedback mínimo para N5–N7 (sin pulido global).** (RF-2, RF-3, RF-12, RF-13, CL-7, CL-8, RNF-4, RNF-7)
  - Archivos: `src/App.tsx`, `src/components/*`, `src/game/render.ts`, `src/game/colors.ts` (solo ajustes mínimos necesarios).
  - Dependencias: T2, T3, T4 (y preferiblemente T5 para estados finales).
  - Hecho cuando: N5–N7 seleccionables/jugables en orden; HUD/timeline/indicadores coherentes con `maxLaps` 3/4/5; láser móvil visible/coherente en N5/N7; feedback D6 en español visible en N6/N7 (`actual/esperado`, mensaje breve de error/reinicio, estado observable de interruptores/segmentos); hints/subtítulos coherentes; sin indicadores innecesarios en niveles sin mecánicas; sin pulido visual global.
  - Evidencia: verificación visual en `npm run dev` (notas/captura descriptiva en reporte) + revisión de diff.

- [ ] **T7. Regresión N1–N4 y contratos existentes.** (RF-13, CL-7, RNF-1, RNF-2, RNF-6)
  - Archivos: los afectados por implementación; `src/game/sim.test.ts` u otras suites existentes solo si requieren actualización por alineación mínima documentada de base 001/002.
  - Dependencias: T5, T6.
  - Hecho cuando: N1–N4 mantienen comportamiento/resolubilidad esperado según la base vigente; no hay regresiones en contratos (1201 frames, rewind/seek, timeout última vuelta, reglas de colisión/láser/placas/puertas, determinismo).
  - Evidencia: `node --test` en verde (incluyendo regresión existente) o desviaciones justificadas y documentadas por alineación de base.

- [ ] **T8. Verificación final y reporte para handoff.** (RF-1..RF-13, RNF-1..RNF-7)
  - Archivos: todos los modificados/creados.
  - Dependencias: T1–T7.
  - Hecho cuando: `node --test` en verde (salvo bloqueo RF-10 explícitamente documentado con evidencia); `npm run lint` y `npm run build` ejecutados y reportados; verificación UI de N5–N7 realizada; reporte incluye archivos cambiados, resultados de comandos, evidencia de resolubilidad/fallo por nivel (V1..Vn), cobertura RF, supuestos/desviaciones de base 001/002, confirmación de restricciones (sin N8–N10, sin pulido global, sin deps/backend, `sim.ts` puro) y bloqueos/riesgos.
  - Evidencia: salidas de comandos + notas de verificación UI + mapeo RF→evidencia en reporte.
