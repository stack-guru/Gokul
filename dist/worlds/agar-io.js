"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const world_1 = __importDefault(require("./world"));
//AGAR Like .IO World
//***********************************************************************************************************************
//Circles Eat food and die on larger Circles
//***********************************************************************************************************************
class AgarWorld extends world_1.default {
    constructor(name, w, h) {
        super(name, w, h);
        //Spawn Starting Food
        for (let i = 0; i < 1000; i++) {
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    Process(_dt) {
        let id;
        //for (id in this.statics) { if (this.statics.hasOwnProperty(id)) { this.pStatic(this.statics[id], dt); }}
        for (id in this.dynamics) {
            if (this.dynamics.hasOwnProperty(id)) {
            }
        }
        for (id in this.units) {
            if (this.units.hasOwnProperty(id)) {
            }
        }
        //Update Collision Locations (dynamic, units, projectiles)
        //for (id in this.dynamics) { if (this.dynamics.hasOwnProperty(id)) { this.CD.Update(id, this.dynamics[id]); }}
        //for (id in this.units) { if (this.units.hasOwnProperty(id)) { this.CD.Update(id, this.units[id]); }}
        //auto clean up (dead etc)
        this.rmGroupCD(this.dynamics);
        this.rmGroupCD(this.units);
    }
}
exports.default = AgarWorld;
//# sourceMappingURL=agar-io.js.map