declare class IOSnakeManager {
    world: any;
    scale: number;
    slowSpeed: number;
    fastSpeed: number;
    rad: number;
    slerp: number;
    LevelXP: number;
    colors: string[];
    constructor(world: any);
    rgbToHex(r: number, g: number, b: number): string;
    CreateSnake(isAI: number, x: number, y: number, size?: number): number;
    AddEXP(head: any, exp: number): void;
    LoseEXP(head: any, exp: number): void;
    drawSmoothCurveQuadratic(context: any, points: any[]): void;
    getDistance(p1: any, p2: any): number;
    moveTo(obj: any, dt: number): void;
    SimpleRotateTo(angle: number, target: number, spd: number): number;
    slither(obj: any, dt: number): void;
    DoDeath(obj: any): void;
    CheckSnakeHeads(obj: any, dt: number): void;
    CheckHeadHit(d: any): [string, any] | null;
}
export default IOSnakeManager;
//# sourceMappingURL=snake.d.ts.map