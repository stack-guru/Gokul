import { Assets, Texture } from "pixi.js";

export let headTexture: Texture;
export let eyesTexture: Texture;
export let eyeTexture: Texture;
export let bodyTexture1: Texture;
export let bodyTexture2: Texture;
export let bodyTexture3: Texture;
export let bodyTexture4: Texture;
export let bkTexture: Texture;
export let glowTexture: Texture;
export let bgTexture: Texture;
export let mainBodyTexture: Texture;
export let mainTexture: Texture;

export async function initAssets() {
    headTexture = await Assets.load('assets/img/ch.png');//Head
    eyesTexture = await Assets.load('assets/img/c0.png');//Eyes
    eyeTexture = await Assets.load('assets/img/c0b.png');//eyes for player
    mainTexture = await Assets.load('assets/img/snake_main.png');
    bodyTexture1 = await Assets.load('assets/img/c1.png');
    bodyTexture2 = await Assets.load('assets/img/c2.png');
    bodyTexture3 = await Assets.load('assets/img/c3.png');
    bodyTexture4 = await Assets.load('assets/img/c4.png');
    mainBodyTexture = await Assets.load('assets/img/snake_main_modified_small.png');
    bkTexture = await Assets.load('assets/img/bk.png');
    glowTexture = await Assets.load('assets/img/c4g.png');
    bgTexture = await Assets.load('assets/img/bg.jpg');
}