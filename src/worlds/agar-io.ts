import IOWorld from './world';

//AGAR Like .IO World
//***********************************************************************************************************************
//Circles Eat food and die on larger Circles
//***********************************************************************************************************************
class AgarWorld extends IOWorld {
    constructor(name: string, w: number, h: number) {
        super(name, w, h);

        //Spawn Starting Food
        for(let i=0;i<1000;i++){

        }

    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    override Process(_dt: number): void {
        let id: string;

        //for (id in this.statics) { if (this.statics.hasOwnProperty(id)) { this.pStatic(this.statics[id], dt); }}
        for (id in (this as any).dynamics) { if ((this as any).dynamics.hasOwnProperty(id)) {

        }}
        for (id in (this as any).units) { if ((this as any).units.hasOwnProperty(id)) {

        }}

        //Update Collision Locations (dynamic, units, projectiles)
        //for (id in this.dynamics) { if (this.dynamics.hasOwnProperty(id)) { this.CD.Update(id, this.dynamics[id]); }}
        //for (id in this.units) { if (this.units.hasOwnProperty(id)) { this.CD.Update(id, this.units[id]); }}

        //auto clean up (dead etc)
        (this as any).rmGroupCD((this as any).dynamics);
        (this as any).rmGroupCD((this as any).units);

    }

}

export default AgarWorld;