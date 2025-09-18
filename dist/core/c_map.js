"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const c_grid_1 = __importDefault(require("./c_grid"));
//******************************************************************************************************************************
//.IO Core Map Basics JS
//Map - TileMap, Cells, Object Tracking, Math, Collision Detection
//******************************************************************************************************************************
class c_map {
    constructor(w, h, vw, vh, ts, cs) {
        this.ID = 0; //auto increment id
        this.w = w; //width/height in tiles (grid)
        this.h = h;
        this.vw = vw; //view width/height in tiles (grid)
        this.vh = vh;
        this.ts = ts; //tilesize
        this.cs = cs; //cellsize
        this.BGrid = {}; //blocking grid locations - also block
        this.CD = new c_grid_1.default(cs);
        this.tm = this.tmNew(w, h, 1); //tilemap
        console.log("GridWH: " + w + " x " + h + " GridCellSize: " + cs);
        console.log("Tiles: " + (w * h));
        //Object tracking (space or land .IOs)
        this.statics = {}; //dont move
        this.dynamics = {}; //moveable
        this.units = {}; //characters or vehicles
        this.projectiles = {};
        this.resources = {};
        this.buildings = {};
        this.effects = {};
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    tmNew(w, h, v) { let m = []; for (let i = 0; i < (w * h); i++) {
        m.push(v);
    } return m; }
    tmGet(gx, gy) { return this.tm[(gy * this.w) + gx] ?? 0; }
    tmSet(gx, gy, v) { this.tm[(gy * this.w) + gx] = v; }
    XYG(v) { return Math.floor(v / this.ts); } //XY to Grid Coordinate
    RandInt(n) { return Math.floor(Math.random() * n); }
    RoundToTwo(num) { return +(Math.round(Number(num + "e+2")) + "e-2"); }
    RoundToThree(num) { return +(Math.round(Number(num + "e+3")) + "e-3"); }
    Lerp(start, end, amt) { return (1 - amt) * start + amt * end; }
    VecScale(x, y, s) { return [x * s, y * s]; }
    VecAdd(x1, y1, x2, y2) { return [x1 + x2, y1 + y2]; }
    VecSub(x1, y1, x2, y2) { return [x1 - x2, y1 - y2]; }
    VecNegate(x, y) { return [-x, -y]; }
    VecLengthSquared(x, y) { return (x * x + y * y); } //Length
    VecLength(x, y) { return Math.sqrt(x * x + y * y); } //Slower Length
    degToRad(deg) { return deg * (Math.PI / 180); } //Degrees to radians
    radToDeg(rad) { return rad * (180 / Math.PI); } //Radians to degrees
    Normalize(x, y) { let l = this.VecLength(x, y); if (l !== 0) {
        x = x / l;
        y = y / l;
    } return [x, y]; }
    NormalizeDegrees(r) { r = r % 360; if (r < 0) {
        r += 360;
    } return r; } //normalize to 0-360 degree range
    XYToDegree(x, y) { let r = Math.atan2(y, x) * (180 / Math.PI); if (r < 0.0) {
        r += 360.0;
    } return r; }
    RotTarget(x, y, tx, ty) { return this.XYToDegree(tx - x, ty - y); }
    InRange(x, y, tx, ty, range) { if (this.VecLength(tx - x, ty - y) < range) {
        return true;
    } return false; }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //Obj Helpers
    //---------------------------------------------------------------------------------------------------------------------------------------------
    ObjCreate(type, d) { this.ID++; this[type][this.ID] = d; this.CD.Update(d); return this.ID; }
    GetUnit(id) { if (this.units.hasOwnProperty(id)) {
        return this.units[id];
    } return null; }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    rmGroupCD(G) {
        let RM = [];
        for (let O in G) {
            if (G.hasOwnProperty(O)) {
                if (G[O]?.remove === 1) {
                    this.CD.Remove(G[O]);
                    RM.push(O);
                }
            }
        }
        for (let i = 0; i < RM.length; i++) {
            delete G[RM[i]];
        }
        if (RM.length > 0) {
            console.log(RM);
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    RotatePivot(px, py, pr, offsetx, offsety) {
        pr = this.NormalizeDegrees(pr);
        var c_ = Math.cos(this.degToRad(pr));
        var s_ = Math.sin(this.degToRad(pr));
        var x = px + ((offsetx * c_) - (offsety * s_));
        var y = py + ((offsety * c_) + (offsetx * s_));
        return [x, y];
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    RandTMBasic(w, h, a, b, blocking) {
        let tm = this.tmNew(w, h, 1);
        if (blocking) {
            this.RandTM(tm, w, h, 0, 3);
        } //Blocking
        for (let i = a; i < b; i++) {
            this.RandTM(tm, w, h, i, 5);
        } //set tile from a to b small percentage (1-10 for example)
        return tm;
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    RandTM(_tm, w, h, v, r) {
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                if (this.RandInt(100) < r) {
                    this.tmSet(x, y, v);
                }
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    IsBlocked(x, y, w, h, blocking) {
        if (this.tmGet(this.XYG(x), this.XYG(y)) <= blocking) {
            return true;
        }
        if (this.tmGet(this.XYG((x + w - 1)), this.XYG(y)) <= blocking) {
            return true;
        }
        if (this.tmGet(this.XYG(x), this.XYG(y + h - 1)) <= blocking) {
            return true;
        }
        if (this.tmGet(this.XYG(x + w - 1), this.XYG(y + h - 1)) <= blocking) {
            return true;
        }
        //other cases to block like statics/buildings etc
        if (this.BGrid.hasOwnProperty(this.XYG(x) + "_" + this.XYG(y))) {
            return true;
        }
        if (this.BGrid.hasOwnProperty(this.XYG((x + w - 1)) + "_" + this.XYG(y))) {
            return true;
        }
        if (this.BGrid.hasOwnProperty(this.XYG(x) + "_" + this.XYG(y + h - 1))) {
            return true;
        }
        if (this.BGrid.hasOwnProperty(this.XYG(x + w - 1) + "_" + this.XYG(y + h - 1))) {
            return true;
        }
        return false;
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    MoveTXY(x, y, tx, ty, speed, dt) {
        if (x === tx && y === ty) {
            return [x, y];
        }
        let vx = tx - x;
        let vy = ty - y;
        let dest = Math.sqrt(vx * vx + vy * vy);
        let hx = vx / dest;
        let hy = vy / dest;
        let tdist = Math.min(dest, speed * dt);
        x = x + (tdist * hx);
        y = y + (tdist * hy);
        return [x, y];
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    MoveVec(d, dt, _block) {
        let nx = d.x + (Math.cos(d.r) * d.speed * dt);
        let ny = d.y + (Math.sin(d.r) * d.speed * dt);
        if (d.blk === 0) {
            d.x = nx;
            d.y = ny;
            return true;
        } //non blocked by walls
        if (this.IsBlocked(nx, ny, d.w, d.h, 0)) { } //false if blocked
        else if (d.x < 0) {
            return false;
        } //lock to bounds
        else if (d.y < 0) {
            return false;
        }
        else if (d.x > this.w * this.ts) {
            return false;
        }
        else if (d.y > this.h * this.ts) {
            return false;
        }
        else {
            d.x = nx;
            d.y = ny;
            return true;
        } //OK
        return false; //no movement allowed
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //Move with basic block
    //---------------------------------------------------------------------------------------------------------------------------------------------
    MoveBlock(d, dt, block) {
        let xy = this.MoveTXY(d.x, d.y, d.tx, d.ty, d.speed, dt);
        if (block === 0) {
            d.x = xy[0];
            d.y = xy[1];
            return true;
        } //non blocked by walls
        if (this.IsBlocked(xy[0], xy[1], 16, 16, 0)) { } //false if blocked
        else {
            d.x = xy[0];
            d.y = xy[1];
            return true;
        } //OK
        return false; //no movement allowed
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //Move but try to slide on block
    //---------------------------------------------------------------------------------------------------------------------------------------------
    MoveSlide(d, dt) {
        let xy = this.MoveTXY(d.x, d.y, d.tx, d.ty, d.speed, dt);
        if (this.IsBlocked(xy[0], xy[1], this.ts, this.ts, 0)) {
            if (this.IsBlocked(xy[0], d.y, this.ts, this.ts, 0)) { //Try with Y same and new X
                if (this.IsBlocked(d.x, xy[1], this.ts, this.ts, 0)) { //Try with X same new Y
                    d.tx = d.x;
                    d.ty = d.y; //set to current
                }
                else {
                    d.y = xy[1];
                    return true;
                } //OK with just X move
            }
            else {
                d.x = xy[0];
                return true;
            } //OK with just X move
        }
        else {
            d.x = xy[0];
            d.y = xy[1];
            return true;
        } //OK
        return false; //no movement allowed
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pStatic(_d, _dt) {
        //does nothing, no processing needed
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pDynamic(d, dt) {
        if (d.remove === 1) {
            return;
        }
        if (d.mvt === 0) { //vector
            let mv = this.MoveVec(d, dt, d.blk);
            if (mv === false) {
                d.remove = 1;
            }
        }
        if (d.mvt === 1) { //target xy (move or stop if blocked)
            if (d.x === d.tx && d.y === d.ty) { } //d.remove = 1; }
            else {
                let mv = this.MoveBlock(d, dt, d.blk);
                if (mv === false) {
                    d.tx = d.x;
                    d.ty = d.y;
                } //d.remove = 1; }
            }
        }
        //console.log([d.x, d.y])
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pUnit(d, dt) {
        //Move if txy set
        if (d.x === d.tx && d.y === d.ty) { }
        else {
            if (d.mv_current >= d.mv_time) {
                this.MoveSlide(d, dt);
                d.mv_current = 0;
            }
            d.mv_current += dt;
        }
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pProjectile(d, dt) {
        if (d.remove === 1) {
            return;
        }
        if (d.mvt === 0) { //vector
            let mv = this.MoveVec(d, dt, d.blk);
            if (mv === false) {
                d.remove = 1;
            }
        }
        if (d.mvt === 1) { //target xy
            if (d.x === d.tx && d.y === d.ty) {
                d.remove = 1;
            }
            else {
                let mv = this.MoveBlock(d, dt, d.blk);
                if (mv === false) {
                    d.remove = 1;
                }
            }
        }
        //lifetime
        if (d.ltc > d.lt) {
            d.remove = 1;
        }
        d.ltc += dt;
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pResource(_d, _dt) {
        //TODO
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pBuilding(_d, _dt) {
        //TODO
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    pEffect(_d, _dt) {
        //TODO
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    Process(dt) {
        let id;
        for (id in this.statics) {
            if (this.statics.hasOwnProperty(id)) {
                this.pStatic(this.statics[id], dt);
            }
        }
        for (id in this.dynamics) {
            if (this.dynamics.hasOwnProperty(id)) {
                this.pDynamic(this.dynamics[id], dt);
            }
        }
        for (id in this.units) {
            if (this.units.hasOwnProperty(id)) {
                this.pUnit(this.units[id], dt);
            }
        }
        for (id in this.projectiles) {
            if (this.projectiles.hasOwnProperty(id)) {
                this.pProjectile(this.projectiles[id], dt);
            }
        }
        for (id in this.resources) {
            if (this.resources.hasOwnProperty(id)) {
                this.pResource(this.resources[id], dt);
            }
        }
        for (id in this.buildings) {
            if (this.buildings.hasOwnProperty(id)) {
                this.pBuilding(this.buildings[id], dt);
            }
        }
        for (id in this.effects) {
            if (this.effects.hasOwnProperty(id)) {
                this.pEffect(this.effects[id], dt);
            }
        }
        //Update Collision Locations (dynamic, units, projectiles)
        for (id in this.dynamics) {
            if (this.dynamics.hasOwnProperty(id)) {
                this.CD.Update(this.dynamics[id]);
            }
        }
        for (id in this.units) {
            if (this.units.hasOwnProperty(id)) {
                this.CD.Update(this.units[id]);
            }
        }
        for (id in this.projectiles) {
            if (this.projectiles.hasOwnProperty(id)) {
                this.CD.Update(this.projectiles[id]);
            }
        }
        //Hit Damage (unit to unit touch)
        //this.UnitHitDetect(this.CD, this.W.unit);
        //projectile to units
        this.ProjectileHitDetect();
        //auto clean up (dead etc)
        this.rmGroupCD(this.statics);
        this.rmGroupCD(this.dynamics);
        this.rmGroupCD(this.resources);
        this.rmGroupCD(this.buildings);
        this.rmGroupCD(this.units);
        this.rmGroupCD(this.projectiles);
        this.rmGroupCD(this.effects);
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    FindEnemyUnit(id, d, range, cwh = 3) {
        //console.log([d.cx, d.cy, id, d.side, cwh])
        let units = this.CD.GetEnemyList(d.cx, d.cy, id, d.side, cwh);
        //console.log(units)
        let target = null;
        let dist = 10000; //default high
        for (let i = 0; i < units.length; i++) { //[[id, d],...]
            let tid = units[i][0];
            let t = units[i][1];
            let nd = this.VecLength(t.x - d.x, t.y - d.y);
            if (nd < range && nd < dist) { //found target or closer one
                dist = nd;
                target = [tid, t.x, t.y]; //info needed to target it
            }
        }
        return target;
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    UnitHitDetect(CD, Units) {
        let o;
        for (let id in Units) {
            if (Units.hasOwnProperty(id)) {
                let d = Units[id];
                o = CD.IsHit(d, d.cx, d.cy, "unit", d.side);
                if (o !== null) {
                    d.u_collide = true;
                }
                else {
                    d.u_collide = false;
                }
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    ProjectileHitDetect() {
        let o;
        for (let id in this.units) {
            if (this.units.hasOwnProperty(id)) {
                let d = this.units[id];
                o = this.CD.IsHit(d, d.cx, d.cy, "projectile", d.side);
                if (o !== null) { //[id, obj]
                    d.p_collide = true;
                    d.hp -= o[1].dmg;
                    if (d.hp <= 0) {
                        d.hp = 0;
                        d.remove = 1;
                    } //death
                    o[1].remove = 1; //remove projectile
                } //dead
                else {
                    d.p_collide = false;
                }
            }
        }
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    AIRandMove(d) {
        d.tx = this.RandInt((this.w - 1) * this.ts); //pixel target location (not grid)
        d.ty = this.RandInt((this.h - 1) * this.ts);
    }
    //---------------------------------------------------------------------------------------------------------------------------------------------
    //---------------------------------------------------------------------------------------------------------------------------------------------
    AIRandMoveSide(d, s) {
        d.tx = this.RandInt((this.w - 1) * this.ts); //pixel target location (not grid)
        d.ty = this.RandInt((this.h - 1) * this.ts);
        if (s === 0) {
            d.tx = (this.w * this.ts) - this.ts / 2;
        }
        if (s === 1) {
            d.tx = this.ts / 2;
        }
        if (s === 2) {
            d.ty = this.ts / 2;
        }
        if (s === 3) {
            d.ty = (this.h * this.ts) - this.ts / 2;
        }
    }
}
//******************************************************************************************************************************
//******************************************************************************************************************************
exports.default = c_map;
//# sourceMappingURL=c_map.js.map