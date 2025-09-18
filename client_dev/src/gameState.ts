import { GameObjects } from "./type";

export const GameState = {
    gData: {} as any,
    gId: 0,
    prevData: null as any,
    gameObjects: {
        units: {},
        dynamics: {},
        statics: {}
    } as GameObjects,
    // Objects: {},
    cameraX: 0, //camera target,
    cameraY: 0,
    pivotX: 0,
    pivotY: 0,
    mySnakeH: null,
    mySnakeId: -1,
    LERPP: 0.2,
    DEBUG: false,
    ViewW: 2048,
    ViewH: 2048,
    mapWH: 10000,
    mDown: 0,
    INPUT: null as any,
    PING: 0 as any,
    SKIP_MS: false,
    RENDER_DELAY: 100,
    firstServerTimestamp: 0,
    gameStart: 0,
    gameUpdates: [] as any[],
    socket: null as any,
    PIXICam: null as any,
    PIXITiledBK: null as any,
    PIXI_Viewport: null as any,
    PIXIGfx: null as any,

    // background
    backgroundSpots: [] as any[],
    spotCount: 60,
    spotRadius: 200,
    camera: {
        x: 0,
        y: 0
    }
}
