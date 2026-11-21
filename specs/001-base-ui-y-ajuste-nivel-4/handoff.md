# Handoff 001 — Base UI y ajuste Nivel 4 (Google AI Studio)

Copia y pega este prompt en Google AI Studio para implementar la spec aprobada.

---

## Prompt

Actúa como implementador de **Hold For Me (Paradox Loop)**. Implementa la especificación aprobada `specs/001-base-ui-y-ajuste-nivel-4/spec.md` (Estado: aprobada) siguiendo este contrato. **No implementes nada fuera de la spec.** Si encuentras una ambigüedad o el Nivel 4 no resulta resoluble en 3 vueltas según lo requerido, **repórtalo con evidencia y detente** (no inventes comportamiento).

### Objetivo
- Cambiar canvas lógico a **960×400** y rediseñar niveles **1–4** para el nuevo alto (tests y secuencias actualizados).
- Ajustar **Nivel 4** a **3 vueltas** en 960×400 conservando el **conjunto, rol y relaciones** de A, B, D1, D2, L1 (reubicados), con secuencia V1–V3 verificable en tests.
- Entregar base UI/soporte para **10 niveles y 6 vueltas**: paleta/identificadores de vuelta explícitos no cíclicos, componentes dinámicos (sin hardcode a 4), feedback placa/puerta/láser, HUD/hints minimalistas en español, pulido visual y accesibilidad básica desktop.
- Lograr layout jugable **sin scroll vertical** en viewport desktop **1366×768** (alto ≥768 px, escala 100%).
- Añadir extensibilidad de **datos/tipos** + **UI neutra (metadatos/leyenda)** para láseres móviles e interruptores ordenados, con **validación O1 (rechazo explícito)**, sin implementar lógica jugable completa en `sim.ts`.

### Lee primero (obligatorio)
- `docs/constitution.md`, `AGENTS.md`, `MEMORY.md`
- `specs/001-base-ui-y-ajuste-nivel-4/spec.md`, `specs/001-base-ui-y-ajuste-nivel-4/plan.md`, `specs/001-base-ui-y-ajuste-nivel-4/tasks.md`
- `src/game/levels.ts`, `src/game/sim.ts`, `src/game/render.ts`, `src/game/colors.ts`, `src/game/sim.test.ts`
- `src/App.tsx`, `src/components/TitleMenu.tsx`, `src/components/TimelineBar.tsx`, `src/components/LevelSelectorModal.tsx`

### Restricciones (no negociables)
- `src/game/sim.ts` **puro y determinista**: sin DOM, Canvas, `window` ni React. Mismo estado+entrada ⇒ mismo resultado.
- **No** implementar lógica jugable completa de láseres móviles ni interruptores ordenados en `sim.ts` (solo datos/tipos/extensibilidad y validación; UI neutra de metadatos/leyenda).
- Preservar contratos salvo cambios explícitos: 20 s/60 Hz, **1201 frames/vuelta**, jugador r=12, 220 px/s, meta r=24, rastro 24 px, muestreo cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, sin colisión fantasmas/rastro en spawn, timeout solo en última vuelta agotada.
- Canvas pasa a **960×400** (`CANVAS_W=960`, `CANVAS_H=400`), perímetro y niveles 1–4 rediseñados; Nivel 4 `maxLaps: 3`.
- **O1 rechazo explícito** (determinista, detectable, sin normalización silenciosa) para `maxLaps` fuera de 1–6 y datos extensibles inválidos (`periodo <= 0`, desfase no finito, puntos A=B, referencias inexistentes/incompletas).
- UI neutra mínima = **metadatos/leyenda** en HUD/panel/leyenda (tipo, parámetros clave, estado declarado); **no** dibujar comportamiento simulado/inferido en canvas.
- Sin backend, cuentas, red, telemetría, secretos ni dependencias nuevas. Progreso local solo si ya existe (trivial).
- Código/nombres/comentarios en **inglés**; textos visibles de UI/juego en **español**.
- No modifiques `AGENTS.md`, `docs/constitution.md`, `PARADOX_LOOP_DISENO.md` sin aprobación.

### Tareas (en orden)
1. **T1 Canvas y tipos/extensibilidad base:** `levels.ts` a 960×400 + perímetro; tipos de datos para láser móvil (A↔B, periodo, desfase, opcional `poweredByPlates`) e interruptores ordenados (secuencia global, numeración, reinicio por error, habilitar/deshabilitar segmentos) sin lógica en `sim.ts`.
2. **T2 Rediseño niveles 1–4:** geometrías/hints/subtítulos para 960×400; Nivel 4 a 3 vueltas conservando conjunto/rol/relaciones A,B,D1,D2,L1 reubicados e intención relevo/bloqueo. **Riesgo RF-9:** si V1–V3 no es viable, documentar evidencia y bloquear cierre.
3. **T3 Tests simulación:** actualizar `sim.test.ts` para N1–N4 y nuevo N4 (solución V1–V3 + fallo relevante) manteniendo contratos generales.
4. **T4 Validación O1:** rechazo explícito determinista y tests representativos.
5. **T5 Paleta 6 vueltas:** 6 colores explícitos no cíclicos, `getLapColor` directo, usos en render/componentes/leyenda.
6. **T6 UI dinámica 10 niveles/6 vueltas:** eliminar hardcodes (`[0,1,2,3]`, "4 niveles") en `TitleMenu` y supuestos fijos; escalar `TimelineBar`, `LevelSelectorModal`, `App`.
7. **T7 Layout sin scroll 1366×768:** ajustar canvas 960×400 (revisar `aspect-[16/10]` en `App.tsx`) y compactar HUD/controles/timeline/overlays para que no haya scroll vertical en 1366×768@100%.
8. **T8 Feedback, hints/HUD, pulido y accesibilidad:** estados placa/puerta/láser claros, textos español (N1–N4), menús/overlays, foco/labels/teclado.
9. **T9 UI neutra metadatos/leyenda:** mostrar parámetros/estado declarado de mecánicas futuras solo en panel/leyenda, sin simular en canvas ni tocar lógica de `sim.ts`.
10. **T10 Verificación final:** ejecutar tests/lint/build y revisión UI.

### Criterios de aceptación
- Niveles 1–4 rediseñados, jugables y resolubles en 960×400; Nivel 4 en 3 vueltas con V1–V3 verificable en `sim.test.ts` (o bloqueo RF-9 documentado con evidencia).
- `node --test src/game/sim.test.ts` en verde (salvo bloqueo RF-9 explícito).
- 6 vueltas con identificadores no cíclicos y UI dinámica para hasta 10 niveles/6 vueltas (sin hardcode a 4).
- Sin scroll vertical en vista de juego a 1366×768 (≥768 px alto, 100%).
- O1 aplicado y probado; UI neutra de metadatos/leyenda sin lógica nueva en `sim.ts`.
- `sim.ts` sigue puro/determinista; sin dependencias nuevas ni backend/secretos.

### Formato de reporte esperado (responde con esto al terminar)
1. **Resumen:** qué se implementó y qué quedó pendiente/bloqueado.
2. **Archivos cambiados:** lista con breve descripción por archivo.
3. **Verificación ejecutada:** comandos y resultados (`node --test src/game/sim.test.ts`, `npm run lint`, `npm run build` si se ejecutaron) y verificación UI (viewport 1366×768, sin scroll, N1–N4/N4 3 vueltas).
4. **RF cubiertos / evidencia:** mapeo breve RF → cómo se verificó.
5. **Riesgos, decisiones y dudas:** incluyendo estado de RF-9 (resolubilidad Nivel 4) y cualquier ambigüedad encontrada.
6. **Supuestos:** solo si fue inevitable y debe escalarse.

---