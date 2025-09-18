// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// QuadTree
// https://www.youtube.com/watch?v=z0YFFg_nBjw

// For more:
// https://github.com/CodingTrain/QuadTree

class Point {
  x: number;
  y: number;
  userData: any;

  constructor(x: number, y: number, userData: any) {
    this.x = x;
    this.y = y;
    this.userData = userData;
  }
}

class Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  contains(point: Point): boolean {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    );
  }

  intersects(range: Rectangle): boolean {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

// circle class for a circle shaped query
class Circle {
  x: number;
  y: number;
  r: number;
  rSquared: number;

  constructor(x: number, y: number, r: number) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.rSquared = this.r * this.r;
  }

  contains(point: Point): boolean {
    // check if the point is in the circle by checking if the euclidean distance of
    // the point and the center of the circle if smaller or equal to the radius of
    // the circle
    let d = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2);
    return d <= this.rSquared;
  }

  intersects(range: Rectangle): boolean {
    var xDist = Math.abs(range.x - this.x);
    var yDist = Math.abs(range.y - this.y);

    // radius of the circle
    var r = this.r;

    var w = range.w;
    var h = range.h;

    var edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2);

    // no intersection
    if (xDist > r + w || yDist > r + h) return false;

    // intersection within the circle
    if (xDist <= w || yDist <= h) return true;

    // intersection on the edge of the circle
    return edges <= this.rSquared;
  }
}

class QuadTree {
  boundary: Rectangle;
  capacity: number;
  points: Point[];
  divided: boolean;
  northeast?: QuadTree;
  northwest?: QuadTree;
  southeast?: QuadTree;
  southwest?: QuadTree;

  constructor(x: number, y: number, w: number, h: number, capacity: number = 4) {
    this.boundary = new Rectangle(x, y, w, h);
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  CreatePoint(x: number, y: number, d: any): Point {return new Point(x, y, d);}
  CreateRectangle(x: number, y: number, w: number, h: number): Rectangle { return new Rectangle(x, y, w, h); }
  CreateCircle(x: number, y: number, r: number): Circle {return new Circle(x, y, r);}

  subdivide(): void {
    let x = this.boundary.x;
    let y = this.boundary.y;
    let w = this.boundary.w / 2;
    let h = this.boundary.h / 2;

    let ne = new Rectangle(x + w, y - h, w, h);
    this.northeast = new QuadTree(ne.x, ne.y, ne.w, ne.h, this.capacity);
    let nw = new Rectangle(x - w, y - h, w, h);
    this.northwest = new QuadTree(nw.x, nw.y, nw.w, nw.h, this.capacity);
    let se = new Rectangle(x + w, y + h, w, h);
    this.southeast = new QuadTree(se.x, se.y, se.w, se.h, this.capacity);
    let sw = new Rectangle(x - w, y + h, w, h);
    this.southwest = new QuadTree(sw.x, sw.y, sw.w, sw.h, this.capacity);

    this.divided = true;
  }

  insert(point: Point): boolean {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (
      this.northeast!.insert(point) ||
      this.northwest!.insert(point) ||
      this.southeast!.insert(point) ||
      this.southwest!.insert(point)
    ) {
      return true;
    }
    return false;
  }

  query(range: Rectangle, found?: Point[]): Point[] {
    if (!found) {
      found = [];
    }

    if (!range.intersects(this.boundary)) {
      return found;
    }

    for (let p of this.points) {
      if (range.contains(p)) {
        found.push(p);
      }
    }
    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }
}

export default QuadTree;