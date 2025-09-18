import { GameObject, GridInterface } from '../types';
declare class c_grid implements GridInterface {
    GID: number;
    cell_size: number;
    cell_size_mid: number;
    cells: {
        [key: string]: {
            [key: string]: GameObject;
        };
    };
    all: {
        [key: string]: GameObject;
    };
    constructor(cs: number);
    AABB(A: GameObject, B: GameObject): boolean;
    CircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean;
    cdKey(cx: number, cy: number): string;
    GetObj(id: number): GameObject | null;
    ObjDefault(cat: string, type: number, x: number, y: number, z: number, r: number, w: number, h: number, rad: number, spd: number): GameObject;
    CountCell(ckey: string): number;
    GetAllObjs(cat: string): {
        [key: string]: GameObject;
    };
    CleanAllObjs(): void;
    GetCellObjs(cx: number, cy: number): {
        [key: string]: GameObject;
    };
    CountAll(): number;
    Add(d: GameObject): void;
    Remove(d: GameObject): void;
    Update(d: GameObject): void;
    GetCellObjsFilter(cx: number, cy: number, cat: string, id?: number, skip_side?: number, type?: number): {
        [key: string]: GameObject;
    };
    GetObjsArea(tcx: number, tcy: number, cat: string, id?: number, skip_side?: number, _type?: number, cwh?: number): {
        [key: string]: GameObject;
    };
    Get4Quad(cat: string, tcx: number, tcy: number): {
        [key: string]: GameObject;
    };
    GetOtherObjsArea4(x: number, y: number, cat: string): {
        [key: string]: GameObject;
    };
    GetObjsAreaFAST(tcx: number, tcy: number, cat: string, cwh: number): {
        [key: string]: GameObject;
    };
    IsHit(d: GameObject, cx: number, cy: number, cat: string, skip_side?: number, type?: number): [string, GameObject] | null;
    IsObjHitArea(d: GameObject, cat: string, skip_side?: number, type?: number, _cwh?: number): [string, GameObject] | null;
    IsObjHitAreaOXY(d: GameObject, cat: string, skip_side?: number, type?: number, _cwh?: number): [string, GameObject] | null;
    IsObjHitAreaOXYFaster(d: GameObject, cat: string): [string, GameObject] | null;
    Process(_dt: number): void;
}
export default c_grid;
//# sourceMappingURL=c_grid.d.ts.map