import IOWorld from './world';
import { PlayerData } from '../types';
declare class SlitherWorld extends IOWorld {
    food_limit: number;
    snake_min: number;
    SM: any;
    constructor(name: string, w: number, h: number);
    PlayerSpawn(d: PlayerData): void;
    CheckFood(): void;
    DeathFood(parts: any[]): void;
    CheckSnakes(): void;
    SnakeHeads(): number;
    MoveTXY(x: number, y: number, tx: number, ty: number, speed: number, dt: number): [number, number];
    Process(dt: number): void;
}
export default SlitherWorld;
//# sourceMappingURL=slither-io.d.ts.map