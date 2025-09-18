import { WebSocket } from 'ws';
import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import express from 'express';
import fs from 'fs';
import msgpack from 'msgpack-lite';
import dotenv from 'dotenv';

import NTimer from './timer';
import PM from './player';
// import AGAR from './worlds/agar-io';
import SLITHER from './worlds/slither-io';

console.log("Node.js version:", process.version);
dotenv.config(); //console.log(process.env)
//TODO Add more types!!
//***********************************************************************************************************************
//Config SSL or Not (local development)
const pem_file = "/opt/bitnami/nginx/conf/game.iceturtlestudios.com.key";//TODO SSL CERTS
const cert_file = "/opt/bitnami/nginx/conf/game.iceturtlestudios.com.crt";
//ssl_certificate_key  /opt/bitnami/nginx/conf/game.iceturtlestudios.com.key;
//ssl_certificate      /opt/bitnami/nginx/conf/game.iceturtlestudios.com.crt;

//import geckos from '@geckos.io/server'
//import { iceServers } from '@geckos.io/server'
//const GIO = require('@geckos.io/server');
//***********************************************************************************************************************
//***********************************************************************************************************************
// unused for now - keep logic but assign to void to avoid unused var
const hSERVER: any = ((process.env as any)['USE_SSL'] === "TRUE")
    ? createHttpsServer({ key: fs.readFileSync(pem_file), cert: fs.readFileSync(cert_file) })
    : createServer();
console.log('hSERVER = ', hSERVER);
//const io = new Server(hSERVER, {
//cors: { origin: "*"}//"https://example.com"
//});//CORS ->https://socket.io/docs/v4/handling-cors/
//***********************************************************************************************************************
//***********************************************************************************************************************
let MyTimer: any = null;
let MyPM: any = null;
let MyWorld: any = null;
//let wsPORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app); // Create an HTTP server from your Express app
const wss = new WebSocket.Server({ server }); // Attach the WebSocket server to the existing HTTP server

//const wss = new WebSocket.Server({ server: hSERVER  });
//const wss = new WebSocket.WebSocketServer({ server: hSERVER });
let PTime: number = 0;
let PSendTime: number = 0;
function heartbeat(this: WebSocket) { (this as any).isAlive = true; }
//***********************************************************************************************************************
//***********************************************************************************************************************
async function Init(): Promise<void> {

    let wtype: number = 0;//default
    let w_wh: number = 10000;
    if (wtype === 0) { MyWorld = new SLITHER("Slither", w_wh, w_wh); }
    //if(wtype === 1){ MyWorld = new AGAR("Agar", 1024, 1024); }

    if (MyWorld) {

        app.get('/', (_req: any, res: any) => {
            res.send('Game Server!');
        });

        //Start Time and Player Manager if world is good
        MyTimer = new NTimer(P0, P1, P2, P3, P4);
        MyPM = new PM(MyWorld);//Use World obj here

        console.log('MyTimer = ', MyTimer);
        //Setup Websockets
        wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected');
            MyPM.Create(ws, "", 0);
            (ws as any).isAlive = true;
            ws.on('pong', heartbeat);

            ws.on('message', (d: any) => {
                //d = JSON.parse(d);
                try {
                    if (d.length > 50) { return; }//
                    d = JSON.parse(d);
                    if (d.type === "input") {//force Int
                        MyPM.Input(ws, parseInt(d.d[0]), parseInt(d.d[1]), parseInt(d.d[2]));//target offset (direction)
                    }
                    if (d.type === "ping") {
                        ws.send(msgpack.encode({ type: "pong", timestamp: d.timestamp }));
                        //ws.send(JSON.stringify({ type: "pong", timestamp: d.timestamp }));
                    }

                } catch (error) {
                    // Code to handle the error
                }
                //console.log(`Received: ${d}`);
                //ws.send(`Server received your message: ${message}`);
            });
            ws.on('input', (_d: any) => {

            });

            ws.on('close', () => {
                console.log('Client disconnected');
                MyPM.Remove(ws);
            });
        });

        //console.log('WebSocket server started on port ' + wsPORT);
    }
    else {
        console.log("NO WORLD STARTED!")
    }

    const PORT = (process.env as any)['PORT'] || 3000;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    setInterval(function ping() {
        wss.clients.forEach(function each(ws: WebSocket) {
            console.log("PING Client")
            if ((ws as any).isAlive === false) {
                MyPM.Remove(ws);
                return ws.terminate();
            }

            (ws as any).isAlive = false;
            ws.ping();
        });
    }, 30000);

    // encode from JS Object to MessagePack (Buffer)
    //let buffer = msgpack.encode({"foo": "bar"});
    //console.log(buffer)
    // decode from MessagePack (Buffer) to JS Object
    //let data = msgpack.decode(buffer); // => {"foo": "bar"}
    //console.log(data)
    /*
        const gio = GIO.geckos();
    
        gio.listen()
    
        gio.onConnection(channel => {
            channel.onDisconnect(() => {
                console.log(`${channel.id} got disconnected`)
            })
    
            channel.on('chat message', data => {
                console.log(`got ${data} from "chat message"`)
                // emit the "chat message" data to all channels in the same room
                gio.room(channel.roomId).emit('chat message', data)
            })
        })*/

}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function P0(dt: number): Promise<void> {
    let hrstart = process.hrtime();
    if (MyWorld) {//FASTEST Game Loop!
        MyWorld.Process(dt);//Process world
    }
    let hrend = process.hrtime(hrstart);
    //console.info('Execution time (hrtime): %ds %dms', hrend[0], hrend[1] / 1000000);
    PTime = hrend[1] / 1000000; //to ms
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function P1(_dt: number): Promise<void> {
    let hrstart = process.hrtime();
    if (MyWorld) {//Update Players only
        MyPM.UpdatePlayers();//Update Players (limited view area)
    }
    let hrend = process.hrtime(hrstart);
    //console.info('Execution time (hrtime): %ds %dms', hrend[0], hrend[1] / 1000000);
    PSendTime = hrend[1] / 1000000; //to ms
}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function P2(_dt: number): Promise<void> {
    //console.log("P2 " + dt);//1 Second
    let u = Object.keys(MyWorld.CD.GetAllObjs("unit")).length;
    let f = Object.keys(MyWorld.CD.GetAllObjs("dynamic")).length;
    console.log('Ptime: ' + PTime + " ms " + "SendTime: " + PSendTime + " ms "
        + " Food: " + f + " Circles: " + u);

}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function P3(_dt: number): Promise<void> {
    //console.log("P3 " + dt);//30 Seconds

}
//***********************************************************************************************************************
//***********************************************************************************************************************
async function P4(_dt: number): Promise<void> {
    //console.log("P4 " + dt);//1 Minute
}
//***********************************************************************************************************************
//***********************************************************************************************************************
Init().then(_r => { });