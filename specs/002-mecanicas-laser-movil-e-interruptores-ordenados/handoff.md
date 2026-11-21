# Handoff 002 — Láser móvil e interruptores ordenados (Google AI Studio)

Copia y pega este prompt en Google AI Studio para implementar la spec aprobada. **La spec es el contrato:** no implementes nada fuera de ella. Si encuentras ambigüedad no cubierta, repórtala con evidencia y detente (no inventes comportamiento).

---

## Prompt

Actúa como implementador de **Hold For Me (Paradox Loop)**. Implementa `specs/002-mecanicas-laser-movil-e-interruptores-ordenados/spec.md` (Estado: borrador revisado con decisiones D1–D8, **aprobada por el usuario**) siguiendo este handoff y los artefactos de planificación.

### Objetivo y alcance
- Implementar **lógica jugable completa** de:
  1. **Láseres móviles lineales (A↔B, ida y vuelta)** deterministas por `t` con `periodo` y `desfase`.
  2. **Interruptores ordenados** (secuencia global, activación válida, error/reinicio) que controlan **`laserSegment`** para abrir paso.
- Integrar simulación en `src/game/sim.ts` y feedback/representación real en `src/game/render.ts` y UI (`src/App.tsx` / componentes), manteniendo determinismo, rewind/seek, grabación, fantasmas/rastro, placas, puertas y contratos vigentes.
- **Fuera de alcance:** no crear ni balancear niveles de campaña **N5–N10**; no modificar el listado/contenido de campaña en `src/game/levels.ts` para mecánicas/fixtures.

### Base y supuestos
- Asumir base **Spec 001** implementada (canvas 960×400, rediseño N1–N4, soporte 10 niveles/6 vueltas, extensibilidad/UI neutra O1). El usuario indicó: "Spec 001 ya implementada, saltear validación y empezar con Spec 002".
- **Si el repo difiere:** documenta la desviación en el reporte y aplica solo alineaciones mínimas necesarias para cumplir Spec 002, sin ampliar alcance ni inventar comportamiento.


### Decisiones y contratos obligatorios (D1–D8)

**D1 — `laserSegment` (entidad propia, referenciable):**
- Campos mínimos: `id` único, `laserId` (láser estático o móvil), geometría/alcance determinista (propia o relativa al láser), `initialEnabled`.
- Los interruptores controlan/referencian segmentos por **`segmentId`**. Si el láser es móvil, el segmento se evalúa sobre la geometría efectiva del láser en `t`.

**D2 — Efecto y persistencia:**
- Al **completar** la secuencia correcta: se **deshabilitan** los `laserSegment` bloqueantes objetivo (abrir paso).
- El efecto **permanece mientras la secuencia siga correcta**.
- **Error de orden:** reinicio de secuencia y segmentos controlados vuelven a **estado inicial** (`initialEnabled`).

**D3 — Activación:**
- Proximidad/área tipo placa, evaluada de forma **determinista por `t`** con umbral explícito y testeable.
- **Solo el jugador activo** puede generar intentos; **fantasmas no** activan interruptores.
- Un intento se genera en `t` cuando el jugador cumple el área y **no la cumplía** en la evaluación anterior (transición **fuera→dentro**): exactamente un intento por entrada (no por permanencia).

**D4 — Temporalidad y rewind/seek (F10):**
- Estado de interruptores, secuencia global y segmentos **derivado y reproducible** del historial/eventos hasta `t`; recalculado/ajustado coherentemente en **rewind/seek** a eventos hasta ese `t`.
- Sin estados fantasma, sin temporizadores no deterministas, sin persistencia oculta entre vueltas salvo lo grabado/reproducible por replay.

**D5/F9 — Precedencia e interacciones (mayor a menor):**
1. **`poweredByPlates` no cumplido** ⇒ inactivo total por energía (no dañino).
2. **Deshabilitado por interruptor/secuencia/segmento** ⇒ no dañino (abre paso).
3. **Bloqueado por fantasma/rastro** (reglas vigentes) ⇒ truncado/bloqueado.
4. **Activo/dañino** en trayectoria normal.
- Láser móvil es **bloqueable por fantasma/rastro igual que estático** y puede tener segmentos controlados; **movimiento y habilitación se combinan** por esta precedencia.

**D6 — Feedback UI mínimo obligatorio (español, minimalista):**
- (a) Indicador de progreso/orden **`actual/esperado`**.
- (b) **Mensaje breve** visible ante **error/reinicio**.
- (c) Representación observable del **estado** de interruptores/segmentos (habilitado/deshabilitado, activo/inactivo o equivalente) coherente con simulación.

**D7 — Fixtures:** solo datos/constructores en tests (`src/game/sim.test.ts` u otros tests aprobados). **No** modificar `src/game/levels.ts` campaña.

**D8 — Movimiento láser móvil (ping-pong):**
- `P = periodo` = frames totales del ciclo completo **A→B→A** (finito, entero `> 0`, O1).
- `q = ((t + desfase) mod P + P) mod P`.
- `u = 1 - |(2q / P) - 1|`, `u ∈ [0,1]` (`u=0` en A, `u=1` en B).
- Geometría efectiva = interpolación lineal entre A y B con `u(t)` (o aplicación equivalente a extremos del haz), determinista para todo `t`.

### Restricciones (no negociables)
- `src/game/sim.ts` **puro y determinista**: sin DOM, Canvas, `window`, `React`, timers, aleatoriedad, I/O.
- Preservar contratos vigentes (salvo lo explícito de Spec 002): canvas 960×400, 20 s/60 Hz, 1201 frames/vuelta, jugador r=12, 220 px/s, meta r=24, rastro 24 px muestreado cada 4 frames, umbral placa `plate.r + 4`, spawn safe 44 px, timeout solo en última vuelta agotada, fantasmas/rastro sólidos, reglas de colisiones/láser aplicables.
- **O1:** rechazo explícito, determinista y detectable para datos inválidos/ambiguos (sin normalización silenciosa).
- Sin backend, cuentas, red, telemetría, secretos ni dependencias nuevas.
- Código/nombres/comentarios/tests en **inglés**; UI/textos/hints/leyendas visibles en **español**.
- No modificar `docs/constitution.md`, `AGENTS.md`, `PARADOX_LOOP_DISENO.md`.

### Archivos y expectativas
- `src/game/levels.ts` (y/o tipos en `src/game/`): modelo de datos/tipos para láser móvil, `laserSegment`, interruptores/secuencia global; validación O1. **No** añadir/modificar campaña ni fixtures en este archivo.
- `src/game/sim.ts`: fórmula D8, evaluación de segmentos (estático/móvil), activación D3 solo jugador con transición entrada, máquina de secuencia D2, precedencia D5/F9, bloqueo móvil por fantasma, colisión, estado derivado compatible con rewind/seek D4.
- `src/game/render.ts`: posición/estado de láseres móviles e interruptores/segmentos coherente con simulación; distinción visual de estados.
- `src/App.tsx`, `src/components/*`: feedback UI mínimo D6 (a,b,c) en español, minimalista, sin indicadores extra cuando no aplique.
- `src/game/sim.test.ts` (u otros tests aprobados): fixtures/constructores en tests, cobertura RF-20 y O1, regresión.

### Tareas (seguir orden de `tasks.md`)
1. **T1** Tipos/modelo de datos (láser móvil, `laserSegment`, interruptores, refs por `segmentId`), sin tocar campaña.
2. **T2** Validación O1 determinista + tests de rechazo (fixtures en tests).
3. **T3** Movimiento determinista D8 y evaluación de segmentos en láser móvil + tests.
4. **T4** Activación D3, secuencia global D2, estado derivado/reproducible y rewind/seek D4 + tests.
5. **T5** Precedencia D5/F9, bloqueo de móvil por fantasma, colisiones + tests.
6. **T6** Exponer estado derivado para render/UI.
7. **T7** Render de láser móvil/interruptores/estados.
8. **T8** UI feedback mínimo D6 (español).
9. **T9** Completar cobertura de tests y regresión (fixtures solo en tests).
10. **T10** Verificación final y reporte.

### Formato de reporte esperado (responder con esto al terminar)
1. **Resumen:** qué se implementó y qué quedó pendiente/bloqueado.
2. **Archivos cambiados:** lista con breve descripción por archivo.
3. **Verificación ejecutada:** comandos y resultados (`node --test`, `npm run lint`, `npm run build`) y verificación UI (feedback D6, movimiento/estados, rewind/seek, sin regresiones en N1–N4).
4. **RF cubiertos / evidencia:** mapeo breve RF → cómo se verificó (tests/diff/manual).
5. **Riesgos, decisiones y dudas:** supuestos por base Spec 001, desviaciones encontradas, y cualquier ambigüedad (si hubo, debió detenerse).
6. **Confirmación de restricciones:** `sim.ts` puro/determinista, sin deps/backend/red/secretos, sin cambios de campaña en `src/game/levels.ts`, fixtures solo en tests.

---