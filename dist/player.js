"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msgpack_lite_1 = __importDefault(require("msgpack-lite"));
//***********************************************************************************************************************
//***********************************************************************************************************************
class PlayerManager {
    constructor(World) {
        this.World = World; //ref
        this.GID = 0;
        this.Players = {};
    }
    MathLerp(start, end, amt) { return (1 - amt) * start + amt * end; }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Create(socket, _name, type) {
        this.GID++;
        let d = { id: this.GID, socket: socket, uid: -1, //unit id when assigned
            //x:x, y:y, tx:x, ty:y,
            type: type, alive: 1, remove: 0 };
        this.Players[this.GID] = d;
        //console.log([d.id, d.x, d.y]);
        socket.GID = this.GID; //track
        //Unit spawn
        this.World.PlayerSpawn(d);
        return d; //modify as needed after
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Remove(socket) {
        console.log("[Remove Player]: " + socket.GID);
        if (this.Players.hasOwnProperty(socket.GID)) {
            // const PD = this.Players[(socket as any).GID];
            //cleanup Unit
            //if(PD.unit_id !== null){
            //if(CORE_IO.units.hasOwnProperty(PD.unit_id)){
            //CORE_IO.units[PD.unit_id].remove = 1;
            //console.log("Removed Player Unit: " + PD.unit_id);
            //}
            //}
            this.Players[socket.GID].remove = 1;
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Input(socket, tx, ty, mouse) {
        if (this.Players.hasOwnProperty(socket.GID)) {
            let PD = this.Players[socket.GID];
            //console.log(PD.uid)
            if (PD && PD.uid !== -1) {
                let unit = this.World.GetUnit(PD.uid);
                if (unit !== null) {
                    unit.tx = unit.x - tx; //offset direction
                    unit.ty = unit.y - ty; //offset direction
                    if (mouse === 0 || mouse === 1) {
                        unit.boost = mouse;
                    }
                    //                    tx = tx - 512; ty = ty - 512;//based on center of screen
                    //unit.tx = tx; unit.ty = ty;
                    //                    unit.tx = unit.x + tx; unit.ty = unit.y + ty;//directional
                    //console.log("PlayerMove " + tx + " " +  ty);
                }
            }
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CleanUp() {
        let RM = [];
        for (let O in this.Players) {
            if (this.Players.hasOwnProperty(O)) {
                if (this.Players[O]?.remove === 1) {
                    RM.push(O);
                }
            }
        }
        for (let i = 0; i < RM.length; i++) {
            delete this.Players[RM[i]];
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    UpdatePlayers() {
        // let LERPP = 0.05;
        //Current Players
        for (let pkey in this.Players) {
            if (this.Players.hasOwnProperty(pkey)) {
                //console.log(pkey)
                let PD = this.Players[pkey];
                //TODO Players Local objects (Area of Interest)
                if (PD && PD.remove === 0 && PD.alive === 1) { //alive and well
                    //Has a unit
                    if (PD.uid !== -1) {
                        let unit = this.World.GetUnit(PD.uid);
                        if (unit !== null) {
                            //unit.tx = tx; unit.ty = ty;
                            //console.time('Pack');
                            let View = this.World.GetView(unit); //players/avatar location
                            //console.timeEnd('Pack');
                            let d = { type: 'fast_update', view: View, pid: pkey, id: PD.uid,
                                x: Math.floor(unit.x), y: Math.floor(unit.y), //current location
                                t: Date.now(),
                            };
                            //console.log(JSON.stringify(d))
                            //console.time('Pack');
                            PD.socket.send(msgpack_lite_1.default.encode(d));
                            //PD.socket.send(JSON.stringify(d));
                            //console.log(ed)
                            //console.log(msgpack.decode(ed))
                        }
                        else {
                            console.log("player unit is null " + PD.uid);
                            //Respawn again
                            this.World.PlayerSpawn(PD);
                        }
                    }
                    //Lerp to map target
                    //PD.x = this.MathLerp(PD.x, PD.tx, LERPP);
                    //PD.y = this.MathLerp(PD.y, PD.ty, LERPP);
                    //console.log(PD.x + " " + PD.y)
                    //console.log(View)
                }
            }
        }
        //CleanUp Closed Players
        this.CleanUp();
    }
}
exports.default = PlayerManager;
//# sourceMappingURL=player.js.map