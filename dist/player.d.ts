import { PlayerData, PlayerManagerInterface, WorldInterface } from './types';
import { WebSocket } from 'ws';
declare class PlayerManager implements PlayerManagerInterface {
    World: WorldInterface;
    GID: number;
    Players: {
        [key: string]: PlayerData;
    };
    constructor(World: WorldInterface);
    MathLerp(start: number, end: number, amt: number): number;
    Create(socket: WebSocket, _name: string, type: number): PlayerData;
    Remove(socket: WebSocket): void;
    Input(socket: WebSocket, tx: number, ty: number, mouse: number): void;
    CleanUp(): void;
    UpdatePlayers(): void;
}
export default PlayerManager;
//# sourceMappingURL=player.d.ts.map