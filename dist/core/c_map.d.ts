import { GameObject, GridInterface } from '../types';
declare class c_map {
    ID: number;
    w: number;
    h: number;
    vw: number;
    vh: number;
    ts: number;
    cs: number;
    BGrid: {
        [key: string]: boolean;
    };
    CD: GridInterface;
    tm: number[];
    statics: {
        [key: string]: GameObject;
    };
    dynamics: {
        [key: string]: GameObject;
    };
    units: {
        [key: string]: GameObject;
    };
    projectiles: {
        [key: string]: GameObject;
    };
    resources: {
        [key: string]: GameObject;
    };
    buildings: {
        [key: string]: GameObject;
    };
    effects: {
        [key: string]: GameObject;
    };
    constructor(w: number, h: number, vw: number, vh: number, ts: number, cs: number);
    tmNew(w: number, h: number, v: number): number[];
    tmGet(gx: number, gy: number): number;
    tmSet(gx: number, gy: number, v: number): void;
    XYG(v: number): number;
    RandInt(n: number): number;
    RoundToTwo(num: number): number;
    RoundToThree(num: number): number;
    Lerp(start: number, end: number, amt: number): number;
    VecScale(x: number, y: number, s: number): [number, number];
    VecAdd(x1: number, y1: number, x2: number, y2: number): [number, number];
    VecSub(x1: number, y1: number, x2: number, y2: number): [number, number];
    VecNegate(x: number, y: number): [number, number];
    VecLengthSquared(x: number, y: number): number;
    VecLength(x: number, y: number): number;
    degToRad(deg: number): number;
    radToDeg(rad: number): number;
    Normalize(x: number, y: number): [number, number];
    NormalizeDegrees(r: number): number;
    XYToDegree(x: number, y: number): number;
    RotTarget(x: number, y: number, tx: number, ty: number): number;
    InRange(x: number, y: number, tx: number, ty: number, range: number): boolean;
    ObjCreate(type: string, d: GameObject): number;
    GetUnit(id: number): GameObject | null;
    rmGroupCD(G: {
        [key: string]: GameObject;
    }): void;
    RotatePivot(px: number, py: number, pr: number, offsetx: number, offsety: number): [number, number];
    RandTMBasic(w: number, h: number, a: number, b: number, blocking: boolean): number[];
    RandTM(_tm: number[], w: number, h: number, v: number, r: number): void;
    IsBlocked(x: number, y: number, w: number, h: number, blocking: number): boolean;
    MoveTXY(x: number, y: number, tx: number, ty: number, speed: number, dt: number): [number, number];
    MoveVec(d: any, dt: number, _block: number): boolean;
    MoveBlock(d: any, dt: number, block: number): boolean;
    MoveSlide(d: any, dt: number): boolean;
    pStatic(_d: any, _dt: number): void;
    pDynamic(d: any, dt: number): void;
    pUnit(d: any, dt: number): void;
    pProjectile(d: any, dt: number): void;
    pResource(_d: any, _dt: number): void;
    pBuilding(_d: any, _dt: number): void;
    pEffect(_d: any, _dt: number): void;
    Process(dt: number): void;
    FindEnemyUnit(id: any, d: any, range: any, cwh?: number): any;
    UnitHitDetect(CD: any, Units: any): void;
    ProjectileHitDetect(): void;
    AIRandMove(d: any): void;
    AIRandMoveSide(d: any, s: any): void;
}
export default c_map;
//# sourceMappingURL=c_map.d.ts.map