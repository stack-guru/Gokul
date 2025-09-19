import c_grid from "../core/c_grid";
import { WorldInterface, PlayerData, UnitObject, DynamicObject, ViewData, GridInterface } from '../types';

//Basic .IO World Management
//***********************************************************************************************************************
//***********************************************************************************************************************
class IOWorld implements WorldInterface {
    name: string;
    w: number;
    h: number;
    CD: GridInterface;

    constructor(name: string, w: number, h: number) {
        this.name = name;
        this.w = w; this.h = h;

        //this.CD = new c_grid(256);
        this.CD = new c_grid(50);//better collision

        console.log("Created World: " + name + " " + w + ", " + h);
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    RandInt(n: number): number { return Math.floor(Math.random() * n); }
    //ObjCreate(type, d){ this.GID++; this[type][this.GID] = d; this.CD.Update(d); return this.GID; }
    GetUnit(id: number): UnitObject | null { return this.CD.GetObj(id) as UnitObject | null; }
        //if(this.units.hasOwnProperty(id)){ return this.units[id]; } return null; }
    MLerp(start: number, end: number, amt: number): number  { return (1-amt)*start+amt*end }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    AABB(A: any, B: any): boolean { return ( A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y); }
    CircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean { return ((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2)) <= ((r1 + r2) * (r1 + r2)); }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CreateDynamic(type: number, x: number, y: number, z: number, r: number, w: number, h: number, radius: number, speed: number, color: number = 0): DynamicObject {
        let d = this.CD.ObjDefault("dynamic", type, x,y,z,r,w,h,radius,speed) as DynamicObject;
        d.color=color;
        //let d = {cat:"dynamic", id:this.GID, owner:-1, side:0, type:type, x:x, y:y, r:r, w:w, h:h,
            //radius:radius, angle:0, cx:0, cy:0, speed:speed,vx:0, vy:0,remove:0
        //};
        //this.dynamics[this.GID] = d;
        this.CD.Update(d);
        //console.log([d.cat, d.id, d.x, d.y]);
        return d;

    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CreateUnit(type: number, x: number, y: number, z: number, r: number, w: number, h: number, radius: number, speed: number, color: number): UnitObject {
        let d = this.CD.ObjDefault("unit", type, x,y,z,r,w,h,radius,speed) as UnitObject;
        //add data
        d.isAI =0; d.t_time=1; d.t_current=0; d.color=color;d.parts=[];
        d.boost = 0; d.boost_time=0; d.boost_cooldown = 0.5;
        d.ox = x; d.oy = y;//last offset x/y
        //this.GID++;//ids
        //let d = {cat:"unit",id:this.GID, isAI:0, side:0, type:type, x:x, y:y, tx:x, ty:y, r:r, w:w, h:h,
            //radius:radius, angle:0, cx:0, cy:0, speed:speed,vx:0, vy:0,
            //hp:1, max_hp:1,t_time:1, t_current:0,color: '#ffff00', remove:0, parts: [],
        //};
        this.CD.Update(d);
        //console.log([d.cat, d.id, d.x, d.y]);
        //this.units[this.GID] = d;
        //this.CD.Update(this.GID, d);
        //console.log([this.GID, d.x, d.y]);
        return d;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GetNETDynamic(obj: DynamicObject): number[] {//Simple network Array of Data (Ints)
        return [obj.type, Math.floor(obj.x), Math.floor(obj.y), Math.floor(obj.z), Math.floor(obj.r),
            Math.floor(obj.w), Math.floor(obj.h), Math.floor(obj.radius), parseFloat(obj.angle.toFixed(2)),
            obj.color];
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
    GetNETUnit(obj: UnitObject): number[] {//Simple network Array of Data (Ints)
        return [obj.type, obj.x, obj.y, Math.floor(obj.z), Math.floor(obj.r),
            obj.w, obj.h, obj.radius, obj.angle,
            Math.floor(obj.hp), Math.floor(obj.max_hp), Math.floor(obj.tx), Math.floor(obj.ty),
            obj.color,obj.isLead ? 1 : 0, obj.boost, obj.bright ?? 0, obj.prevUnitId === undefined ? -1 : obj.prevUnitId];
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    GetView(d: UnitObject): ViewData {
        let oid: string, obj: any;
        //let view = {x:x - w/2,y:y - h/2,w:w,h:h};//center around x,y
        let OUT: ViewData = { dynamics:{}, units:{} }
        //console.log(view)

//        let cwh = Math.floor((2048 / this.CD.cell_size) / 2);
        let cwh = Math.floor((1280 / this.CD.cell_size) / 2);//Zoomed Play View
        //console.log("===========================================================")

        //let dynamics = this.CD.GetAllObjs("dynamic");
        //console.time('Pack1');
        //console.profile('myFunctionProfile');
        let dynamics = this.CD.GetObjsAreaFAST(d.cx, d.cy, "dynamic",cwh);
        //let dynamics = this.CD.GetObjsArea(d.cx, d.cy, "dynamic",-1,-1,-1,cwh);
        //console.profileEnd();
        //console.timeEnd('Pack1');
        //console.log("===========================================================")
        //console.log("===========================================================")

        //console.time('Pack2');
        for ([oid, obj] of Object.entries(dynamics)) {
            //if(this.AABB(view, obj) === true){ OUT.dynamics[oid] = this.GetNETDynamic(obj); }
            OUT.dynamics[oid] = this.GetNETDynamic(obj as DynamicObject);
        }
        //console.timeEnd('Pack2');
        //console.time('Pack3');
        //let units = this.CD.GetAllObjs("unit");
        let units = this.CD.GetObjsAreaFAST(d.cx, d.cy, "unit",cwh);
        //let units = this.CD.GetObjsArea(d.cx, d.cy, "unit", -1,-1,-1,cwh);
        //console.timeEnd('Pack3');
        //console.time('Pack4');
        for ([oid, obj] of Object.entries(units)) {
            //if(this.AABB(view, obj) === true){ OUT.units[oid] = this.GetNETUnit(obj); }
            OUT.units[oid] = this.GetNETUnit(obj as UnitObject);
        }
        //console.timeEnd('Pack4');


        return OUT;//Optimized Data
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    WProcess(dt: number): void {

        //basic world process

        //Grid/CD process
        this.CD.Process(dt);
    }

    Process(dt: number): void {
        this.WProcess(dt);
    }

    PlayerSpawn(_d: PlayerData): void {
        // Override in subclasses
    }

}

export default IOWorld;