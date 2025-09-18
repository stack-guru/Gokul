"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = __importDefault(require("./world"));
const snake_1 = __importDefault(require("./objs/snake"));
//AGAR Like .IO World
//***********************************************************************************************************************
//Snakes Eat food and Die on Snakes Tails
//***********************************************************************************************************************
class SlitherWorld extends world_1.default {
    constructor(name, w, h) {
        super(name, w, h);
        this.food_limit = 4000;
        this.snake_min = 100;
        this.SM = new snake_1.default(this);
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    PlayerSpawn(d) {
        let x = this.RandInt(this.w); //random in world
        let y = this.RandInt(this.h);
        //x = this.w/2; y = this.h/2;
        let tx = this.RandInt(this.w); //random in world
        let ty = this.RandInt(this.h); //random in world
        d.uid = this.SM.CreateSnake(0, x, y, 50);
        let unit = this.GetUnit(d.uid);
        if (unit) {
            unit.tx = tx;
            unit.ty = ty;
        }
        console.log("SpawnSnake: " + x + ", " + y + " " + d.uid);
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CheckFood() {
        let f = Object.keys(this.CD.GetAllObjs("dynamic")).length;
        if (f < this.food_limit / 2) { //leave room for death food
            for (let i = 0; i < 10; i++) {
                let rad = this.RandInt(5) + 15; //standard food = 6-8 radius
                let x = this.RandInt(this.w); //random in world
                let y = this.RandInt(this.h);
                if (this.CD.CircleCollision(x, y, rad, this.w / 2, this.h / 2, this.w / 2) === true) {
                    let c = this.RandInt(this.SM.colors.length - 1); //Index only needed
                    let d = this.CreateDynamic(1, x, y, 0, 0, rad * 2, rad * 2, rad, this.RandInt(10) + 40, c);
                    d.origin_x = x;
                    d.origin_y = y;
                }
            }
            //console.log(f)
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    DeathFood(parts) {
        let f = Object.keys(this.CD.GetAllObjs("dynamic")).length;
        if (f < this.food_limit + parts.length) { //better optimized (one food amount check)
            for (let i = 0; i < parts.length; i += 2) {
                let c = parts[i].color; //this.RandInt(this.SM.colors.length - 1);//Index only needed
                let x = parts[i].x;
                let y = parts[i].y;
                let rad = this.RandInt(10) + 20; //standard food = 68 radius
                if (this.CD.CircleCollision(x, y, rad, this.w / 2, this.h / 2, this.w / 2) === true) {
                    let d = this.CreateDynamic(1, x, y, 0, 0, rad * 2, rad * 2, rad, this.RandInt(10) + 20, c);
                    d.origin_x = x;
                    d.origin_y = y;
                }
            }
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CheckSnakes() {
        let s = this.SnakeHeads();
        if (s < this.snake_min) {
            // let side = this.RandInt(4);
            let x = this.RandInt(this.w); //random in world
            let y = this.RandInt(this.h);
            //sides only for AI
            //if(side === 0){x = 10;}
            //if(side === 1){x = this.w - 10;}
            //if(side === 2){y = 10;}
            //if(side === 3){y = this.h - 10;}
            //this.SM.CreateSnake(1, x, y,this.RandInt(3) + 1);
            //Open Area
            let units = this.CD.GetOtherObjsArea4(x, y, "unit");
            if (Object.keys(units).length === 0) {
                this.SM.CreateSnake(1, x, y);
            }
            //console.log(s)
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    SnakeHeads() {
        let count = 0;
        let units = this.CD.GetAllObjs("unit");
        //console.log(units)
        for (let [, d] of Object.entries(units)) {
            if (d.isLead) {
                count++;
            } //head only
            //console.log(d)
        }
        return count;
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
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
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Process(dt) {
        // let oid: string;
        let d;
        //Add food or ai snakes if needed (not very often)
        if (this.RandInt(100) > 90) {
            this.CheckSnakes();
            this.CheckFood();
        }
        //let TimeC = 0;
        //let hrstart  = process.hrtime();
        let units = this.CD.GetAllObjs("unit");
        for ([, d] of Object.entries(units)) {
            //console.log(oid)
            if (d.isLead) { //head only
                if (d.isAI === 1) {
                    if (d.t_current >= d.t_time) {
                        d.tx = this.RandInt(this.w); //pixel target location
                        d.ty = this.RandInt(this.h);
                        //console.log([d.x, d.tx, d.y, d.ty]);
                        d.t_current = 0;
                        d.t_time = this.RandInt(5) + 2;
                        //console.log("moving...")
                        d.boost = this.RandInt(2); //random boost
                        //console.log(d.boost)
                    }
                    d.t_current += dt;
                }
                if (d.x === d.tx && d.y === d.ty) { }
                else {
                    this.SM.slither(d, dt);
                }
                //console.time('Check');
                this.SM.CheckSnakeHeads(d, dt);
                //console.timeEnd('Check');
                //this.SM.CheckSnakeHeads(d.parts[0]);
            }
            //if(this.AABB(view, obj) === true){ OUT.units[key] = this.GetNETUnit(obj); }
        }
        //let hrend = process.hrtime(hrstart);
        //console.log("UTIME: " + (hrend[1] / 1000000) + " " + Object.keys(units).length);
        let food = this.CD.GetAllObjs("dynamic");
        for ([, d] of Object.entries(food)) {
            //Random movement around origin x, y
            if (d.x === d.tx && d.y === d.ty) {
                d.tx = d.origin_x + (this.RandInt(64) - 32);
                d.ty = d.origin_y + (this.RandInt(64) - 32);
                /*
                //TODO do on Snake Moves not per FOOD (slow)
                if(this.RandInt(100) > 70){//only move sometimes
                    //Find Snake Heads nearby to target
                    let near_units = this.CD.GetOtherObjsArea4(d.x, d.y, "unit")
                    //console.timeEnd('Check');
                    for (let [uid, d2] of Object.entries(units)) {
                        if(d2.isLead){//head only
                            //if(d2.isAI === 0){//player only
                            if(this.CD.CircleCollision(d.x, d.y, 60, d2.x, d2.y, 60) === true){
                                d.tx = d2.x; d.ty = d2.y;
                                d.speed = 100;
                                break;
                            }
                            //}
                        }
                    }
                }*/
                //clamp
                if (d.tx < 0) {
                    d.tx = 0;
                }
                if (d.ty < 0) {
                    d.ty = 0;
                }
                if (d.tx > this.w - 1) {
                    d.tx = this.w - 1;
                }
                if (d.ty > this.h - 1) {
                    d.ty = this.h - 1;
                }
            }
            else {
                //console.log(oid)
                //if(this.RandInt(100) > 80){//only move sometimes
                let xy = this.MoveTXY(d.x, d.y, d.tx, d.ty, d.speed, dt);
                d.x = xy[0];
                d.y = xy[1];
                //}
                //curr.x = this.world.MLerp(curr.x, last.x, this.slerp);
                //curr.y = this.world.MLerp(curr.y, last.y, this.slerp);
                //console.log([d.x, d.y, d.tx, d.ty])
            }
            //out of bounds
            if (this.CD.CircleCollision(d.x, d.y, d.radius, this.w / 2, this.h / 2, this.w / 2) === false) {
                d.remove = 1;
            }
            //if(this.AABB(view, obj) === true){ OUT.units[key] = this.GetNETUnit(obj); }
        }
        //auto clean up (dead etc)
        this.WProcess(dt);
    }
}
exports.default = SlitherWorld;
//# sourceMappingURL=slither-io.js.map