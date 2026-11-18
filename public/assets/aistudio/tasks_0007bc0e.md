# Tasks 001 — Base UI y ajuste Nivel 4

Spec: `specs/001-base-ui-y-ajuste-nivel-4/spec.md` (aprobada). Máx. 10 tareas, en orden de dependencia.

- [ ] **T1. Actualizar canvas y contratos base de datos de nivel.** RF-1, RF-2, RF-10, RF-11, RF-12, RF-13, RNF-1, RNF-2
  - Archivos: `src/game/levels.ts` (y tipos exportados si aplica), `src/game/sim.ts` solo si es estrictamente necesario para compatibilidad de tipos sin lógica nueva.
  - Hecho cuando: `CANVAS_W=960`, `CANVAS_H=400` y muros perimetrales usan el nuevo alto; `LevelDef` soporta extensibilidad de datos para láser móvil (A↔B, `periodo`, `desfase`, determinista por `t`, opcional `poweredByPlates`) e interruptores ordenados (secuencia global, numeración, reinicio por error, efecto habilitar/deshabilitar segmentos) sin implementar comportamiento jugable en `sim.ts`.
  - Evidencia: revisión de diff + `npm run lint` (si disponible) y `node --test src/game/sim.test.ts` (puede fallar temporalmente hasta T2/T3; no cerrar tarea sin registrar estado).

- [ ] **T2. Rediseñar niveles 1–4 para 960×400 y ajustar Nivel 4 a 3 vueltas.** RF-1, RF-4, RF-6, RF-7, RF-8, RF-17, RNF-2, RNF-4
  - Archivos: `src/game/levels.ts`.
  - Hecho cuando: niveles 1–4 caben en 960×400, mantienen intención/mecánicas y son resolubles; Nivel 4 tiene `maxLaps: 3` y conserva conjunto/rol/relaciones de A,B,D1,D2,L1 (reubicados) con `hint`/`subtitle` en español actualizados (minimalistas).
  - Evidencia: revisión de datos + ejecución manual rápida en dev si es posible; secuencias definitivas confirmadas por T3. Si no hay resolubilidad V1–V3 para Nivel 4, documentar evidencia y bloqueo (RF-9) sin cerrar spec.

- [ ] **T3. Actualizar y ampliar tests de simulación (niveles 1–4, Nivel 4 en 3 vueltas, contratos).** RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RNF-1, RNF-2, RNF-5
  - Archivos: `src/game/sim.test.ts` (y helpers de test si son necesarios y ya existentes en el proyecto).
  - Hecho cuando: tests reflejan nuevas geometrías/secuencias de N1–N4; Nivel 4 valida secuencia V1–V3 en 3 vueltas y al menos un fallo relevante; contratos generales (rewind/seek/finishCurrentLap/timeout) siguen válidos. `node --test src/game/sim.test.ts` pasa en verde, o hay bloqueo documentado con evidencia reproducible para RF-9.
  - Evidencia: salida de `node --test src/game/sim.test.ts`.

- [ ] **T4. Implementar validación O1 (rechazo explícito) de datos inválidos.** RF-2, RF-10, RF-11, RF-13, RNF-1, RNF-5
  - Archivos: `src/game/levels.ts` (o módulo/helper de validación existente/adecuado dentro de `src/game/`), `src/game/sim.test.ts`.
  - Hecho cuando: `maxLaps` fuera de 1–6 y datos extensibles inválidos (`periodo <= 0`, desfase no finito, puntos A=B, referencias inexistentes/incompletas) producen fallo determinista y detectable (sin normalización silenciosa) en el punto de validación definido.
  - Evidencia: tests nuevos/ajustados de rechazo O1 + `node --test src/game/sim.test.ts`.

- [ ] **T5. Actualizar paleta/identificación de 6 vueltas (no cíclica) y uso en render.** RF-14, RF-18, RNF-3, RNF-4
  - Archivos: `src/game/colors.ts`, `src/game/render.ts`, componentes que consuman `getLapColor` si aplica.
  - Hecho cuando: existen 6 identificadores/colores explícitos y distinguibles para vueltas 1–6; `getLapColor` no reutiliza cíclicamente los 4 originales; render/timeline/referencias usan identificación directa y consistente.
  - Evidencia: revisión de código + verificación visual en dev (`npm run dev`).

- [ ] **T6. Hacer escalables y dinámicos selector, timeline y HUD para 10 niveles y 6 vueltas.** RF-3, RF-14, RF-15, RF-17, RF-18, RF-19
  - Archivos: `src/components/TitleMenu.tsx`, `src/components/TimelineBar.tsx`, `src/components/LevelSelectorModal.tsx`, `src/App.tsx`.
  - Hecho cuando: no hay hardcodes a 4 (p. ej. `[0,1,2,3]`, "4 niveles"); indicadores de vuelta y listados se generan dinámicamente desde `LEVELS`/`maxLaps`; textos visibles en español coherentes.
  - Evidencia: revisión de diff + verificación visual en dev.

- [ ] **T7. Ajustar layout a canvas 960×400 y cumplir "sin scroll vertical" en 1366×768.** RF-1, RF-17, RF-18, RF-19, RF-20, RNF-3
  - Archivos: `src/App.tsx`, componentes UI/estilos involucrados (`TitleMenu.tsx`, `LevelSelectorModal.tsx`, `TimelineBar.tsx`, `index.html` solo si es imprescindible).
  - Hecho cuando: en viewport 1366×768 (alto disponible ≥768 px, escala 100%) la vista de juego muestra canvas 960×400 y controles/HUD/timeline esenciales sin scroll vertical de página; overlays/modales utilizables; foco/teclado y legibilidad preservados.
  - Evidencia: verificación manual en devtools/responsive + captura o descripción en reporte.

- [ ] **T8. Mejorar feedback de estados, hints/HUD minimalistas y pulido visual/accesibilidad.** RF-16, RF-17, RF-18, RF-20, RNF-4
  - Archivos: `src/game/render.ts`, `src/App.tsx`, `src/components/LevelSelectorModal.tsx`, `src/components/TitleMenu.tsx`.
  - Hecho cuando: estados de placa/puerta/láser son claros y consistentes; HUD/hints minimalistas y textos en español actualizados (incl. N1–N4); menús/overlays con jerarquía/legibilidad mejorada; accesibilidad básica desktop (foco visible, labels/atributos donde aplique).
  - Evidencia: revisión visual manual y de código.

- [ ] **T9. Implementar UI neutra de metadatos/leyenda para mecánicas futuras (sin canvas simulado).** RF-10, RF-11, RF-12, RF-13, RNF-1, RNF-4
  - Archivos: `src/App.tsx` y/o componente UI adecuado, `src/game/levels.ts` (datos/tipos de ejemplo o soporte de lectura) según sea necesario.
  - Hecho cuando: si un nivel declara mecánicas futuras soportadas por tipos, la UI puede mostrar metadatos/leyenda (tipo, parámetros clave, estado declarado) en HUD/panel/leyenda sin dibujar comportamiento simulado/inferido en el mundo/canvas y sin lógica jugable nueva en `sim.ts`.
  - Evidencia: revisión de diff + prueba con datos de nivel declarados (o fixture/validación) y verificación visual.

- [ ] **T10. Verificación final y reporte.** RF-1..RF-20, RNF-1..RNF-6
  - Archivos: todos los modificados por la implementación.
  - Hecho cuando: `node --test src/game/sim.test.ts` en verde (o bloqueo RF-9 documentado con evidencia), `npm run lint` y `npm run build` ejecutados y reportados; verificación UI en 1366×768 sin scroll confirmada; reporte incluye archivos cambiados, comandos/resultados, decisiones y riesgos/bloqueos.
  - Evidencia: salidas de comandos + resumen de verificación UI.
