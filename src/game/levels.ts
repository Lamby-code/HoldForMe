export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Plate {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  requiredPlates: string[];
}

export interface Laser {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** If defined, laser only fires while all referenced plates are pressed */
  poweredByPlates?: string[];
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  maxLaps: number;
  hint: string;
  spawn: { x: number; y: number };
  goal: { x: number; y: number; r: number };
  walls: Rect[];
  plates: Plate[];
  doors: Door[];
  lasers: Laser[];
}

export const CANVAS_W = 960;
export const CANVAS_H = 600;
const WALL_T = 24;

const PERIMETER_WALLS: Rect[] = [
  { x: 0, y: 0, w: CANVAS_W, h: WALL_T },
  { x: 0, y: CANVAS_H - WALL_T, w: CANVAS_W, h: WALL_T },
  { x: 0, y: WALL_T, w: WALL_T, h: CANVAS_H - WALL_T * 2 },
  { x: CANVAS_W - WALL_T, y: WALL_T, w: WALL_T, h: CANVAS_H - WALL_T * 2 },
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Caminar',
    subtitle: 'Un cuarto, una meta, sin fantasmas.',
    maxLaps: 1,
    hint: 'Usa WASD o las flechas para rodear el pilar y llegar a la meta dorada.',
    spawn: { x: 120, y: 300 },
    goal: { x: 816, y: 536, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 456, y: 96, w: 24, h: 408 },
    ],
    plates: [],
    doors: [],
    lasers: [],
  },
  {
    id: 2,
    name: 'El sostén',
    subtitle: 'Tu vuelta anterior puede sostener una placa por vos.',
    maxLaps: 2,
    hint: 'Vuelta 1: parate sobre la placa A y esperá que termine el loop. Vuelta 2: rodeá tu rastro sólido y cruzá la puerta.',
    spawn: { x: 120, y: 300 },
    goal: { x: 830, y: 300, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 680, y: 24, w: 24, h: 210 },
      { x: 680, y: 366, w: 24, h: 210 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 360, y: 300, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 680, y: 234, w: 24, h: 132, requiredPlates: ['A'] },
    ],
    lasers: [],
  },
  {
    id: 3,
    name: 'El relevo',
    subtitle: 'Repartí trabajos y encadená tres vueltas.',
    maxLaps: 3,
    hint: 'Vuelta 1 sostiene A (abre Puerta 1). Vuelta 2 cruza a B y la sostiene. Vuelta 3 entra con ambas puertas abiertas.',
    spawn: { x: 110, y: 420 },
    goal: { x: 826, y: 340, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 360, y: 24, w: 24, h: 170 },
      { x: 360, y: 326, w: 24, h: 250 },
      { x: 660, y: 24, w: 24, h: 250 },
      { x: 660, y: 406, w: 24, h: 170 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 210, y: 150, r: 22 },
      { id: 'B', label: 'B', x: 510, y: 460, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 360, y: 194, w: 24, h: 132, requiredPlates: ['A'] },
      { id: 'D2', x: 660, y: 274, w: 24, h: 132, requiredPlates: ['A', 'B'] },
    ],
    lasers: [],
  },
  {
    id: 4,
    name: 'La cuadrilla',
    subtitle: 'Placa, bloqueo de láser, relevo y salida en cuatro vueltas.',
    maxLaps: 4,
    hint: 'Vuelta 1 sostiene A. Vuelta 2 se ubica arriba en la línea del láser para tapar el haz. Vuelta 3 pasa por debajo y sostiene B (que activa el láser y abre la salida). Vuelta 4 llega a la meta.',
    spawn: { x: 100, y: 300 },
    goal: { x: 842, y: 300, r: 24 },
    walls: [
      ...PERIMETER_WALLS,
      { x: 280, y: 24, w: 24, h: 190 },
      { x: 280, y: 366, w: 24, h: 210 },
      { x: 480, y: 24, w: 24, h: 176 },
      { x: 480, y: 360, w: 24, h: 216 },
      { x: 720, y: 24, w: 24, h: 210 },
      { x: 720, y: 366, w: 24, h: 210 },
    ],
    plates: [
      { id: 'A', label: 'A', x: 160, y: 140, r: 22 },
      { id: 'B', label: 'B', x: 604, y: 470, r: 22 },
    ],
    doors: [
      { id: 'D1', x: 280, y: 214, w: 24, h: 152, requiredPlates: ['A'] },
      { id: 'D2', x: 720, y: 234, w: 24, h: 132, requiredPlates: ['B'] },
    ],
    lasers: [
      { id: 'L1', x1: 492, y1: 200, x2: 492, y2: 360, poweredByPlates: ['B'] },
    ],
  },
];
