import { PlayerData, PlayerManagerInterface, WorldInterface, FastUpdateMessage } from './types';
import { WebSocket } from 'ws';

import msgpack from 'msgpack-lite';
//***********************************************************************************************************************
//***********************************************************************************************************************
class PlayerManager implements PlayerManagerInterface {
    World: WorldInterface;
    GID: number;
    Players: { [key: string]: PlayerData };

    constructor(World: WorldInterface) {//callbacks (fastest, fast, slower)
        this.World = World;//ref
        this.GID = 0;
        this.Players = {};
    }
    MathLerp(start: number, end: number, amt: number): number { return (1-amt)*start+amt*end }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Create(socket: WebSocket, _name: string, type: number): PlayerData {
        this.GID++;
        let d: PlayerData = { id:this.GID, socket:socket, uid:-1,//unit id when assigned
            //x:x, y:y, tx:x, ty:y,
            type:type, alive:1, remove:0 };
        this.Players[this.GID] = d;
        //console.log([d.id, d.x, d.y]);
        (socket as any).GID = this.GID;//track

        //Unit spawn
        this.World.PlayerSpawn(d);
        return d;//modify as needed after
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Remove(socket: WebSocket): void {
        console.log("[Remove Player]: " + (socket as any).GID);
        if(this.Players.hasOwnProperty((socket as any).GID)){
            // const PD = this.Players[(socket as any).GID];
            //cleanup Unit
            //if(PD.unit_id !== null){
                //if(CORE_IO.units.hasOwnProperty(PD.unit_id)){
                    //CORE_IO.units[PD.unit_id].remove = 1;
                    //console.log("Removed Player Unit: " + PD.unit_id);
                //}
            //}
            this.Players[(socket as any).GID]!.remove = 1;
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Input(socket: WebSocket, tx: number, ty: number, mouse: number): void {
        if(this.Players.hasOwnProperty((socket as any).GID)){
            let PD = this.Players[(socket as any).GID];
            //console.log(PD.uid)
            if(PD && PD.uid !== -1){
                let unit = this.World.GetUnit(PD.uid);
                if(unit !== null){
                    unit.tx = unit.x - tx;//offset direction
                    unit.ty = unit.y - ty;//offset direction
                    if(mouse === 0 || mouse === 1){(unit as any).boost = mouse;}
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
    CleanUp(): void {
        let RM: string[] = [];
        for (let O in this.Players) {
            if (this.Players.hasOwnProperty(O)) {
                if(this.Players[O]?.remove === 1){ RM.push(O); }
            }
        }
        for(let i=0; i< RM.length; i++){ delete this.Players[RM[i]!]; }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    UpdatePlayers(): void {
        // let LERPP = 0.05;

        //Current Players
        for (let pkey in this.Players) {
            if (this.Players.hasOwnProperty(pkey)) {
                //console.log(pkey)
                let PD = this.Players[pkey];

                //TODO Players Local objects (Area of Interest)
                if(PD && PD.remove === 0 && PD.alive === 1){//alive and well
                    //Has a unit
                    if(PD.uid !== -1){
                        let unit = this.World.GetUnit(PD.uid);
                        if(unit !== null){
                            //unit.tx = tx; unit.ty = ty;
                            //console.time('Pack');
                            let View = this.World.GetView(unit);//players/avatar location
                            //console.timeEnd('Pack');

                            let d: FastUpdateMessage = {type:'fast_update', view: View, pid:pkey, id:PD.uid,
                                x:Math.floor(unit.x), y:Math.floor(unit.y),//current location
                                t: Date.now(),
                            }
                            //console.log(JSON.stringify(d))
                            //console.time('Pack');
                            PD.socket.send(msgpack.encode(d));

                            //PD.socket.send(JSON.stringify(d));

                            //console.log(ed)
                            //console.log(msgpack.decode(ed))
                        }
                        else {
                            console.log("player unit is null " + PD.uid)
                            //Respawn again
                            this.World.PlayerSpawn(PD as PlayerData);
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

export default PlayerManager;