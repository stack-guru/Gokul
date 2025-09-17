export interface GameObjects {
    units: Record<string, any>;
    dynamics: Record<string, any>;
    statics: Record<string, any>;
};

export type SnakeSegment = {
    x: number;
    y: number;
    size: number;
};