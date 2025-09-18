"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NanoTimer = require('nanotimer');
//time track
let T0 = Date.now();
let T1 = Date.now();
let T2 = Date.now();
let T3 = Date.now();
let T4 = Date.now();
//***********************************************************************************************************************
//***********************************************************************************************************************
function GetDT(last) {
    let now = Date.now();
    let dt = now - last;
    return dt / 1000; //to ms
}
//***********************************************************************************************************************
//***********************************************************************************************************************
class MyNTimer {
    constructor(c0, c1, c2, c3, c4) {
        this.NT0 = new NanoTimer();
        this.NT1 = new NanoTimer();
        this.NT2 = new NanoTimer();
        this.NT3 = new NanoTimer();
        this.NT4 = new NanoTimer();
        //100m (10 times a second)
        //this.NT1.setInterval(() =>{ let dt = GetDT(T1); T1 = Date.now(); c1(dt); }, '', '100m');
        this.NT0.setInterval(() => { let dt = GetDT(T0); T0 = Date.now(); c0(dt); }, '', '33m'); //30 times a second roughly
        this.NT1.setInterval(() => { let dt = GetDT(T1); T1 = Date.now(); c1(dt); }, '', '50m'); //20 times a second
        this.NT2.setInterval(() => { let dt = GetDT(T2); T2 = Date.now(); c2(dt); }, '', '1s'); //1 second
        this.NT3.setInterval(() => { let dt = GetDT(T3); T3 = Date.now(); c3(dt); }, '', '30s'); //30 seconds
        this.NT4.setInterval(() => { let dt = GetDT(T4); T4 = Date.now(); c4(dt); }, '', '60s'); //60 seconds
    }
}
exports.default = MyNTimer;
//# sourceMappingURL=timer.js.map