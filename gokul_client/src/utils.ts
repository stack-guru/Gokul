export function rgbToHex(red: number, green: number, blue: number) {
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function randomNumber(n: number) {
    return Math.floor(Math.random() * n);
}

export function calculateLerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

export function adjustBrightnessRGB(red: number, green: number, blue: number, amount: number) {
    // Increase or decrease each component by 'amount'
    let newR = red + amount;
    let newG = green + amount;
    let newB = blue + amount;

    // Clamp values to 0-255 range
    newR = Math.min(255, Math.max(0, newR));
    newG = Math.min(255, Math.max(0, newG));
    newB = Math.min(255, Math.max(0, newB));

    return rgbToHex(newR, newG, newB);//{ r: newR, g: newG, b: newB };
}

export function drawDebugRect(objs: any[]) {
    for (const id in objs) {
        if (objs.hasOwnProperty(id)) {
            // const obj = objs[id];
            //OBJS.units[id].tx = obj[1];
            //OBJS.units[id].ty = obj[2];
            //OBJS.units[id].width = obj[4];
            //OBJS.units[id].height = obj[5];

            //PIXIGfx.lineStyle(1, 0xFF0000); // 2px red border
            //PIXIGfx.setStrokeStyle(1, 0xFF0000); // 2px red border
            // const x: number = obj[1] - (obj[5] / 2);//centered box
            // const y: number = obj[2] - (obj[6] / 2);
            //PIXIGfx.drawRect(x,y, obj[5], obj[6]);
            //            PIXIGfx.Circle(obj[1], obj[2], obj[7]).stroke(0xFF0000).setStrokeStyle(1)
            //radius
        }
    }
}

