import { WebSocket } from 'ws';

export interface PlayerData {
  id: number;
  socket: WebSocket;
  uid: number;
  type: number;
  alive: number;
  remove: number;
}

export interface GameObject {
  id: number;
  cat: string;
  type: number;
  side: number;
  owner: number;
  cx: number;
  cy: number;
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  r: number;
  w: number;
  h: number;
  radius: number;
  angle: number;
  speed: number;
  hp: number;
  max_hp: number;
  remove: number;
  ox?: number;
  oy?: number;
}

export interface DynamicObject extends GameObject {
  color: number;
  origin_x?: number;
  origin_y?: number;
}

export interface UnitObject extends GameObject {
  isAI: number;
  t_time: number;
  t_current: number;
  color: number;
  parts: any[];
  boost: number;
  boost_time: number;
  boost_cooldown: number;
  ox: number;
  oy: number;
  isLead?: boolean;
  bright?: number;
}

export interface ViewData {
  dynamics: { [key: string]: number[] };
  units: { [key: string]: number[] };
}

export interface GameMessage {
  type: string;
  d?: number[];
  timestamp?: number;
}

export interface FastUpdateMessage {
  type: 'fast_update';
  view: ViewData;
  pid: string;
  id: number;
  x: number;
  y: number;
  t: number;
}

export interface PongMessage {
  type: 'pong';
  timestamp: number;
}

export interface InputMessage {
  type: 'input';
  d: number[];
}

export interface PingMessage {
  type: 'ping';
  timestamp: number;
}

export type WebSocketMessage = GameMessage | FastUpdateMessage | PongMessage | InputMessage | PingMessage;

export interface WorldInterface {
  name: string;
  w: number;
  h: number;
  CD: any;
  Process(dt: number): void;
  PlayerSpawn(d: PlayerData): void;
  GetUnit(id: number): UnitObject | null;
  GetView(d: UnitObject): ViewData;
}

export interface PlayerManagerInterface {
  World: WorldInterface;
  GID: number;
  Players: { [key: string]: PlayerData };
  Create(socket: WebSocket, name: string, type: number): PlayerData;
  Remove(socket: WebSocket): void;
  Input(socket: WebSocket, tx: number, ty: number, mouse: number): void;
  UpdatePlayers(): void;
  CleanUp(): void;
}

export interface TimerCallback {
  (dt: number): void;
}

export interface TimerInterface {
  NT0: any;
  NT1: any;
  NT2: any;
  NT3: any;
  NT4: any;
}

export interface GridInterface {
  GID: number;
  cell_size: number;
  cell_size_mid: number;
  cells: { [key: string]: { [key: string]: GameObject } };
  all: { [key: string]: GameObject };
  ObjDefault(cat: string, type: number, x: number, y: number, z: number, r: number, w: number, h: number, rad: number, spd: number): GameObject;
  GetObj(id: number): GameObject | null;
  GetAllObjs(cat: string): { [key: string]: GameObject };
  GetObjsAreaFAST(tcx: number, tcy: number, cat: string, cwh: number): { [key: string]: GameObject };
  GetCellObjs(cx: number, cy: number): { [key: string]: GameObject };
  GetCellObjsFilter(cx: number, cy: number, cat: string, id?: number, skip_side?: number, type?: number): { [key: string]: GameObject };
  GetObjsArea(tcx: number, tcy: number, cat: string, id?: number, skip_side?: number, type?: number, cwh?: number): { [key: string]: GameObject };
  Get4Quad(cat: string, tcx: number, tcy: number): { [key: string]: GameObject };
  GetOtherObjsArea4(x: number, y: number, cat: string): { [key: string]: GameObject };
  IsHit(d: GameObject, cx: number, cy: number, cat: string, skip_side?: number, type?: number): [string, GameObject] | null;
  IsObjHitArea(d: GameObject, cat: string, skip_side?: number, type?: number, cwh?: number): [string, GameObject] | null;
  IsObjHitAreaOXY(d: GameObject, cat: string, skip_side?: number, type?: number, cwh?: number): [string, GameObject] | null;
  IsObjHitAreaOXYFaster(d: GameObject, cat: string): [string, GameObject] | null;
  Update(d: GameObject): void;
  Remove(d: GameObject): void;
  Process(dt: number): void;
  CircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean;
}
