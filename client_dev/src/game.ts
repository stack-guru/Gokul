import { Texture, Sprite, Container, TilingSprite, Graphics, TextStyle, Text, NineSliceSprite } from "pixi.js";
import { initAssets, leftEyeTexture, rightEyeTexture } from "./asset";
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

function RandInt(n: number) { return Math.floor(Math.random() * n); }

function brightenColor(baseColor: number[], highlight: number): number[] {
    const factor = 1 + (highlight * 0.08);
    return [
        Math.floor(Math.min(255, Math.max(0, baseColor[0] * factor))),
        Math.floor(Math.min(255, Math.max(0, baseColor[1] * factor))),
        Math.floor(Math.min(255, Math.max(0, baseColor[2] * factor)))
    ];
}

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

function CreateSegment(texture: Texture, x: number, y: number, z: number, w: number, h: number, scale=1, rot=0) {
    GameState.gId++;

    // Use NineSliceSprite for scalable circular segments without pixelation
    // Define slice center - for circular textures, use center point
    const textureSize = texture.width || 512; // fallback if width not available
    const sliceSize = texture.width / 2; // quarter of texture for slice

    const sprite = new NineSliceSprite(
        {
            texture,
            leftWidth: sliceSize,
            topHeight: sliceSize,
            rightWidth: sliceSize,
            bottomHeight: sliceSize,
            width: textureSize * scale * 2,
            height: textureSize * scale
        }
    );

    const radius = h / 2;
    const farPivot = w - radius
    sprite.anchor.set(farPivot / w, 0.5); // Set anchor point to the center for rotation/scaling around the center
    sprite.position.set(x, y); // Set x and y coordinates

    // Instead of scaling the sprite, set the actual width/height
    // This will use 9-slice scaling internally
    const baseSize = textureSize;
    sprite.width = baseSize * scale;
    sprite.height = baseSize * scale;

    sprite.rotation = rot; // Rotate as needed
    sprite.zIndex = z; // Set z-index for layering
    GameState.PIXICam.addChild(sprite);

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
        if (obj.hasOwnProperty("shadow")) {//dynamics (food) have shadow glow
            obj.shadow.destroy();
        }

        if (obj && typeof (obj as any).destroy === "function") {
            obj.destroy();
        }
        delete Group[kk];//remove
    }
}

export function process() {
  // 1) Move dynamics toward tx/ty
  let id: string, obj: any;

  for (id in GameState.gameObjects.dynamics) {
    if (!GameState.gameObjects.dynamics.hasOwnProperty(id)) continue;
    const dyn = GameState.gameObjects.dynamics[id];

    dyn.x = calculateLerp(dyn.x, dyn.tx, GameState.LERPP);
    dyn.y = calculateLerp(dyn.y, dyn.ty, GameState.LERPP);

    // NEW: keep shadow on the dynamic item (your original behavior)
    if (dyn.shadow) {
      dyn.shadow.x = dyn.x;
      dyn.shadow.y = dyn.y;
    }
  }

  // 2) Move units toward tx/ty + keep eyes & glow synced
  for (id in GameState.gameObjects.units) {
    if (!GameState.gameObjects.units.hasOwnProperty(id)) continue;
    obj = GameState.gameObjects.units[id];

    // position lerp
    obj.x = calculateLerp(obj.x, obj.tx, GameState.LERPP);
    obj.y = calculateLerp(obj.y, obj.ty, GameState.LERPP);

    if (obj.targetWidth !== undefined) {
      obj.width = calculateLerp(obj.width, obj.targetWidth, GameState.LERPP * 0.5);
    }
    if (obj.targetHeight !== undefined) {
      obj.height = calculateLerp(obj.height, obj.targetHeight, GameState.LERPP * 0.5);
    }

    if (obj.EYES !== null) {
      obj.EYES.x = obj.x;
      obj.EYES.y = obj.y;
    }

    obj.onViewUpdate?.();

    const radius = obj.height / 2;
    if (obj.EYES1 !== null) {
      const rxy = rotate_by_pivot(obj.x, obj.y, obj.rotation, radius * 0.45, -radius * 0.4596);
      obj.EYES1.x = rxy[0];
      obj.EYES1.y = rxy[1];
      if (GameState.INPUT) {
        obj.EYES1.rotation = Math.atan2(-GameState.INPUT[1], -GameState.INPUT[0]);
      }
      obj.EYES1.onViewUpdate?.();
    }

    if (obj.EYES2 !== null) {
      const lxy = rotate_by_pivot(obj.x, obj.y, obj.rotation, radius * 0.45, radius * 0.4596);
      obj.EYES2.x = lxy[0];
      obj.EYES2.y = lxy[1];
      if (GameState.INPUT) {
        obj.EYES2.rotation = Math.atan2(-GameState.INPUT[1], -GameState.INPUT[0]);
      }
      obj.EYES2.onViewUpdate?.();
    }

    // existing: keep glow at segment; NEW: animate alpha toward target
    if (obj.GLOW) {
      obj.GLOW.x = obj.x;
      obj.GLOW.y = obj.y;

      if (obj.GLOW_ANIMATING) {
        const glowSpeed = 0.1;
        const currentAlpha = obj.GLOW.alpha ?? 0;
        const targetAlpha = obj.GLOW_TARGET_ALPHA ?? 0;

        if (Math.abs(currentAlpha - targetAlpha) < 0.01) {
          obj.GLOW.alpha = targetAlpha;
          obj.GLOW_ANIMATING = false;
          if (targetAlpha === 0) obj.GLOW.visible = false;
        } else {
          obj.GLOW.visible = true;
          obj.GLOW.alpha = calculateLerp(currentAlpha, targetAlpha, glowSpeed);
        }
      }

      // Wave animation for boost effect
      if (obj.BOOST_ACTIVE && obj.BASE_COLOR && obj.SEGMENT_INDEX !== undefined) {
        const time = Date.now() / 1000; // Current time in seconds
        const waveSpeed = 15; // Speed of the wave animation
        const phaseOffset = 0.8; // Phase offset per segment

        // Calculate sine wave for this segment
        const highlight = Math.sin(waveSpeed * time - phaseOffset * obj.SEGMENT_INDEX);

        // Brighten the base color based on the wave
        const brightenedColor = brightenColor(obj.BASE_COLOR, highlight);

        // Validate color values before applying
        if (brightenedColor.every(c => c >= 0 && c <= 255 && Number.isInteger(c))) {
          // Apply the animated color to both segment and glow
          const animatedColor = rgbToHex(brightenedColor[0], brightenedColor[1], brightenedColor[2]);
          obj.tint = animatedColor;

          // Make glow slightly brighter and more saturated
          const glowBrightened = brightenColor(brightenedColor, 0.12); // Moderately subtle glow enhancement
          if (glowBrightened.every(c => c >= 0 && c <= 255 && Number.isInteger(c))) {
            const glowColor = rgbToHex(glowBrightened[0], glowBrightened[1], glowBrightened[2]);
            obj.GLOW.tint = glowColor;
          }
        }

        // Animate glow alpha with the wave as well
        const waveAlpha = 0.32 + (highlight + 1) * 0.08; // Range from 0.24 to 0.4 (moderately subtle)
        obj.GLOW.alpha = calculateLerp(obj.GLOW.alpha, waveAlpha, 0.15);
      }
    }
  }

  // 3) Cleanup removed IDs (unchanged)
  if (GameState.prevData) {
    CleanGroupObj(GameState.gameObjects.dynamics, GameState.prevData.dynamics);
    CleanGroupObj(GameState.gameObjects.units, GameState.prevData.units);
  }

  // 4) Camera (unchanged)
  GameState.PIXICam.pivot.x = calculateLerp(GameState.PIXICam.pivot.x, GameState.pivotX, 0.1);
  GameState.PIXICam.pivot.y = calculateLerp(GameState.PIXICam.pivot.y, GameState.pivotY, 0.1);
  GameState.PIXICam.x = PIXIApp.screen.width / 2;
  GameState.PIXICam.y = PIXIApp.screen.height / 2;

  // 5) Background tiling (unchanged)
  const btk = 1024;
  const vx = GameState.PIXICam.pivot.x - GameState.ViewW / 2;
  const vy = GameState.PIXICam.pivot.y - GameState.ViewH / 2;
  const ox = Math.floor(vx / btk);
  const oy = Math.floor(vy / btk);

  GameState.PIXITiledBK.tilePosition.x = (ox * btk) - vx;
  GameState.PIXITiledBK.tilePosition.y = (oy * btk) - vy;
  GameState.PIXITiledBK.x = GameState.PIXICam.pivot.x - GameState.ViewW / 2;
  GameState.PIXITiledBK.y = GameState.PIXICam.pivot.y - GameState.ViewH / 2;
}


type UnitTuple = number[];

interface DecodedUnit {
  type: number;
  x: number;
  y: number;
  z: number;
  r: number;
  width: number;
  height: number;
  angle: number;
  radius: number;
  hp: number;
  maxHP: number;
  targetX: number;
  targetY: number;
  colorIndex: number;
  isLead: number;
  boost: number;
  brightness: number;     // 0..n
  prevUnitId: number;     // -1 if none
}

function decodeNetworkUnit(unit: UnitTuple): DecodedUnit {
  const [type, x, y, z, r, width, height, radius, angle, hp, maxHP, targetX, targetY, colorIndex, isLead, boost, brightness, prevUnitId] = unit;

  return {
    type,
    x,
    y,
    z,
    r,
    width,
    height,
    radius,
    angle,
    hp,
    maxHP,
    targetX,
    targetY,
    colorIndex,
    isLead,
    boost,
    brightness,
    prevUnitId
  }
}

// ---- Main update -------------------------------------------------------------

function onUpdate(pid: number, data: any){
    GameState.prevData = data;
    let networkObject, id;
    let fadeSpeed = 0.1;

    //MATCH SERVER COLORS
    let COLORS =  [
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
    let COLORS_RGB =  [
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
            networkObject = data.dynamics[id];
            const [type, x, y, z, r, width, height, radius, angle, color] = networkObject;

            if (GameState.gameObjects.dynamics.hasOwnProperty(id)) {
                let foodObject = GameState.gameObjects.dynamics[id];
                foodObject.tx = x;
                foodObject.ty = y;
                foodObject.width = width * 0.25;
                foodObject.height = height * 0.25;

                foodObject.shadow.tx = x;
                foodObject.shadow.ty = y;

                // Animate shadow to random target size
                if(!foodObject.shadow.targetSize){
                    // Pick a random target size between 1x and 4.5x
                    foodObject.shadow.targetSize = width * (0.8 + Math.random() * 1.5);
                }

                let currentSize = foodObject.shadow.width;
                let targetSize = foodObject.shadow.targetSize;

                if(Math.abs(currentSize - targetSize) < 1){
                    // Reached target, pick a new random target
                    foodObject.shadow.targetSize = width * (0.8 + Math.random() * 1.5);
                } else {
                    // Animate towards target
                    if(currentSize < targetSize){
                        foodObject.shadow.width += 1;
                        foodObject.shadow.height += 1;
                    } else {
                        foodObject.shadow.width -= 1;
                        foodObject.shadow.height -= 1;
                    }
                }

                // Use noise-based transparency like candy-item.ts
                if(!foodObject.animationTime) foodObject.animationTime = 0;
                if(!foodObject.seed) foodObject.seed = Math.random() * 1000;

                foodObject.animationTime += 0.1; // Faster animation for more noticeable flicker

                // Create more pronounced flicker using multiple sine waves for complexity
                let noise1 = Math.sin(foodObject.seed + 4 * foodObject.animationTime);
                let noise2 = Math.sin(foodObject.seed * 0.7 + 2.5 * foodObject.animationTime);
                let combinedNoise = (noise1 + noise2 * 0.5) / 1.5; // Combine for more variation

                // Map noise to alpha range 0.3,0.9 for more dramatic flicker
                let flicker = 0.3 + (combinedNoise + 1) * 0.5 * (0.9 - 0.3);
                foodObject.alpha = flicker;
            }
            else {
                GameState.gameObjects.dynamics[id] = CreateCircle(bodyTexture4, x, y, z + 1, 1);

                GameState.gameObjects.dynamics[id].shadow = CreateCircle(glowTexture, x, y, z, 1);
                GameState.gameObjects.dynamics[id].shadow.width = width;
                GameState.gameObjects.dynamics[id].shadow.height = height;
                GameState.gameObjects.dynamics[id].shadow.SHADOW_DIR = RandInt(1); // Random starting direction for size animation
                GameState.gameObjects.dynamics[id].shadow.alpha = 0.15;

                // Use color from server if it's a valid color index, otherwise random
                let foodColor;
                if(color >= 0 && color < COLORS.length){
                    foodColor = COLORS[color];
                } else {
                    foodColor = COLORS[RandInt(COLORS.length - 1)];
                }
                GameState.gameObjects.dynamics[id].tint = foodColor;
                GameState.gameObjects.dynamics[id].shadow.tint = foodColor;
                GameState.gameObjects.dynamics[id].tx = x;
                GameState.gameObjects.dynamics[id].ty = y;
                GameState.gameObjects.dynamics[id].width = width * 0.25;
                GameState.gameObjects.dynamics[id].height = height * 0.25;
                GameState.gameObjects.dynamics[id].TYPE = type;
                GameState.gameObjects.dynamics[id].alpha = 0.5;
                GameState.gameObjects.dynamics[id].ADIR = RandInt(1);
            }
        }
    }
    let glowSpeed = 0.1;
    for (id in data.units) {
        if(!data.units.hasOwnProperty(id)) continue; 
        
      networkObject = data.units[id];
      const {type, x, y, z, width, height, angle, radius, colorIndex, isLead, boost, brightness, prevUnitId} = decodeNetworkUnit(networkObject);

      if (GameState.gameObjects.units.hasOwnProperty(id)) {
          let snakeObject = GameState.gameObjects.units[id];
          snakeObject.tx = x;
          snakeObject.ty = y;
          snakeObject.rotation = angle;

          if(isLead) {
              snakeObject.targetWidth = width * 1.1;
              snakeObject.targetHeight = height;

              snakeObject.GLOW.tx = x;
              snakeObject.GLOW.ty = y;
          } else {
              // For non-lead segments, set the width to the distance between the previous segment and this one
              let prevSegment = null;
              if (data.units.hasOwnProperty(prevUnitId)) {
                  prevSegment = decodeNetworkUnit(data.units[prevUnitId]);
              }
              
              if (prevSegment) {
                  let dist = Math.hypot(prevSegment.x - x, prevSegment.y - y);
                  snakeObject.tx = prevSegment.x;
                  snakeObject.ty = prevSegment.y;
                  
                  // Set width to distance, height to standard height
                  // This creates a stretched effect between segments
                  snakeObject.targetWidth = undefined;
                  snakeObject.targetHeight = undefined;
                  if(prevSegment.isLead) {
                      snakeObject.width = width;
                      snakeObject.height = height;
                  } else {
                      snakeObject.width = width + dist - (radius / 4);
                      snakeObject.GLOW.width = (width + Math.max(dist, width)) * 2;
                      snakeObject.height = height;

                      // Update anchor based on current width to avoid jarring changes
                      if (snakeObject.width > radius) {
                          const farPivot = snakeObject.width - radius;
                          snakeObject.anchor.set(farPivot / snakeObject.width, 0.5);
                      }
                  }
              } else {
                  console.log('not found')
                  // If no previous segment found, fallback to default width
                  snakeObject.targetWidth = width;
                  snakeObject.targetHeight = height;
              }
          }

          if(snakeObject.EYES !== null){
              snakeObject.EYES.width = width * 1.275;
              snakeObject.EYES.height = height * 1.275;
              snakeObject.EYES.rotation = angle;
          }
          if(snakeObject.EYES1 !== null){
              snakeObject.EYES1.width = radius * 0.9285;
              snakeObject.EYES1.height = radius * 0.9285;
              console.log(snakeObject.EYES1.width, snakeObject.EYES1.height);
              snakeObject.EYES1.rotation = angle;
          }
          if(snakeObject.EYES2 !== null){
              snakeObject.EYES2.width = radius * 0.9285;
              snakeObject.EYES2.height = radius * 0.9285;
              snakeObject.EYES2.rotation = angle;
          }


          if(boost === 1){
              snakeObject.GLOW.visible = !isLead;

              // Calculate segment index for wave animation
              let segmentIndex = 0;
              if(!isLead) {
                  // Count segments from head to this segment
                  let currentId = id;
                  let currentUnit = decodeNetworkUnit(data.units[currentId]);
                  let chainLength = 0;

                  while(currentUnit && currentUnit.prevUnitId !== -1 && chainLength < 100) {
                      segmentIndex++;
                      currentId = currentUnit.prevUnitId.toString();
                      if(data.units[currentId]) {
                          currentUnit = decodeNetworkUnit(data.units[currentId]);
                          if(currentUnit.isLead === 1) {
                              break;
                          }
                      } else {
                          break;
                      }
                      chainLength++;
                  }
              }

              // Store segment index for wave animation
              snakeObject.SEGMENT_INDEX = segmentIndex;
              snakeObject.BOOST_ACTIVE = true;

              // Base glow intensity with head-to-tail gradient
              let baseIntensity;
              if (isLead) {
                  baseIntensity = 0; // Disable glow for head
              } else {
                  // Gradient from 0.2 (near head) to 0.8 (at tail)
                  // Higher segmentIndex = further from head = more intense
                  const intensityGradient = 0.2 + (segmentIndex * 0.04);
                  baseIntensity = Math.min(0.8, intensityGradient); // Cap at 0.8
              }
              snakeObject.GLOW_TARGET_ALPHA = baseIntensity;
              snakeObject.GLOW_ANIMATING = true;

              snakeObject.GLOW.height = height * 3;
              snakeObject.GLOW.rotation = angle;

              // Store base colors for wave animation
              let baseColor = COLORS_RGB[colorIndex];
              snakeObject.BASE_COLOR = baseColor;
              snakeObject.COLOR = COLORS[colorIndex];
          }
          if(boost === 0){
              snakeObject.BOOST_ACTIVE = false;
              snakeObject.GLOW_TARGET_ALPHA = 0;
              snakeObject.GLOW_ANIMATING = true;
              if(snakeObject.tint !== snakeObject.COLOR){snakeObject.tint = snakeObject.COLOR;}
          }

          if(id === pid.toString()){
              GameState.cameraX = -x + PIXIApp.screen.width / 2;
              GameState.cameraY = -y + PIXIApp.screen.height / 2;
              GameState.pivotX = x;
              GameState.pivotY = y;
              GameState.mySnakeH = networkObject;
              GameState.mySnakeId = pid;
          }


      }
      else {
          let unitObject: any;
          if(isLead === 1){
              unitObject = CreateSegment(bodyTexture4, x, y, z, width, height, 1);
              if(id === pid.toString()){
                  unitObject.EYES = null;
                  unitObject.EYES1 = CreateCircle(leftEyeTexture, x, y, z + 1, 1);
                  unitObject.EYES2 = CreateCircle(rightEyeTexture, x, y, z + 1, 1);
              }
              else {
                  unitObject.EYES1 = null;
                  unitObject.EYES2 = null;
                  unitObject.EYES = CreateCircle(eyesTexture, x * 2, y * 2, z + 1, 1);
                  unitObject.EYES.width = width;
                  unitObject.EYES.height = height;
              }
          }
          else {
              unitObject = CreateSegment(bodyTexture4, x, y, z, width, height, 1);
              unitObject.EYES = null;
              unitObject.EYES1 = null;
              unitObject.EYES2 = null;
          }

          const prevSegment = data.units[prevUnitId];

          // Create glow sprite using PNG texture
          unitObject.GLOW = CreateSegment(glowTexture, prevSegment ? prevSegment.x : x, prevSegment ? prevSegment.y : y, z - 1, width * 2, height * 2, 1);
          unitObject.GLOW.alpha = 0;
          unitObject.GLOW_DIR = 0;
          unitObject.GLOW.width = width * 2;
          unitObject.GLOW.height = height * 2;
          unitObject.GLOW.rotation = angle;
          unitObject.GLOW_TARGET_ALPHA = 0;
          unitObject.GLOW_ANIMATING = false;

          unitObject.tint = COLORS[colorIndex];
          unitObject.COLOR = unitObject.tint;
          unitObject.tx = x;
          unitObject.ty = y;
          unitObject.width = width;
          unitObject.height = height;
          unitObject.targetWidth = width;
          unitObject.targetHeight = height;
          unitObject.TYPE = type;
          unitObject.rotation = angle;


          GameState.gameObjects.units[id] = unitObject;
      }  
    }

    if(GameState.DEBUG){
        drawDebugRect(data.dynamics);
        drawDebugRect(data.units);
    }


}


function onResize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    fitFIX(true, GameState.PIXICam, screenWidth, screenHeight, 512, 512)

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

// function DoubleTap() {
//     let lastTapTime = 0;
//     const doubleTapThreshold = 300; // milliseconds

//     myInteractiveObject.on('pointertap', (event) => {
//         const currentTime = performance.now();
//         if (currentTime - lastTapTime < doubleTapThreshold) {
//             // This is a double tap
//             console.log("Double tap detected!");
//             // Perform double tap action
//             lastTapTime = 0; // Reset for next double tap
//         } else {
//             // This is a single tap
//             console.log("Single tap detected!");
//             // Perform single tap action
//             lastTapTime = currentTime;
//         }
//     });
// }

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

    //Trigger
    onResize();
}

export async function gameStart() {
    await setupGraphic();
    await initAssets();
    setupWebsocket(onUpdate);
}
