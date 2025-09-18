declare class Point {
    x: number;
    y: number;
    userData: any;
    constructor(x: number, y: number, userData: any);
}
declare class Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
    constructor(x: number, y: number, w: number, h: number);
    contains(point: Point): boolean;
    intersects(range: Rectangle): boolean;
}
declare class Circle {
    x: number;
    y: number;
    r: number;
    rSquared: number;
    constructor(x: number, y: number, r: number);
    contains(point: Point): boolean;
    intersects(range: Rectangle): boolean;
}
declare class QuadTree {
    boundary: Rectangle;
    capacity: number;
    points: Point[];
    divided: boolean;
    northeast?: QuadTree;
    northwest?: QuadTree;
    southeast?: QuadTree;
    southwest?: QuadTree;
    constructor(x: number, y: number, w: number, h: number, capacity?: number);
    CreatePoint(x: number, y: number, d: any): Point;
    CreateRectangle(x: number, y: number, w: number, h: number): Rectangle;
    CreateCircle(x: number, y: number, r: number): Circle;
    subdivide(): void;
    insert(point: Point): boolean;
    query(range: Rectangle, found?: Point[]): Point[];
}
export default QuadTree;
//# sourceMappingURL=quadtree.d.ts.map