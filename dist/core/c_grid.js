"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//*********************************************************************************************************************************************
//Spatial Grid Collision
//*********************************************************************************************************************************************
class c_grid {
    constructor(cs) {
        this.GID = 0;
        this.cell_size = cs; //pixels
        this.cell_size_mid = cs / 2; //pixels
        this.cells = {}; //track by cell
        this.all = {}; //track everything
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    AABB(A, B) { return (A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y); }
    CircleCollision(x1, y1, r1, x2, y2, r2) { return ((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) <= ((r1 + r2) * (r1 + r2)); }
    cdKey(cx, cy) { return "c" + cx + "-" + cy; }
    GetObj(id) { return this.all[id] ?? null; }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    ObjDefault(cat, type, x, y, z, r, w, h, rad, spd) {
        this.GID++;
        //basic required object data (any)
        return { id: this.GID, cat: cat, type: type, side: -1, owner: -1,
            cx: 0, cy: 0, x: x, y: y, z: z, tx: x, ty: y, vx: 0, vy: 0, r: r, w: w, h: h, radius: rad, angle: 0, speed: spd,
            hp: 1, max_hp: 1,
            remove: 0 };
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    CountCell(ckey) {
        const cell = this.cells[ckey];
        if (cell) {
            return Object.keys(cell).length;
        }
        return 0;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GetAllObjs(cat) {
        let out = {};
        for (let [oid, obj] of Object.entries(this.all)) {
            if (obj.cat === cat) {
                out[oid] = obj;
            }
        }
        return out;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    CleanAllObjs() {
        for (let [_oid, obj] of Object.entries(this.all)) {
            if (obj.remove === 1) {
                this.Remove(obj);
            }
        }
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GetCellObjs(cx, cy) {
        let ckey = this.cdKey(cx, cy);
        const cell = this.cells[ckey];
        if (cell) {
            return cell;
        }
        return {};
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    CountAll() {
        let count = 0;
        let C = this.cells;
        Object.keys(C).forEach(ckey => { const cell = C[ckey]; if (cell) {
            count += Object.keys(cell).length;
        } });
        return count;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Add(d) {
        let key = this.cdKey(d.cx, d.cy);
        if (this.cells.hasOwnProperty(key) && this.cells[key]) {
            this.cells[key][d.id] = d;
        }
        else {
            this.cells[key] = {};
            this.cells[key][d.id] = d;
        } //auto create cell if needed
        if (this.all.hasOwnProperty(d.id) === false) {
            this.all[d.id] = d;
        } //global
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    Remove(d) {
        let key = this.cdKey(d.cx, d.cy);
        if (this.cells.hasOwnProperty(key) && this.cells[key]) {
            if (this.cells[key].hasOwnProperty(d.id)) {
                this.cells[key][d.id] = null; //release first
                delete this.cells[key][d.id];
            }
        }
        if (this.all.hasOwnProperty(d.id)) {
            delete this.all[d.id];
        } //global
    }
    //--------------------------------------------------------------------------------------------------------------
    //Update when moved or created
    //--------------------------------------------------------------------------------------------------------------
    Update(d) {
        if (d.remove === 1) {
            return;
        } //remove and skip
        //remove current if any
        let key = this.cdKey(d.cx, d.cy);
        if (this.cells.hasOwnProperty(key) && this.cells[key]) {
            if (this.cells[key].hasOwnProperty(d.id)) {
                delete this.cells[key][d.id];
            }
        }
        //add too new cell
        d.cx = Math.floor(d.x / this.cell_size);
        d.cy = Math.floor(d.y / this.cell_size);
        this.Add(d);
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GetCellObjsFilter(cx, cy, cat, id = -1, skip_side = -1, type = -1) {
        let out = {};
        let objs = this.GetCellObjs(cx, cy);
        //if(Object.keys(objs).length > 0){ console.log(Object.keys(objs).length);}
        for (const oid in objs) { //Faster
            if (objs.hasOwnProperty(oid)) {
                const obj = objs[oid];
                if (obj.remove === 1) {
                    continue;
                } //already flagged to remove, skip it
                if (obj.cat !== cat) {
                    continue;
                } //match required category (dynamic, static, unit, building, etc...)
                if (skip_side !== -1) {
                    if (obj.side === skip_side) {
                        continue;
                    }
                } //skip side (enemy) (if set >= 0)
                if (type !== -1) {
                    if (obj.type !== type) {
                        continue;
                    }
                } //match required type (if set >= 0)
                //if(parseInt(id) === parseInt(oid)) { console.log("skip ID " + id + " " + oid); continue; }//skip self always
                //if(parseInt(id) === parseInt(oid)) { continue; }//skip self always (SLOW)
                if (id.toString() === oid) {
                    continue;
                } //skip self always (BETTER)
                out[oid] = obj;
            }
        }
        /*
        for (let [oid, obj] of Object.entries(objs)) {
            if(obj.remove === 1){ continue; } //already flagged to remove, skip it
            if(obj.cat !== cat){ continue; } //match required category (dynamic, static, unit, building, etc...)
            if(skip_side !== -1){ if(obj.side === skip_side){ continue; } }//skip side (enemy) (if set >= 0)
            if(type !== -1){ if(obj.type !== type){ continue; } }//match required type (if set >= 0)
            //if(parseInt(id) === parseInt(oid)) { console.log("skip ID " + id + " " + oid); continue; }//skip self always
            if(parseInt(id) === parseInt(oid)) { continue; }//skip self always
            out[oid] = obj;
        }*/
        return out;
    }
    //--------------------------------------------------------------------------------------------------------------
    //Get many cell objects -  static, dynamic, units, items, etc..
    //--------------------------------------------------------------------------------------------------------------
    GetObjsArea(tcx, tcy, cat, id = -1, skip_side = -1, _type = -1, cwh = 1) {
        let objs = {};
        for (let cy = tcy - cwh; cy <= tcy + cwh; cy++) { //surrounding cells
            for (let cx = tcx - cwh; cx <= tcx + cwh; cx++) {
                let other = this.GetCellObjsFilter(cx, cy, cat, id, skip_side);
                objs = { ...objs, ...other };
            }
        }
        return objs;
    }
    //--------------------------------------------------------------------------------------------------------------
    Get4Quad(cat, tcx, tcy) {
        let out = {};
        for (let cy = tcy; cy <= tcy + 2; cy++) { //4 cells only
            for (let cx = tcx; cx <= tcx + 2; cx++) {
                //A bit SLOW
                //objs = { ...this.GetCellObjsFilter(cx, cy, cat, id), ...objs };
                //Faster
                let objs = this.GetCellObjs(cx, cy);
                for (let oid in objs) { //Faster
                    if (objs.hasOwnProperty(oid)) {
                        let obj = objs[oid];
                        if (!obj) {
                            continue;
                        }
                        if (obj.cat !== cat) {
                            continue;
                        } //match required category (dynamic, static, unit, building, etc...)
                        out[oid] = obj;
                    }
                }
            }
        }
        return out;
    }
    //--------------------------------------------------------------------------------------------------------------
    //Get many cell objects (optimized to just 4 cells only, non id) -  static, dynamic, units, items, etc..
    //--------------------------------------------------------------------------------------------------------------
    GetOtherObjsArea4(x, y, cat) {
        let cx = Math.floor(x / this.cell_size);
        let cy = Math.floor(y / this.cell_size);
        let ox = x - (cx * this.cell_size);
        let oy = x - (cx * this.cell_size);
        //console.log([ox, oy, this.cell_size_mid, this.cell_size_mid])
        if (ox < this.cell_size_mid && oy < this.cell_size_mid) { //top left
            return this.Get4Quad(cat, cx - 1, cy - 1);
        }
        if (ox < this.cell_size_mid && oy >= this.cell_size_mid) { //bottom left
            return this.Get4Quad(cat, cx - 1, cy);
        }
        if (ox > this.cell_size_mid && oy < this.cell_size_mid) { //top right
            return this.Get4Quad(cat, cx, cy - 1);
        }
        if (ox >= this.cell_size_mid && oy >= this.cell_size_mid) { //bottom right
            return this.Get4Quad(cat, cx, cy);
        }
        return {}; //Never Used
    }
    //--------------------------------------------------------------------------------------------------------------
    //Get many cell objects (Optimized for player views) -  static, dynamic, units, items, etc..
    //--------------------------------------------------------------------------------------------------------------
    GetObjsAreaFAST(tcx, tcy, cat, cwh) {
        let out = {};
        //console.time('PackGroup');
        for (let cy = tcy - cwh; cy <= tcy + cwh; cy++) { //surrounding cells
            for (let cx = tcx - cwh; cx <= tcx + cwh; cx++) {
                let objs = this.GetCellObjs(cx, cy);
                for (let oid in objs) { //Faster
                    if (objs.hasOwnProperty(oid)) {
                        let obj = objs[oid];
                        if (!obj) {
                            continue;
                        }
                        if (obj.cat !== cat) {
                            continue;
                        } //match required category (dynamic, static, unit, building, etc...)
                        out[oid] = obj;
                    }
                }
            }
        }
        return out;
    }
    //--------------------------------------------------------------------------------------------------------------
    //Check for aabb hit (with filtering if needed)
    //--------------------------------------------------------------------------------------------------------------
    IsHit(d, cx, cy, cat, skip_side = -1, type = -1) {
        let objs = this.GetCellObjsFilter(cx, cy, cat, d.id, skip_side, type); //skip this objects id always
        for (let [oid, obj] of Object.entries(objs)) { //already filtered down
            //if(this.AABB(d, obj) === true){ return [oid, obj]; }
            if (this.CircleCollision(d.x, d.y, d.radius, obj.x, obj.y, obj.radius)) {
                return [oid, obj];
            }
        }
        return null;
    }
    //--------------------------------------------------------------------------------------------------------------
    // Check Cells for a Hit (current and surrounding)
    //--------------------------------------------------------------------------------------------------------------
    IsObjHitArea(d, cat, skip_side = -1, type = -1, _cwh = 1) {
        let objs = this.GetObjsArea(d.cx, d.cy, cat, d.id, skip_side, type); //skip this objects id always
        for (let [oid, obj] of Object.entries(objs)) { //already filtered down
            //if(this.AABB(d, obj) === true){ return [oid, obj]; }
            if (this.CircleCollision(d.x, d.y, d.radius, obj.x, obj.y, obj.radius)) {
                return [oid, obj];
            }
        }
        return null;
    }
    //--------------------------------------------------------------------------------------------------------------
    // Check Cells for a Hit (current and surrounding) - Offset
    //--------------------------------------------------------------------------------------------------------------
    IsObjHitAreaOXY(d, cat, skip_side = -1, type = -1, _cwh = 1) {
        let objs = this.GetObjsArea(d.cx, d.cy, cat, d.id, skip_side, type); //skip this objects id always
        for (let [oid, obj] of Object.entries(objs)) { //already filtered down
            //if(this.AABB(d, obj) === true){ return [oid, obj]; }
            if (this.CircleCollision(d.ox || d.x, d.oy || d.y, d.radius, obj.x, obj.y, obj.radius)) {
                return [oid, obj];
            }
        }
        return null;
    }
    //--------------------------------------------------------------------------------------------------------------
    // Check Cells for a Hit (current and surrounding) - Offset
    //--------------------------------------------------------------------------------------------------------------
    IsObjHitAreaOXYFaster(d, cat) {
        //let objs = this.GetObjsArea(d.cx, d.cy, cat, d.id, skip_side, type);//skip this objects id always
        let objs = this.GetOtherObjsArea4(d.x, d.y, cat);
        for (let [oid, obj] of Object.entries(objs)) { //already filtered down
            //if(this.AABB(d, obj) === true){ return [oid, obj]; }
            if (this.CircleCollision(d.ox || d.x, d.oy || d.y, d.radius, obj.x, obj.y, obj.radius)) {
                return [oid, obj];
            }
        }
        return null;
    }
    //--------------------------------------------------------------------------------------------------------------
    //Basic Grid Processing
    //--------------------------------------------------------------------------------------------------------------
    Process(_dt) {
        //Update Cells (after movement etc)
        for (let [, obj] of Object.entries(this.all)) {
            this.Update(obj);
        }
        //cleanup all removed objects
        this.CleanAllObjs();
    }
}
//******************************************************************************************************************************
//******************************************************************************************************************************
exports.default = c_grid;
//# sourceMappingURL=c_grid.js.map