import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LevelSelectorModal } from './components/LevelSelectorModal.tsx';
import { TimelineBar } from './components/TimelineBar.tsx';
import { TitleMenu } from './components/TitleMenu.tsx';
import { sfx } from './game/audio.ts';
import {
  applyThemeTokens,
  TOKENS,
} from './game/colors.ts';
import { CANVAS_H, CANVAS_W, LEVELS } from './game/levels.ts';
import { renderGame } from './game/render.ts';
import {
  createInitialState,
  DEATH_SLOWMO_FRAMES,
  deriveWorld,
  finishCurrentLap,
  getDeathMessage,
  isWon,
  rewindStep,
  seekToFrame,
  stepSim,
  TICK_HZ,
  type InputState,
  type SimState,
} from './game/sim.ts';

if (typeof document !== 'undefined') {
  applyThemeTokens();
}

const STORAGE_KEY = 'paradoxloop_completed_v1';
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const { color: C } = TOKENS;

function loadCompletedLevels(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'play'>('menu');
  const [levelIndex, setLevelIndex] = useState(0);
  const [simState, setSimState] = useState<SimState>(() => createInitialState(0));
  const simRef = useRef<SimState>(simState);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // RF-17: UI-only dismissal flag so Escape closes Victory/Death overlays cleanly
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  const [completedLevels, setCompletedLevels] = useState<number[]>(loadCompletedLevels);
  const [controlsOpen, setControlsOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultOverlayRef = useRef<HTMLDivElement>(null);
  const resultPrevFocusRef = useRef<HTMLElement | null>(null);

  const keysRef = useRef<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    rewind: boolean;
  }>({
    up: false,
    down: false,
    left: false,
    right: false,
    rewind: false,
  });

  const prevPlatesCountRef = useRef(0);
  const prevLapRef = useRef(0);
  const prevDeadRef = useRef(false);
  const prevWonRef = useRef(false);

  const syncState = useCallback((next: SimState) => {
    simRef.current = next;
    setSimState(next);
  }, []);

  const resetLevel = useCallback(
    (targetIdx = levelIndex) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const fresh = createInitialState(targetIdx);
      prevPlatesCountRef.current = 0;
      prevLapRef.current = 0;
      prevDeadRef.current = false;
      prevWonRef.current = false;
      setLevelIndex(targetIdx);
      setPaused(false);
      setOverlayDismissed(false);
      setScreen('play');
      syncState(fresh);
    },
    [levelIndex, syncState]
  );

  const handleFinishCurrentLap = useCallback(() => {
    const cur = simRef.current;
    const lvl = LEVELS[cur.levelIndex];
    if (cur.dead || isWon(cur) || cur.lap + 1 >= lvl.maxLaps) return;

    const next = finishCurrentLap(cur);
    if (next.lap > cur.lap) {
      sfx.lapNext();
      prevLapRef.current = next.lap;
    } else if (next.dead) {
      sfx.death();
      prevDeadRef.current = true;
    }
    setPaused(false);
    setOverlayDismissed(false);
    syncState(next);
  }, [syncState]);

  const handleRewindToLapStart = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const cur = simRef.current;
    const next = seekToFrame(cur, cur.lap, 0);
    prevDeadRef.current = false;
    setPaused(false);
    setOverlayDismissed(false);
    syncState(next);
  }, [syncState]);

  const handleSeek = useCallback(
    (targetLap: number, targetT: number) => {
      if (simRef.current.dead) return;
      const next = seekToFrame(simRef.current, targetLap, targetT);
      prevDeadRef.current = false;
      prevWonRef.current = false;
      prevLapRef.current = next.lap;
      setOverlayDismissed(false);
      syncState(next);
    },
    [syncState]
  );

  const world = deriveWorld(simState);
  const { level, won } = world;
  const isTimeout = simState.dead && simState.cause === 'timeout';
  const showDeathCard =
    simState.dead && (isTimeout || simState.deathTimer >= DEATH_SLOWMO_FRAMES);
  const activeResultOverlay: 'death' | 'win' | null =
    screen === 'play' && !controlsOpen && !overlayDismissed
      ? won
        ? 'win'
        : showDeathCard
          ? 'death'
          : null
      : null;

  // Reset dismissal when a new terminal state begins
  useEffect(() => {
    if (!won && !showDeathCard) {
      setOverlayDismissed(false);
    }
  }, [won, showDeathCard]);

  // RF-17: Focus trap, Escape dismissal, and focus restoration for Victory / Death overlays
  useEffect(() => {
    if (!activeResultOverlay) return;

    resultPrevFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusFirst = () => {
      const container = resultOverlayRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    };

    const frameId = requestAnimationFrame(focusFirst);

    const onOverlayKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOverlayDismissed(true);
        return;
      }

      if (e.key !== 'Tab') return;
      const container = resultOverlayRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onOverlayKeyDown, true);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onOverlayKeyDown, true);
      if (
        resultPrevFocusRef.current &&
        resultPrevFocusRef.current !== document.body &&
        document.contains(resultPrevFocusRef.current)
      ) {
        resultPrevFocusRef.current.focus();
      }
    };
  }, [activeResultOverlay]);

  // Global keyboard bindings (isolated from timeline slider and active overlays)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Let active modal or result overlay handle Escape and keyboard focus
      if (controlsOpen || activeResultOverlay !== null) return;

      if (screen !== 'play') return;

      const isFocusedButton =
        e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
      const code = e.code;

      if (code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        keysRef.current.up = true;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        keysRef.current.down = true;
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (code === 'KeyR') {
        e.preventDefault();
        if (!simRef.current.dead) {
          keysRef.current.rewind = true;
        }
      } else if (code === 'Space') {
        if (!e.repeat && !isFocusedButton) {
          e.preventDefault();
          handleFinishCurrentLap();
        }
      } else if (code === 'Enter' || code === 'NumpadEnter') {
        if (!isFocusedButton) {
          e.preventDefault();
          if (!e.repeat && !simRef.current.dead && !isWon(simRef.current)) {
            setPaused((p) => !p);
          }
        }
      } else if (code === 'Delete') {
        e.preventDefault();
        if (!e.repeat) resetLevel(simRef.current.levelIndex);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowUp' || code === 'KeyW') keysRef.current.up = false;
      else if (code === 'ArrowDown' || code === 'KeyS') keysRef.current.down = false;
      else if (code === 'ArrowLeft' || code === 'KeyA') keysRef.current.left = false;
      else if (code === 'ArrowRight' || code === 'KeyD') keysRef.current.right = false;
      else if (code === 'KeyR') keysRef.current.rewind = false;
    };

    const onBlur = () => {
      keysRef.current = { up: false, down: false, left: false, right: false, rewind: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [activeResultOverlay, controlsOpen, handleFinishCurrentLap, resetLevel, screen]);

  // Fixed 60 Hz simulation & render loop (unaffected by prefers-reduced-motion)
  useEffect(() => {
    if (screen !== 'play') return;

    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const fixedDt = 1000 / TICK_HZ;

    const loop = (now: number) => {
      const elapsed = Math.min(100, now - lastTime);
      lastTime = now;

      let state = simRef.current;
      const rewinding = keysRef.current.rewind && !state.dead;

      if (rewinding) {
        accumulator += elapsed;
        while (accumulator >= fixedDt) {
          state = rewindStep(state, 3);
          accumulator -= fixedDt;
        }
        prevDeadRef.current = false;
        prevWonRef.current = false;
        prevLapRef.current = state.lap;
        syncState(state);
      } else if (!pausedRef.current && !controlsOpen) {
        accumulator += elapsed;
        const input: InputState = {
          up: keysRef.current.up,
          down: keysRef.current.down,
          left: keysRef.current.left,
          right: keysRef.current.right,
        };

        let stepped = false;
        let subSteps = 0;
        while (accumulator >= fixedDt && subSteps < 12) {
          const next = stepSim(state, input);
          if (next !== state) {
            state = next;
            stepped = true;
          }
          accumulator -= fixedDt;
          subSteps++;
        }

        if (stepped) {
          const nextWorld = deriveWorld(state);
          if (nextWorld.pressedPlates.size > prevPlatesCountRef.current) {
            sfx.plateOn();
          }
          prevPlatesCountRef.current = nextWorld.pressedPlates.size;

          if (state.lap > prevLapRef.current) {
            sfx.lapNext();
          }
          prevLapRef.current = state.lap;

          if (state.dead && !prevDeadRef.current) {
            sfx.death();
          }
          prevDeadRef.current = state.dead;

          if (nextWorld.won && !prevWonRef.current) {
            sfx.win();
            const lvlId = LEVELS[state.levelIndex].id;
            setCompletedLevels((prev) => {
              if (prev.includes(lvlId)) return prev;
              const updated = [...prev, lvlId];
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              } catch {
                // ignore storage limits
              }
              return updated;
            });
          }
          prevWonRef.current = nextWorld.won;

          syncState(state);
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGame(ctx, simRef.current, {
            showFuturePreview: false,
            isRewinding: rewinding,
            isPaused: pausedRef.current,
          });
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [controlsOpen, screen, syncState]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      {/* Top Bar: Brand — Essential Navigation — Contextual Action (strictly 1 primary per screen) */}
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)] shrink-0">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setControlsOpen(false);
              setScreen('menu');
            }}
            className="type-title min-h-8 px-1 text-lg font-bold tracking-tight text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap shrink-0 cursor-pointer rounded-[var(--radius-sm)]"
          >
            Hold For Me
          </button>

          <nav
            aria-label="Navegación principal"
            className="hidden sm:flex items-center gap-2 text-xs"
          >
            <button
              type="button"
              onClick={() => {
                setControlsOpen(false);
                setScreen('menu');
              }}
              aria-current={screen === 'menu' ? 'page' : undefined}
              className="btn-nav"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => setControlsOpen(true)}
              className="btn-nav"
            >
              Controles
            </button>

            {screen === 'play' && (
              <div className="flex items-center gap-2 pl-3 ml-1 border-l border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  disabled={levelIndex <= 0}
                  onClick={() => resetLevel(levelIndex - 1)}
                  aria-label="Nivel anterior"
                  className="btn-secondary p-0 w-8 h-8"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="type-numeric text-xs font-medium text-[var(--color-text)] px-1 whitespace-nowrap">
                  Nivel {level.id}/{LEVELS.length}
                </span>
                <button
                  type="button"
                  disabled={levelIndex + 1 >= LEVELS.length}
                  onClick={() => resetLevel(levelIndex + 1)}
                  aria-label="Siguiente nivel"
                  className="btn-secondary p-0 w-8 h-8"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0" />
        </div>
      </header>

      {screen === 'menu' ? (
        <TitleMenu
          completedLevels={completedLevels}
          onStart={(idx = 0) => resetLevel(idx)}
          onOpenControls={() => setControlsOpen(true)}
        />
      ) : (
        <main className="flex-1 w-full max-w-[1008px] mx-auto px-4 sm:px-6 py-2 flex flex-col items-center justify-center">
          <div className="w-full max-w-[960px] space-y-2">
            {/* Canvas Container (960x400 logical aspect 12:5) */}
            <div className="relative w-full aspect-[12/5] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden shadow-xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                aria-label={`Tablero del nivel ${level.id}: ${level.name}`}
                className="w-full h-full block"
              />

              {/* Death / Loss Overlay Card (RF-17 focus trap + Escape + 1 primary action) */}
              {activeResultOverlay === 'death' && (
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-live="assertive"
                  aria-labelledby="death-title"
                  className="absolute inset-0 backdrop-blur-xs flex items-center justify-center p-4"
                  style={{ backgroundColor: 'var(--color-scrim)' }}
                >
                  <div
                    ref={resultOverlayRef}
                    tabIndex={-1}
                    className="w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-surface)] border-2 p-5 shadow-2xl"
                    style={{ borderColor: C.laserActive }}
                  >
                    <h2
                      id="death-title"
                      className="type-title text-xl font-bold text-[var(--color-text)]"
                    >
                      {isTimeout ? 'Te quedaste sin tiempo' : getDeathMessage(simState)}
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRewindToLapStart}
                        className="btn-primary text-sm"
                      >
                        Reiniciar vuelta
                      </button>
                      <button
                        type="button"
                        onClick={() => resetLevel(levelIndex)}
                        className="btn-secondary text-sm"
                      >
                        Reiniciar nivel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Victory Overlay Card (RF-17 focus trap + RF-18 N10 campaign finale + 1 primary action) */}
              {activeResultOverlay === 'win' && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-live="polite"
                  aria-labelledby="win-title"
                  className="absolute inset-0 backdrop-blur-xs flex items-center justify-center p-4"
                  style={{ backgroundColor: 'var(--color-scrim)' }}
                >
                  <div
                    ref={resultOverlayRef}
                    tabIndex={-1}
                    className="w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-surface)] border-2 p-5 shadow-2xl"
                    style={{ borderColor: C.goal }}
                  >
                    <h2
                      id="win-title"
                      className="type-title text-xl font-bold text-[var(--color-text)]"
                    >
                      ¡Nivel {level.id} completado!
                    </h2>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {levelIndex + 1 < LEVELS.length ? (
                        <button
                          type="button"
                          onClick={() => resetLevel(levelIndex + 1)}
                          className="btn-primary text-sm"
                        >
                          Siguiente nivel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setControlsOpen(false);
                            setScreen('menu');
                          }}
                          className="btn-primary text-sm"
                        >
                          Volver al menú
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Timeline (1-6 dynamic laps, ArrowLeft 1-frame rewind per D-005-6) */}
            <TimelineBar
              state={simState}
              maxLaps={level.maxLaps}
              disabled={simState.dead}
              onSeek={handleSeek}
            />
          </div>
        </main>
      )}

      <LevelSelectorModal
        isOpen={controlsOpen}
        onClose={() => setControlsOpen(false)}
      />
    </div>
  );
}
