# Constitución — Hold For Me (Paradox Loop)

Principios innegociables del proyecto. Toda spec, plan, tarea y línea de código se subordina a este documento.

## Principios

1. **Stack pragmático y controlado.** El juego es una webapp estática con React, TypeScript, Vite, Tailwind CSS y Canvas 2D. Se permiten dependencias de tooling/UI ya presentes; agregar una dependencia nueva o cambiar el stack exige justificación y aprobación explícita. Sin backend, cuentas ni servicios externos en runtime.
2. **La spec manda.** Ningún cambio de comportamiento sin un requisito aprobado en `specs/NNN-*/spec.md`, y ninguna fase avanza sin aprobación explícita del usuario. La spec es el contrato de implementación para Google AI Studio. Ante una decisión faltante, se detiene y se pregunta.
3. **Lógica e interfaz separadas.** `src/game/sim.ts` es puro y determinista: no importa DOM, Canvas, `window` ni React, y con el mismo estado y entrada produce el mismo resultado. El render, el input, el audio y la UI viven fuera de la simulación.
4. **Verificación antes de cerrar.** La lógica de simulación y sus contratos deben estar cubiertos por tests automatizados (`node --test`). No se cierra una tarea o spec con tests en rojo. Los cambios de UI deben verificarse de forma visible (dev/build o revisión manual documentada).
5. **Datos del usuario: locales, mínimos y sin secretos.** Sin backend, red ni telemetría. Solo se permite persistencia local trivial (por ejemplo, progreso o preferencias de UI/audio). Nunca se escriben credenciales, tokens, claves ni datos personales en el repo.
6. **Un idioma por capa.** Código, nombres, tests y comentarios en inglés; interfaz, textos de juego, documentación y mensajes visibles en español. Lo que no cumpla se corrige antes de cerrar la tarea.

## Gobierno

- Toda enmienda requiere aprobación explícita del usuario y actualización de `MEMORY.md`.
- Un principio no se viola "temporalmente": si el proyecto lo necesita, se enmienda la constitución primero.
- No se almacenan jamás datos sensibles en archivos del proyecto.
