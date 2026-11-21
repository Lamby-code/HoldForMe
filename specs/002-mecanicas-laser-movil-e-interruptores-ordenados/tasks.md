# Tasks 002 — Mecánicas jugables: láser móvil e interruptores ordenados

Spec aprobada: `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md`. Plan: `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/plan.md`. Orden de dependencia T1→T10. Sin niveles de campaña N5–N10; fixtures solo en tests (D7).

- [ ] **T1. Modelo de datos y tipos base (láser móvil, `laserSegment`, interruptores).** RF-1, RF-2, RF-3, RF-5, D1, D7
  - Archivos: `src/game/levels.ts` (y/o módulos de tipos en `src/game/` coherentes con la arquitectura), ajustes de tipos importados si es necesario.
  - Dependencias: ninguna (verificar supuestos base Spec 001).
  - Hecho cuando: existen tipos/estructuras para láser móvil (`A`,`B`,`periodo`,`desfase`, opcional `poweredByPlates`), `laserSegment` entidad propia (`id`, `laserId`, geometría/alcance, `initialEnabled`) e interruptores/secuencia global (orden, área tipo placa, referencias por `segmentId`) compatibles con niveles existentes; no se modifica el contenido/listado de campaña en `src/game/levels.ts`.
  - Evidencia: revisión de diff/tipos + `npm run lint` y/o `npm run build` si el entorno lo permite (registrar estado si hay bloqueo por dependencias/entorno).

- [ ] **T2. Validación O1 determinista y detectable.** RF-4, RF-5, RNF-1
  - Archivos: `src/game/levels.ts` o helper/módulo de validación en `src/game/`, `src/game/sim.test.ts` (o suite de tests aprobada).
  - Dependencias: T1.
  - Hecho cuando: validación rechaza explícitamente (sin normalización silenciosa) casos inválidos representativos: `periodo <= 0`, `periodo`/`desfase` no finitos o inválidos, extremos inválidos/A==B según contrato, `laserId`/`segmentId` inexistentes, ids duplicados relevantes, secuencia/orden inconsistente, área inválida, relaciones de control incompletas.
  - Evidencia: tests de rechazo O1 (fixtures en tests) + `node --test` (archivo/suite afectada).

- [ ] **T3. Movimiento determinista de láser móvil (D8) y geometría efectiva.** RF-6, RF-7, RF-9, D8, RNF-1, RNF-2
  - Archivos: `src/game/sim.ts` (y utilidades puras en `src/game/` si procede), `src/game/sim.test.ts`.
  - Dependencias: T1.
  - Hecho cuando: cálculo puro en `t` usa `q = ((t + desfase) mod P + P) mod P` y `u = 1 - |(2q / P) - 1|` (ciclo A→B→A); geometría/alcance de `laserSegment` en láser móvil se evalúa sobre la posición efectiva del láser en `t`.
  - Evidencia: tests de determinismo/posición en bordes (`t=0`, alto, desfase) y segmento móvil + `node --test`.

- [ ] **T4. Secuencia global, activaciones y efecto sobre segmentos (D2, D3, D4).** RF-11, RF-12, RF-13, RF-14, RF-15, F10, RNF-1
  - Archivos: `src/game/sim.ts`, `src/game/sim.test.ts`.
  - Dependencias: T1, T3.
  - Hecho cuando: solo jugador activo genera intentos por transición fuera→dentro (una por entrada, no por permanencia); activación válida avanza `actual/esperado`; error reinicia secuencia y restaura `initialEnabled`; completar deshabilita segmentos bloqueantes objetivo y persiste mientras la secuencia siga correcta; estado es derivado/reproducible del historial hasta `t` y se ajusta correctamente en rewind/seek.
  - Evidencia: tests de activación (jugador/fantasma, permanencia), avance/error/reinicio/reintento/compleción/persistencia y rewind/seek + `node --test`.

- [ ] **T5. Precedencia, bloqueo de láser móvil y colisiones (D5, F9).** RF-7, RF-8, RF-9, RF-10, RNF-1, RNF-2
  - Archivos: `src/game/sim.ts`, `src/game/sim.test.ts`.
  - Dependencias: T3, T4.
  - Hecho cuando: precedencia aplicada en orden (1) `poweredByPlates` apagado ⇒ inactivo total, (2) deshabilitado por secuencia/segmento ⇒ no dañino, (3) bloqueado por fantasma/rastro ⇒ truncado, (4) activo/dañino; láser móvil es bloqueable como estático y combinable con segmentos controlados; colisión del jugador con tramo activo/dañino produce muerte por láser según contratos.
  - Evidencia: tests de precedencia y combinación movimiento+energía+segmento+bloqueo + colisión + `node --test`.

- [ ] **T6. Exposición de estado derivado para render/UI.** RF-15, RF-16, RF-17, RF-19, RNF-1
  - Archivos: `src/game/sim.ts` (p. ej. `deriveWorld`/tipos derivados), puntos de consumo mínimos necesarios.
  - Dependencias: T3, T4, T5.
  - Hecho cuando: render/UI pueden leer de forma determinista geometría/estados de láseres móviles, estados de segmentos/interruptores, `actual/esperado` y señal de error/reinicio coherentes con `t`, sin romper contratos existentes innecesariamente.
  - Evidencia: revisión de tipos/API + `npm run lint`/`npm run build` si aplica.

- [ ] **T7. Render en canvas (láser móvil, interruptores, estados).** RF-16, RF-18, RF-19, RNF-4, RNF-7
  - Archivos: `src/game/render.ts`, `src/game/colors.ts` (solo si se requiere ajuste mínimo de paleta coherente, sin deps nuevas).
  - Dependencias: T6.
  - Hecho cuando: láseres móviles se representan en posición efectiva por `t` con distinción observable de estados (energía apagada, deshabilitado por secuencia, bloqueado/truncado, activo); interruptores/segmentos se representan coherentemente; niveles sin estas mecánicas no muestran indicadores extra.
  - Evidencia: verificación visual en `npm run dev` (usando fixtures de test/mecanismo no campaña si aplica) + revisión de diff.

- [ ] **T8. Feedback UI mínimo obligatorio en español (D6).** RF-17, RF-18, RF-19, RNF-4
  - Archivos: `src/App.tsx`, `src/components/*` (HUD/leyenda/panel según arquitectura existente).
  - Dependencias: T6.
  - Hecho cuando: UI muestra (a) progreso/orden `actual/esperado`, (b) mensaje breve visible ante error/reinicio, (c) estado observable de interruptores/segmentos (habilitado/deshabilitado, activo/inactivo o equivalente), en español, minimalista y legible, sin indicadores innecesarios en niveles sin mecánicas.
  - Evidencia: verificación visual/manual en dev + revisión de textos/accesibilidad básica.

- [ ] **T9. Cobertura de tests (fixtures en tests) y regresión.** RF-20, RF-21, RF-4, RNF-1, RNF-2, RNF-5
  - Archivos: `src/game/sim.test.ts` y/u otros archivos de test aprobados.
  - Dependencias: T2, T3, T4, T5.
  - Hecho cuando: suite cubre casos mínimos de Spec 002 (movimiento D8, precedencia, activación jugador-only y entrada, avance/error/reinicio/restore/persistencia, segmentos en láser estático/móvil, rewind/seek, O1) usando fixtures/constructores en tests; no hay cambios de campaña en `src/game/levels.ts`; tests de regresión existentes siguen verdes.
  - Evidencia: `node --test src/game/sim.test.ts` (y suites relevantes) en verde + diff confirmando ausencia de fixtures en `levels.ts`.

- [ ] **T10. Verificación final y reporte para handoff.** RF-1..RF-21, RNF-1..RNF-7
  - Archivos: todos los modificados/creados en la implementación.
  - Dependencias: T1–T9.
  - Hecho cuando: `node --test` en verde; `npm run lint` y `npm run build` ejecutados y reportados; revisión UI de feedback D6 y movimiento/estados coherente; N1–N4 sin regresiones observables; reporte incluye archivos cambiados, resultados de comandos, evidencias RF, supuestos/desviaciones de base 001 y dudas/bloqueos si existen.
  - Evidencia: salidas de comandos + notas de verificación UI.