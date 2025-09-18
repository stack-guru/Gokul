import { WorldInterface, PlayerData, UnitObject, DynamicObject, ViewData, GridInterface } from '../types';
declare class IOWorld implements WorldInterface {
    name: string;
    w: number;
    h: number;
    CD: GridInterface;
    constructor(name: string, w: number, h: number);
    RandInt(n: number): number;
    GetUnit(id: number): UnitObject | null;
    MLerp(start: number, end: number, amt: number): number;
    AABB(A: any, B: any): boolean;
    CircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean;
    CreateDynamic(type: number, x: number, y: number, z: number, r: number, w: number, h: number, radius: number, speed: number, color?: number): DynamicObject;
    CreateUnit(type: number, x: number, y: number, z: number, r: number, w: number, h: number, radius: number, speed: number, color: number): UnitObject;
    GetNETDynamic(obj: DynamicObject): number[];
    GetNETUnit(obj: UnitObject): number[];
    GetView(d: UnitObject): ViewData;
    WProcess(dt: number): void;
    Process(dt: number): void;
    PlayerSpawn(_d: PlayerData): void;
}
export default IOWorld;
//# sourceMappingURL=world.d.ts.map