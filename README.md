# Hold For Me

Puzzle 2D top-down donde cada vuelta de 20 segundos graba a un fantasma sólido que repite exactamente tus movimientos.

> **El presente es blando. El pasado es duro.**

## Controles

| Acción | Control |
|---|---|
| Caminar | `WASD` o Flechas |
| Terminar vuelta (fijar posición hasta los 20 s) | `Enter` o botón **Terminar vuelta** |
| Pausar / Reanudar | `Espacio` |
| Rebobinar gratis | Mantener `R` o hacer clic en la línea de tiempo |
| Reiniciar nivel | `Supr` |
| Selector de niveles | `Esc` |

## Publicar en GitHub Pages

Este proyecto compila a una webapp estática pura con rutas relativas (`base: './'` en `vite.config.ts`). **No** debe apuntar a la raíz del repositorio con *"Deploy from a branch"*, porque el navegador no puede ejecutar `/src/main.tsx` sin compilar.

El repositorio incluye el workflow automático `.github/workflows/deploy.yml`:

1. Subí el repositorio a GitHub.
2. En tu repositorio, entrá a **Settings → Pages**.
3. En **Build and deployment → Source**, elegí **GitHub Actions** (en lugar de *Deploy from a branch*).
4. Cada `push` (o ejecución manual en la pestaña **Actions**) compilará `dist/` y publicará el juego listo para abrir en el navegador.

Para probar el build localmente:

```bash
npm install --legacy-peer-deps
npm run build
npm run preview
```
