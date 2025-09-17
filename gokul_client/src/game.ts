import { Texture, Sprite, Container, TilingSprite, Graphics, TextStyle, Text } from "pixi.js";
import { initAssets } from "./asset";
import { setupWebsocket } from "./websocket";
import { app as PIXIApp } from "./main";
import { rgbToHex, randomNumber, adjustBrightnessRGB, drawDebugRect, calculateLerp } from "./utils";
import {
    headTexture,
    eyesTexture,
    eyeTexture,
    bodyTexture1,
    // bodyTexture2,
    // bodyTexture3,
    bodyTexture4,
    bkTexture,
    glowTexture
} from "./asset";
import { HEAD_EYES } from "./constant";
import { GameState } from "./gameState";

function CreateCircle(texture: Texture, x: number, y: number, z: number, scale = 1, rot = 0) {
    GameState.gId++;
    const sprite = new Sprite(texture);
    sprite.position.set(x, y); // Set x and y coordinates
    sprite.anchor.set(0.5); // Set anchor point to the center for rotation/scaling around the center
    sprite.scale.set(scale); // Double the size
    sprite.rotation = rot;//Math.PI / 4; // Rotate 45 degrees
    sprite.zIndex = z; // Lower zIndex
    //PIXIApp.stage.addChild(sprite);
    GameState.PIXICam.addChild(sprite);

    // sprite.REMOVE = 0;//flag to remove
    return sprite;
}

function rotate_by_pivot(px: number, py: number, pr: number, ox: number, oy: number) {//sets location by rotating around a different pivot point
    //pr = exports.NormalizeDegrees(pr);
    //var c_ = Math.cos(exports.degToRad(pr));
    //var s_ = Math.sin(exports.degToRad(pr));
    const c_ = Math.cos(pr);//use radians
    const s_ = Math.sin(pr);
    const x = px + ((ox * c_) - (oy * s_));
    const y = py + ((oy * c_) + (ox * s_));
    return [x, y];
}

function CleanGroupObj(Group: any, sGroup: any) {
    //auto clean up removed units
    const remove = [];
    for (const uid in Group) {
        if (Group.hasOwnProperty(uid)) {
            if (sGroup.hasOwnProperty(parseInt(uid)) === false) {
                remove.push(uid);
            }
        }
    }

    for (let i = 0; i < remove.length; i++) {
        const kk = remove[i];
        const obj = Group[kk];
        if (obj.parent) {
            obj.parent.removeChild(obj);
        }
        if (obj.hasOwnProperty("EYES")) {
            if (obj.EYES !== null) {
                obj.EYES.destroy();
            }
        }//Units have eyes somtimes
        if (obj.hasOwnProperty("EYES1")) {
            if (obj.EYES1 !== null) {
                obj.EYES1.destroy();
            }
        }//Units have eyes somtimes
        if (obj.hasOwnProperty("EYES2")) {
            if (obj.EYES2 !== null) {
                obj.EYES2.destroy();
            }
        }//Units have eyes somtimes
        if (obj.hasOwnProperty("GLOW")) {//units have glow
            obj.GLOW.destroy();
        }

        if (obj && typeof (obj as any).destroy === "function") {
            obj.destroy();
        }
        delete Group[kk];//remove
    }
}

export function process() {
    // for (let key in GameState.Objects) {
    //     if (GameState.Objects.hasOwnProperty(key)) {
    //         let obj = GameState.Objects[key];
    //         //obj.rotation += 0.01; // Rotate the square
    //     }
    // }

    // Get the global mouse position
    // const pos = PIXIApp.renderer.events.pointer.global;
    // const mx = Math.floor(pos.x)
    // const my = Math.floor(pos.x)

    //Update Objects to tx/ty
    let id, obj;
    for (id in GameState.gameObjects.dynamics) {
        if (GameState.gameObjects.dynamics.hasOwnProperty(id)) {
            obj = GameState.gameObjects.dynamics[id];
            obj.x = calculateLerp(obj.x, obj.tx, GameState.LERPP);
            obj.y = calculateLerp(obj.y, obj.ty, GameState.LERPP);
            //if(obj.TYPE > 8){ obj.angle += obj.SPIN; }
        }
    }

    for (id in GameState.gameObjects.units) {
        if (GameState.gameObjects.units.hasOwnProperty(id)) {
            obj = GameState.gameObjects.units[id];
            obj.x = calculateLerp(obj.x, obj.tx, GameState.LERPP);
            obj.y = calculateLerp(obj.y, obj.ty, GameState.LERPP);
            if (obj.EYES !== null) { obj.EYES.x = obj.x; obj.EYES.y = obj.y; }
            // const offset = obj.width / 4;
            obj.onViewUpdate();
            if (obj.EYES1 !== null) {
                const rxy = rotate_by_pivot(obj.x, obj.y, obj.rotation, obj.width / 4, -obj.width / 6);
                obj.EYES1.x = rxy[0];//obj.x + Math.cos(obj.rotation - 0.85) * obj.width/2 * 0.60;
                obj.EYES1.y = rxy[1];//obj.y + Math.sin(obj.rotation - 0.85) * obj.height/2 * 0.60;
                if (GameState.INPUT) {
                    obj.EYES1.rotation = Math.atan2(-GameState.INPUT[1], -GameState.INPUT[0]);
                }
                obj.EYES1.onViewUpdate();

            }
            if (obj.EYES2 !== null) {
                const lxy = rotate_by_pivot(obj.x, obj.y, obj.rotation, obj.width / 4, obj.width / 6);
                obj.EYES2.x = lxy[0];//obj.x + Math.cos(obj.rotation - 0.85) * obj.width/2 * 0.60;
                obj.EYES2.y = lxy[1];//obj.y + Math.sin(obj.rotation - 0.85) * obj.height/2 * 0.60;
                if (GameState.INPUT) {
                    obj.EYES2.rotation = Math.atan2(-GameState.INPUT[1], -GameState.INPUT[0]);
                }
                obj.EYES2.onViewUpdate();
            }

            obj.GLOW.x = obj.x;
            obj.GLOW.y = obj.y;
        }
    }

    //Clean up removed Ids
    if (GameState.prevData) {
        CleanGroupObj(GameState.gameObjects.dynamics, GameState.prevData.dynamics);
        CleanGroupObj(GameState.gameObjects.units, GameState.prevData.units);
    }
    //GameState.PIXICam.x++
    //GameState.PIXICam.x = calculateLerp(GameState.PIXICam.x, CX , 0.1);
    //GameState.PIXICam.y = calculateLerp(GameState.PIXICam.y, CY , 0.1);
    GameState.PIXICam.pivot.x = calculateLerp(GameState.PIXICam.pivot.x, GameState.pivotX, 0.1);
    GameState.PIXICam.pivot.y = calculateLerp(GameState.PIXICam.pivot.y, GameState.pivotY, 0.1);
    GameState.PIXICam.x = PIXIApp.screen.width / 2;
    GameState.PIXICam.y = PIXIApp.screen.height / 2;

    //console.log(CX);
    //CX = -obj[1] + PIXIApp.screen.width / 2;
    //CY = -obj[2] + PIXIApp.screen.height / 2;

    //GameState.PIXICam.x = -player.x + app.screen.width / 2;
    //GameState.PIXICam.y = -player.y + app.screen.height / 2;

    const btk = 1024;//70;//background tilesize
    const vx = GameState.PIXICam.pivot.x - GameState.ViewW / 2;
    const vy = GameState.PIXICam.pivot.y - GameState.ViewH / 2;
    const ox = Math.floor(vx / btk);
    const oy = Math.floor(vy / btk);

    //GameState.PIXITiledBK.tilePosition.x = GameState.PIXICam.x;//-GameState.PIXICam.left;
    //GameState.PIXITiledBK.tilePosition.y = GameState.PIXICam.y;//-GameState.PIXICam.top;
    GameState.PIXITiledBK.tilePosition.x = (ox * btk) - vx;//-GameState.PIXICam.left;
    GameState.PIXITiledBK.tilePosition.y = (oy * btk) - vy;//-GameState.PIXICam.top;
    GameState.PIXITiledBK.x = GameState.PIXICam.pivot.x - GameState.ViewW / 2;//GameState.PIXICam.left;
    GameState.PIXITiledBK.y = GameState.PIXICam.pivot.y - GameState.ViewH / 2;//GameState.PIXICam.top;
    //GameState.PIXITiledBK.width = innerWidth / GameState.PIXICam.scale.x;
    //GameState.PIXITiledBK.height = innerHeight / GameState.PIXICam.scale.y;
    //console.log([GameState.PIXICam.x, GameState.PIXICam.pivot.x, GameState.pivotX, (GameState.PIXICam.pivot.x - GameState.pivotX)])
}

export function onUpdate(pId: number, data: any) {
    GameState.prevData = data; //SAVE
    let obj, id;
    const fspeed = 0.1;

    //MATCH SERVER COLORS
    const COLORS = [
        rgbToHex(255, 255, 255), // original white
        rgbToHex(255, 182, 193), // light pink
        rgbToHex(173, 216, 230), // light blue
        rgbToHex(144, 238, 144), // light green
        rgbToHex(255, 218, 185), // peach
        rgbToHex(221, 160, 221), // plum
        rgbToHex(255, 255, 224), // light yellow
        rgbToHex(176, 196, 222), // light steel blue
        rgbToHex(255, 192, 203), // pink
        rgbToHex(152, 251, 152)  // pale green
    ];
    const COLORS_RGB = [
        [255, 255, 255], // original white
        [255, 182, 193], // light pink
        [173, 216, 230], // light blue
        [144, 238, 144], // light green
        [255, 218, 185], // peach
        [221, 160, 221], // plum
        [255, 255, 224], // light yellow
        [176, 196, 222], // light steel blue
        [255, 192, 203], // pink
        [152, 251, 152]  // pale green
    ];

    for (id in data.dynamics) {
        if (data.dynamics.hasOwnProperty(id)) {
            obj = data.dynamics[id];
            // if (!GameState.gameObjects.dynamics[id]) {
            //     GameState.gameObjects.dynamics[id] = {}; // or create the right object type
            // }
            // console.log('dynamics obj = ', obj);

            if (GameState.gameObjects.dynamics.hasOwnProperty(id) && GameState.gameObjects.dynamics[id]) {
                const foodObj = GameState.gameObjects.dynamics[id];

                foodObj.tx = obj[1];
                foodObj.ty = obj[2];
                foodObj.width = obj[5];
                foodObj.height = obj[6];

                //fade in / out
                if (foodObj.ADIR === 0) {
                    foodObj.alpha -= fspeed;
                    if (foodObj.alpha < 0.2) {
                        foodObj.alpha = 0.2;
                        foodObj.ADIR = 1;
                    }
                } else {
                    foodObj.alpha += fspeed;
                    if (foodObj.alpha > 1) {
                        foodObj.alpha = 1;
                        foodObj.ADIR = 0;
                    }
                }
            } else {
                //console.log('CreateCircle ' + obj[0])
                //console.log(obj)
                //GameState.gameObjects.dynamics[id] = GFX.add.image(obj[1], obj[2], 'd' + obj[0]);//type
                GameState.gameObjects.dynamics[id] = CreateCircle(bodyTexture1, obj[1], obj[2], obj[3], 1);
                //let COLORS =  ["f5e0dc", "f2cdcd", "f5c2e7", "cba6f7", "f38ba8", "eba0ac", "fab387", "f9e2af",
                //"a6e3a1", "94e2d5", "89dceb", "74c7ec", "89b4fa", "b4befe"];
                //COLORS = ['EAB999', '00ff88', 'ff4400', '0088ff', 'aa44ff', 'ffaa00']
                //sprite.alpha = 0.5;

                //{ name: 'Classic', color:  },                { name: 'Neon', color: '#00ff88' },                { name: 'Fire', color: '#ff4400' },
                //{ name: 'Ocean', color: '#0088ff' },                { name: 'Purple', color: '#aa44ff' },                { name: 'Gold', color: '#ffaa00' }

                GameState.gameObjects.dynamics[id].tint = COLORS[randomNumber(COLORS.length - 1)];//rgbToHex(RandInt(256), RandInt(256), RandInt(256));
                GameState.gameObjects.dynamics[id].tx = obj[1];
                GameState.gameObjects.dynamics[id].ty = obj[2];
                GameState.gameObjects.dynamics[id].width = obj[5]
                GameState.gameObjects.dynamics[id].height = obj[6];
                GameState.gameObjects.dynamics[id].TYPE = obj[0];
                GameState.gameObjects.dynamics[id].alpha = 0.5
                GameState.gameObjects.dynamics[id].ADIR = randomNumber(1);

                //Always glow
                //GameState.gameObjects.dynamics[id].filters = [GameState.PIXICam.GLOW_FILTER];//ON GLOW

                //GameState.gameObjects.dynamics[id].filters = [new PIXI.filters.BlurFilter(5)]; // Adjust blur amount
                //GameState.gameObjects.dynamics[id].blendMode = PIXI.BLEND_MODES.ADD;
                //if(obj[0] < 7){ GameState.gameObjects.dynamics[id].depth = 1; }
                //else {GameState.gameObjects.dynamics[id].depth = 2;}
            }
        }
    }

    // const gspeed = 0.1;
    for (id in data.units) {
        if (data.units.hasOwnProperty(id)) {
            obj = data.units[id];
            if (GameState.gameObjects.units.hasOwnProperty(id)) { //update
                const existingObj = GameState.gameObjects.units[id];
                existingObj.tx = obj[1];
                existingObj.ty = obj[2];
                existingObj.width = obj[5];
                existingObj.height = obj[6];
                existingObj.rotation = obj[8];
                //                existingObj.rotation = obj[8] +  0.785398  * 2;

                if (existingObj.EYES !== null) {
                    existingObj.EYES.width = obj[5];
                    existingObj.EYES.height = obj[6];
                    existingObj.EYES.rotation = obj[8];
                }
                if (existingObj.EYES1 !== null) {
                    existingObj.EYES1.width = obj[5];
                    existingObj.EYES1.height = obj[6];
                    existingObj.EYES1.rotation = obj[8];
                }
                if (existingObj.EYES2 !== null) {
                    existingObj.EYES2.width = obj[5];
                    existingObj.EYES2.height = obj[6];
                    existingObj.EYES2.rotation = obj[8];
                }

                existingObj.GLOW.width = obj[5] * 2;
                existingObj.GLOW.height = obj[6] * 2;
                existingObj.GLOW.rotation = obj[8];

                if (obj[15] === 1) {// && existingObj.filters === null){
                    //                    existingObj.filters = [GameState.PIXICam.GLOW_FILTER];//ON GLOW
                    //console.log("ON")
                    //fade in / out GLOW
                    existingObj.GLOW.visible = true;
                    existingObj.GLOW.alpha = 1;
                    existingObj.GLOW.tint = existingObj.tint;
                    if (existingObj.GLOW_DIR === 0) {
                        //existingObj.GLOW.alpha -= gspeed;
                        //if(existingObj.GLOW.alpha < 0.5){existingObj.GLOW.alpha = 0.5; existingObj.GLOW_DIR = 1;}
                    }
                    else {
                        //existingObj.GLOW.alpha += gspeed;
                        //if(existingObj.GLOW.alpha > 1){existingObj.GLOW.alpha = 1; existingObj.GLOW_DIR = 0;}
                    }

                    //existingObj.alpha = (10 - obj[16]) * 0.2;
                    //console.log(existingObj.alpha)
                    const color = COLORS_RGB[obj[13]]
                    let addAmount: number = obj[16];
                    if (obj[16] === 0) {
                        addAmount = 10;
                    }
                    if (obj[16] === 1) {
                        addAmount = 9;
                    }
                    if (obj[16] === 2) {
                        addAmount = 8;
                    }
                    if (obj[16] === 3) {
                        addAmount = 7;
                    }
                    if (obj[16] === 4) {
                        addAmount = 6;
                    }
                    existingObj.tint = adjustBrightnessRGB(color[0], color[1], color[2], addAmount * 5 - 50);
                    //console.log(obj[16])
                    //let aff = existingObj.GLOW.alpha * 255;
                    //existingObj.tint = rgbToHex(aff, aff, aff );

                }
                if (obj[15] === 0) {// && existingObj.filters !== null){
                    //                    existingObj.filters = null;//OFF
                    //console.log("OFF")
                    //existingObj.GLOW.alpha = 0;
                    if (existingObj.tint !== existingObj.COLOR) {
                        existingObj.tint = existingObj.COLOR;
                    }
                    existingObj.GLOW.visible = false;
                    //existingObj.alpha = 1;//reset
                }

                //console.log(obj[8] - 0.785398  * 2);//45 degrees
                //let degrees = obj[8] * (180 / Math.PI)
                if (id === pId.toString()) {
                    //console.log(degrees)
                    // Move the camera to center on a specific point (e.g., player's position)
                    // You'll need to offset by half the screen dimensions to truly center
                    //cameraX = -obj[1] + PIXIApp.screen.width / 2;
                    //cameraY = -obj[2] + PIXIApp.screen.height / 2;
                    //cameraX = obj[1];
                    //cameraY = obj[2];
                    GameState.cameraX = -obj[1] + PIXIApp.screen.width / 2;
                    GameState.cameraY = -obj[2] + PIXIApp.screen.height / 2;
                    GameState.pivotX = obj[1];
                    GameState.pivotY = obj[2];
                    GameState.mySnakeH = obj;
                    GameState.mySnakeId = pId;
                    //console.log([cameraX, cameraY]);
                }
            } else { // create
                //console.log('CreateCircle ' + obj[0])
                //console.log(obj)
                //GameState.gameObjects.units[id] = GFX.add.image(obj[1], obj[2], 'd' + obj[0]);//type
                let tempObject: any;
                if (obj[14] === HEAD_EYES) {//Head/Eyes
                    tempObject = CreateCircle(headTexture, obj[1], obj[2], obj[3], 1);
                    if (id === pId.toString()) {//Extra Glow etc
                        tempObject.EYES = null;
                        tempObject.EYES1 = CreateCircle(eyeTexture, obj[1], obj[2], obj[3] + 1, 1);
                        tempObject.EYES1.width = obj[5]; tempObject.EYES1.height = obj[6];
                        tempObject.EYES2 = CreateCircle(eyeTexture, obj[1], obj[2], obj[3] + 1, 1);
                        tempObject.EYES2.width = obj[5]; tempObject.EYES2.height = obj[6];
                    }
                    else {
                        tempObject.EYES1 = null; tempObject.EYES2 = null;//non player
                        tempObject.EYES = CreateCircle(eyesTexture, obj[1], obj[2], obj[3] + 1, 1);
                        tempObject.EYES.width = obj[5];
                        tempObject.EYES.height = obj[6];
                    }
                }
                else {
                    tempObject = CreateCircle(bodyTexture4, obj[1], obj[2], obj[3], 1);
                    tempObject.EYES = null; tempObject.EYES1 = null; tempObject.EYES2 = null;
                }

                tempObject.GLOW = CreateCircle(glowTexture, obj[1], obj[2], obj[3] - 1, 1);
                tempObject.GLOW.alpha = 0.5;
                tempObject.GLOW_DIR = 0;//RandInt(1);
                tempObject.GLOW.width = obj[5] * 2;
                tempObject.GLOW.height = obj[6] * 2;
                tempObject.GLOW.rotation = obj[8];
                tempObject.GLOW.alpha = 0;

                //let COLORS =  ["f5e0dc", "f2cdcd", "f5c2e7", "cba6f7", "f38ba8", "eba0ac", "fab387", "f9e2af",
                //"a6e3a1", "94e2d5", "89dceb", "74c7ec", "89b4fa", "b4befe"];
                tempObject.tint = COLORS[obj[13]];//index based
                tempObject.COLOR = tempObject.tint;//Save Base color
                //COLORS[RandInt(COLORS.length - 1)];//rgbToHex(RandInt(256), RandInt(256), RandInt(256));

                tempObject.tx = obj[1];
                tempObject.ty = obj[2];
                tempObject.width = obj[5];
                tempObject.height = obj[6];
                tempObject.TYPE = obj[0];
                tempObject.rotation = obj[8];

                GameState.gameObjects.units[id] = tempObject;//save
                //if(obj[0] < 7){ GameState.gameObjects.units[id].depth = 1; }
                //else {GameState.gameObjects.units[id].depth = 2;}
            }
        }
    }

    //Debug
    //PIXIGfx.clear();
    if (GameState.DEBUG) {
        drawDebugRect(data.dynamics)
        drawDebugRect(data.units)

        // const CellSize = 256;//Match server
        //        PIXIGfx.lineStyle(2, 0x00FF00); // 2px red border
        //let vwh = (CellSize * 2) + CellSize;
        //PIXIGfx.drawRect(pivotX - vwh/2,pivotY - vwh/2, vwh, vwh);
        //PIXIGfx.drawRect((PIXIApp.screen.width / 2) - vwh/2,(PIXIApp.screen.height / 2) - vwh/2, vwh, vwh);

    }
    //Bounds Always
    //PIXIGfx.lineStyle(1024, 0x800000); // 2px red border
    //PIXIGfx.drawRect(-512,-512, MapWH+1024, MapWH+1024);
    //PIXIGfx.lineStyle(50, 0xFF0000); // 2px red border
    //PIXIGfx.drawRect(0,0, MapWH, MapWH);
    //PIXIGfx.circle(MapWH/2,MapWH/2,MapWH/2).fill(0xFF0000).lineStyle(50)
}

function onResize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    fitFIX(true, GameState.PIXICam, screenWidth, screenHeight, 1024, 1024)

    if (GameState.PIXICam) {
        //PIXICam.resize(screenWidth, screenHeight); // Update the viewport's size
        //PIXICam.fit(); // Re-apply fitting to the content
    }
    //PIXICam.fit();
    if (GameState.PIXI_Viewport) {
        //PIXIApp.width = screenWidth;
        //PIXIApp.height = screenHeight;

        //PIXI_Viewport.resize(screenWidth, screenHeight); // Update the viewport's size
        //PIXI_Viewport.fit(); // Re-apply fitting to the content

        //PIXI_Viewport.x = window.innerWidth /2
        //PIXI_Viewport.y = window.innerHeight /2

        //PIXI_Viewport.x = PIXIApp.width / 2;
        //PIXI_Viewport.y = PIXIApp.height / 2;
        //PIXI_Viewport.pivot.x = 0;
        //PIXI_Viewport.pivot.y = 0;
    }
}

function fitFIX(center: boolean, stage: any, screenWidth: number, screenHeight: number, virtualWidth: number, virtualHeight: number) {
    stage.scale.x = screenWidth / virtualWidth
    stage.scale.y = screenHeight / virtualHeight

    if (stage.scale.x < stage.scale.y) {
        stage.scale.y = stage.scale.x
    } else {
        stage.scale.x = stage.scale.y
    }

    const virtualWidthInScreenPixels = virtualWidth * stage.scale.x
    const virtualHeightInScreenPixels = virtualHeight * stage.scale.y
    const centerXInScreenPixels = screenWidth * 0.5;
    const centerYInScreenPixels = screenHeight * 0.5;

    if (center) {
        stage.position.x = centerXInScreenPixels;
        stage.position.y = centerYInScreenPixels;
    } else {
        stage.position.x = centerXInScreenPixels - virtualWidthInScreenPixels * 0.5;
        stage.position.y = centerYInScreenPixels - virtualHeightInScreenPixels * 0.5;
    }
}

async function setupGraphic() {
    // 1. Create a PixiJS Application
    //PIXIApp = new PIXI.Application();
    //await PIXIApp.init({ background: "#1099bb", resizeTo: window });

    // Append the application canvas to the document body
    //document.getElementById("pixi-container")!.appendChild(app.canvas);

    window.addEventListener('resize', onResize);
    //    window.addEventListener('resize', onResize);

    await PIXIApp.init({
        preference: 'webgl', // 'webgl' or 'webgpu'
        width: GameState.ViewW,//window.innerWidth,
        height: GameState.ViewH,//window.innerHeight,
        backgroundColor: 0x000000,
        antialias: true, // Smooth pixelated edges
        resizeTo: window, // Auto-resize target
    });

    console.log(PIXIApp.renderer)
    //document.body.appendChild(PIXIApp.canvas);
    document.getElementById("pixi-container")?.appendChild(PIXIApp.canvas);


    // create viewport


    // activate plugins
    //PIXI_Viewport.drag().pinch().wheel().decelerate();

    // add a red box
    //const sprite = PIXI_Viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    //sprite.tint = 0xff0000;
    //sprite.width = sprite.height = 100;
    //sprite.position.set(100, 100);

    // create viewport
    //const viewport = new pixi_viewport.Viewport({
    //screenWidth: window.innerWidth,
    //screenHeight: window.innerHeight,
    //worldWidth: 1000,
    //worldHeight: 1000,
    //events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    //});

    // add the viewport to the stage
    //app.stage.addChild(viewport);

    //viewport.drag().pinch().wheel().decelerate();

    //const sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    //sprite.tint = 0xff0000;
    //sprite.width = sprite.height = 100;
    //sprite.position.set(100, 100);
    /*
        await PIXIApp.init(
            {
                width: ViewW ,//window.innerWidth,
                height: ViewH,//window.innerHeight,
                backgroundColor: 0x000000,
                antialias: true, // Smooth pixelated edges
                preference: 'webgl', // 'webgl' or 'webgpu'
                resizeTo: window, // Auto-resize target
                //autoDensity: true,
                //resolution: window.devicePixelRatio
            }
        )*/

    //texture_h = PIXI.Texture.from('img/ch.png');//Head
    //texture0 = PIXI.Texture.from('img/c0.png');//Eyes
    //tex_eye = PIXI.Texture.from('img/c0b.png');//eyes for player
    //texture1 = PIXI.Texture.from('img/c1.png');
    //texture2 = PIXI.Texture.from('img/c2.png');
    //texture3 = PIXI.Texture.from('img/c3.png');
    //texture4 = PIXI.Texture.from('img/c4.png');
    //texture_bk = PIXI.Texture.from('img/bk.png');
    //tex_glow = PIXI.Texture.from('img/c4g.png');

    //document.body.appendChild(PIXIApp.view);
    //document.getElementById("pixi-container").appendChild(PIXIApp.canvas);

    GameState.PIXICam = new Container();
    /*
    PIXICam = new PIXI_VP.Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1024,//default view size
        worldHeight: 1024,
        events: PIXIApp.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    });*/

    // add the viewport to the stage
    //PIXIApp.stage.addChild(PIXI_Viewport);

    PIXIApp.stage.addChild(GameState.PIXICam);
    //PIXI_Viewport.addChild(PIXICam);
    //PIXICam.scale.set(2);//Default
    GameState.PIXICam.sortableChildren = true;

    //Viewport - Autoscale
    //PIXI_Viewport = new PIXI_VP.Viewport(
    //{
    //screenWidth: window.innerWidth,
    //screenHeight: window.innerHeight,
    //worldWidth: 10000,//ViewW,
    //worldHeight: 10000,//ViewH,
    //events: PIXIApp.renderer.events,
    // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
    //}
    //);

    // add the viewport to the stage
    //    PIXIApp.stage.addChild(PIXI_Viewport);

    // activate plugins
    //    PIXI_Viewport.drag().pinch().wheel().decelerate();

    // add a red box
    //const sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
    //sprite.tint = 0xff0000;
    //sprite.width = sprite.height = 100;
    //sprite.position.set(100, 100);


    //Filter Game
    //    PIXICam.GLOW_FILTER = new PIXI.filters.AdjustmentFilter({
    //        brightness: 1.2, // Increase brightness by 20%
    //contrast: 0.8,   // Decrease contrast by 20%
    //        saturation: 1.2  // Increase saturation by 50%
    //    });

    /*
        PIXICam.GLOW_FILTER = new PIXI.filters.GlowFilter({
            distance: 35,       // The distance of the glow
            outerStrength: 1,   // The strength of the outer glow
            innerStrength: 0,   // The strength of the inner glow (optional)
            color: 0xFFFFFF,    // The color of the glow (e.g., gold)
            quality: 0.1        // The quality of the glow (higher is better but more expensive)
        });*/
    //PIXICam.filters = [PIXICam.GLOW_FILTER];


    // Create the background sprite with a basic white texture
    const bg = new Sprite(Texture.WHITE);
    // Set it to fill the screen
    bg.width = GameState.mapWH;//PIXIApp.screen.width;
    bg.height = GameState.mapWH;//PIXIApp.screen.height;
    // Tint it to whatever color you want, here red
    bg.tint = 0x111111;
    // Add a click handler
    bg.interactive = true;
    bg.on('pointerdown', function (event) {
        const mx = Math.floor(event.data.global.x)
        const my = Math.floor(event.data.global.y)
        GameState.mDown = 1;
        if (mx > 0 && my > 0 && mx < PIXIApp.screen.width && my < PIXIApp.screen.height) {
            const ox = PIXIApp.screen.width / 2 - mx;
            const oy = PIXIApp.screen.height / 2 - my;
            GameState.INPUT = [ox, oy, GameState.mDown];
        }
    });
    bg.on('pointermove', function (event) {
        const mx = Math.floor(event.data.global.x)
        const my = Math.floor(event.data.global.y)
        if (mx > 0 && my > 0 && mx < PIXIApp.screen.width && my < PIXIApp.screen.height) {
            //console.log(`Mouse X: ${mx}, Mouse Y: ${my}`);
            let dc: any = Object.keys(GameState.gameObjects.dynamics).length;
            let uc: any = Object.keys(GameState.gameObjects.units).length;
            if (GameState.prevData) {
                dc = dc + "/" + Object.keys(GameState.prevData.dynamics).length;
                uc = uc + "/" + Object.keys(GameState.prevData.units).length;
            }
            const ox = PIXIApp.screen.width / 2 - mx;
            const oy = PIXIApp.screen.height / 2 - my;
            let str = "[ " + mx + ", " + my + " ] dcount: " + dc + " ucount: " + uc
            str = str + " offset: " + ox + "," + oy;
            str = str + " Zoom: " + (GameState.PIXICam.scale.x).toFixed(2);
            str = str + " Ping: " + GameState.PING;
            //$("#info").html(str);
            GameState.gData["info_text"].text = str;
            //GameState.gData["info_text"].text = mx + " " + my;
            //GameState.INPUT = [mx, my];
            GameState.INPUT = [ox, oy, GameState.mDown];
        }
        //console.log(mx + " " + my)

    });
    bg.on('pointerup', function (event) {
        const mx = Math.floor(event.data.global.x)
        const my = Math.floor(event.data.global.y)
        console.log(`Mouse X: ${mx}, Mouse Y: ${my}`);
        GameState.mDown = 0;
        if (mx > 0 && my > 0 && mx < PIXIApp.screen.width && my < PIXIApp.screen.height) {
            const ox = PIXIApp.screen.width / 2 - mx;
            const oy = PIXIApp.screen.height / 2 - my;
            GameState.INPUT = [ox, oy, GameState.mDown];
        }
    });
    bg.on('pointerout', function (event) {
        const mx = Math.floor(event.data.global.x)
        const my = Math.floor(event.data.global.y)
        console.log(`OUT Mouse X: ${mx}, Mouse Y: ${my}`);
        GameState.mDown = 0;
        if (mx > 0 && my > 0 && mx < PIXIApp.screen.width && my < PIXIApp.screen.height) {
            const ox = PIXIApp.screen.width / 2 - mx;
            const oy = PIXIApp.screen.height / 2 - my;
            GameState.INPUT = [ox, oy, GameState.mDown];
        }
    });
    // Add it to the stage as the first object
    //PIXIApp.stage.addChild(bg);
    GameState.PIXICam.addChild(bg);
    //PIXI_Viewport.addChild(bg)


    //Zoom test
    bg.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent page scrolling
        const zoomFactor = 1.5; // Adjust for desired zoom speed

        if (event.deltaY < 0) { // Scrolling up (zoom in)
            // Example: Zoom in on a specific container
            //GameState.PIXICam.scale.set(0.7);
            if (GameState.PIXICam.scale.x < 5) {
                GameState.PIXICam.scale.x *= zoomFactor;
                GameState.PIXICam.scale.y *= zoomFactor;

            }
        } else { // Scrolling down (zoom out)
            if (GameState.PIXICam.scale.x > 0.1) {
                GameState.PIXICam.scale.x /= zoomFactor;
                GameState.PIXICam.scale.y /= zoomFactor;

            }
        }
    });

    //const tilingSprite = new PIXI.TilingSprite(texture_bk, MapWH, MapWH);
    GameState.PIXITiledBK = new TilingSprite(bkTexture, GameState.ViewW, GameState.ViewH);
    GameState.PIXITiledBK.position.set(0, 0);
    GameState.PIXICam.addChild(GameState.PIXITiledBK);

    GameState.PIXIGfx = new Graphics();
    GameState.PIXIGfx.lineStyle(50, 0xFF0000).circle(GameState.mapWH / 2, GameState.mapWH / 2, GameState.mapWH / 2).stroke(0xFF0000)
    //Draws it here
    GameState.PIXICam.addChild(GameState.PIXIGfx);

    const textStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14, fill: 0xffffff,
        align: 'center',
        dropShadow: {
            color: '#000000',
            angle: Math.PI / 6,
            blur: 5,
            distance: 6,
        },
    });
    GameState.gData["info_text"] = new Text('Hello, PixiJS!', textStyle);
    GameState.gData["info_text"].x = 512; GameState.gData["info_text"].y = 20;
    GameState.gData["info_text"].anchor.set(0.5); // Center the anchor point
    PIXIApp.stage.addChild(GameState.gData["info_text"]);
    //GameState.PIXICam.addChild(GameState.gData["info_text"]);

    setInterval(() => {
        if (GameState.INPUT && GameState.socket) {
            GameState.socket.send(JSON.stringify({ type: "input", d: GameState.INPUT }));

            //FixedUpdate()
            //GameState.INPUT = null;//reset
        }
    }, 100);

    PIXIApp.ticker.add(() => {
        process();
    });

    // Assuming 'app.stage' is your main container
    // const zoomFactor = 2;
    //PIXIApp.stage.scale.x *= zoomFactor;
    //PIXIApp.stage.scale.y *= zoomFactor;

    /*
        const viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: 1000, // Example world size
            worldHeight: 1000,
            // Add other options as needed
        });
    
        PIXIApp.stage.addChild(viewport);
    
    // Enable mouse wheel zooming
        viewport.wheel();
    
    // You can also programmatically zoom
        viewport.zoom(zoomFactor);*/
}

export async function gameStart() {
    await setupGraphic();
    await initAssets();
    setupWebsocket(onUpdate);
}
