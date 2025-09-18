"use strict";
// Types are imported at world level. Keeping local any types to reduce coupling.
Object.defineProperty(exports, "__esModule", { value: true });
//***********************************************************************************************************************
//***********************************************************************************************************************
class IOSnakeManager {
    constructor(world) {
        this.world = world;
        //various quantities that can be changed
        this.scale = 0.6;
        this.slowSpeed = 150; //7;
        this.fastSpeed = this.slowSpeed * 2;
        this.rad = 16; //32x32 head to start
        //this.slerp = 0.47;//0.4
        //this.slerp = 0.35;//0.4
        this.slerp = 0.25; //0.4
        this.LevelXP = 50; //100;
        //this.colors =  ["f5e0dc", "f2cdcd", "f5c2e7", "cba6f7", "f38ba8", "eba0ac", "fab387", "f9e2af",
        //"a6e3a1", "94e2d5", "89dceb", "74c7ec", "89b4fa", "b4befe"];
        //this.colors =  ['EAB999', '00ff88', 'ff4400', '0088ff', 'aa44ff', 'ffaa00']
        this.colors = [
            this.rgbToHex(255, 255, 255), // original white
            this.rgbToHex(255, 182, 193), // light pink
            this.rgbToHex(173, 216, 230), // light blue
            this.rgbToHex(144, 238, 144), // light green
            this.rgbToHex(255, 218, 185), // peach
            this.rgbToHex(221, 160, 221), // plum
            this.rgbToHex(255, 255, 224), // light yellow
            this.rgbToHex(176, 196, 222), // light steel blue
            this.rgbToHex(255, 192, 203), // pink
            this.rgbToHex(152, 251, 152) // pale green
        ];
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    rgbToHex(r, g, b) {
        const toHex = (c) => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CreateSnake(isAI, x, y, size = 5) {
        let z = 1000;
        let c = this.world.RandInt(this.colors.length - 1); //Index only needed
        let head = this.world.CreateUnit(1, x, y, z, 0, this.rad * 2, this.rad * 2, this.rad, this.slowSpeed, c);
        head.isAI = isAI; //1= yes, 0=no
        head.isLead = true;
        head.EXP = 500; //Experience for growth (defaults)
        head.Level = 5;
        head.bright = 0;
        head.bright_time = 0;
        let bb = 0;
        for (let i = 0; i < size; i++) { //tail parts
            z--; //z index for rendering
            let p = this.world.CreateUnit(1, x, y, z, 0, this.rad * 2, this.rad * 2, this.rad, this.slowSpeed, c);
            head.parts.push(p); //link object
            p.owner = head.id; //id reference to main unit/head
            p.isLead = false; //not head of snake
            p.linkIndex = i + 1; // order along body
            p.bright = bb; //brightness of color for boost
            bb++;
            if (bb >= 10) {
                bb = 0;
            }
        }
        return head.id; //unit id
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    AddEXP(head, exp) {
        let i;
        head.EXP += exp;
        head.LEVEL = Math.floor(head.EXP / this.LevelXP); //100 (higher to take longer to level/grow)
        if (head.LEVEL > 250) {
            head.LEVEL = 250;
        } //max levels or links
        let rad = Math.floor(head.LEVEL / 2);
        if (rad < 16) {
            rad = 16;
        } //Minium size (w/h = 32x32)
        if (rad > 75) {
            rad = 75;
        } //Max (w/h = 300)
        //resize on change
        if (head.radius !== rad) {
            head.radius = rad;
            head.w = rad * 2;
            head.h = rad * 2;
            for (i = 0; i < head.parts.length; i++) { //resize parts
                head.parts[i].radius = rad;
                head.parts[i].w = rad * 2;
                head.parts[i].h = rad * 2;
            }
        }
        //Add a link if needed
        if (head.parts.length < head.LEVEL) { //Grow to Level
            for (i = 0; i < head.LEVEL - head.parts.length; i++) { //Catch up
                let tail = head.parts[head.parts.length - 1];
                let p = this.world.CreateUnit(1, tail.x, tail.y, tail.z - 1, 0, head.w, head.h, head.radius, 3, head.color);
                head.parts.push(p); //link object
                p.owner = head.id; //id reference to main unit/head
                p.isLead = false; //not head of snake
                p.angle = tail.angle; //match rot
                p.bright = tail.bright + 1; //brightness of color for boost
                if (p.bright >= 10) {
                    p.bright = 0;
                }
            }
        }
        if (head.isAI === 0) {
            console.log("Grow " + head.EXP + " Level: " + head.LEVEL + " Links: " + head.parts.length);
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    LoseEXP(head, exp) {
        let i;
        head.EXP -= exp;
        head.LEVEL = Math.floor(head.EXP / this.LevelXP); //100 (higher to take longer to level/grow)
        if (head.LEVEL > 250) {
            head.LEVEL = 250;
        } //max levels or links
        let rad = Math.floor(head.LEVEL / 2);
        if (rad < 16) {
            rad = 16;
        } //Minium size (w/h = 32x32)
        if (rad > 75) {
            rad = 75;
        } //Max (w/h = 300)
        //resize on change
        if (head.radius !== rad) {
            head.radius = rad;
            head.w = rad * 2;
            head.h = rad * 2;
            for (i = 0; i < head.parts.length; i++) { //resize parts
                head.parts[i].radius = rad;
                head.parts[i].w = rad * 2;
                head.parts[i].h = rad * 2;
            }
        }
        //TODO Remove LINK if down LEVELS
        //Generate a standard food drop
        if (head.EXP > 100) {
            let tail = head.parts[head.parts.length - 1];
            let frad = 15; //standard food = 15 radius
            let d = this.world.CreateDynamic(1, tail.x, tail.y, 0, 0, frad * 2, frad * 2, frad, 5, head.color);
            d.origin_x = tail.x;
            d.origin_y = tail.y;
        }
    }
    drawSmoothCurveQuadratic(context, points) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        // Connect the last two points with a straight line or another quadratic curve
        context.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        context.stroke();
    }
    getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    //------------------------------------------------------------------------------------------------------------------
    //Tail parts
    //------------------------------------------------------------------------------------------------------------------
    moveTo(obj, dt) {
        let last, curr;
        //const baseSpeed = config.snake.BASE_SPEED;
        //const speedRatio = this.speed / this.slowSpeed;
        //const adjustedLerpFactor = Math.min(0.2 * (1 + (speedRatio - 1) * 0.5) * deltaSeconds, 1.0);
        //const adjustedLerpFactor = this.slerp;
        //obj.bright++; if(obj.bright >= 10){obj.bright = 0;}
        let rc = false;
        obj.bright_time += dt;
        if (obj.bright_time > 0.05) {
            rc = true;
            obj.bright_time = 0;
        }
        if (rc) {
            obj.bright--;
            if (obj.bright < 0) {
                obj.bright = 10;
            }
        }
        for (let i = 0; i < obj.parts.length; i++) {
            if (i === 0) {
                last = obj; //head/main unit
            }
            else {
                last = obj.parts[i - 1];
            }
            curr = obj.parts[i];
            curr.boost = obj.boost; //match head
            if (obj.boost && obj.EXP > 100) {
                //curr.x = this.world.MLerp(curr.x, last.x, this.slerp * 1.2);
                //curr.y = this.world.MLerp(curr.y, last.y, this.slerp * 1.2);
                curr.x = this.world.MLerp(curr.x, last.x, this.slerp * 1.5);
                curr.y = this.world.MLerp(curr.y, last.y, this.slerp * 1.5);
            }
            else {
                curr.x = this.world.MLerp(curr.x, last.x, this.slerp);
                curr.y = this.world.MLerp(curr.y, last.y, this.slerp);
            }
            //            const length = this.getDistance(fromTracer, toTracer);
            //            const segmentRadius = this.radius * (1 - i * 0.015); // Subtle taper
            // Width = segment thickness (like your diameter)
            //            sprite.scale.x = (segmentRadius * 2) / 128;
            // Height = length + thickness (like your stretched ImageLabel)
            //            sprite.scale.y = (length + segmentRadius) / 64;
            //let targetAngle = Math.atan2(last.y - curr.y, last.x - curr.x);
            //let targetAngle = Math.atan2(curr.y - last.y, curr.x - last.x);
            //let rotationSpeed = 0.12//0.05; // Adjust as needed
            //curr.angle = this.SimpleRotateTo(curr.angle, targetAngle, rotationSpeed);
            if (i < obj.parts.length - 1) {
                let toTracer = obj.parts[i + 1];
                const angle = Math.atan2(toTracer.y - curr.y, toTracer.x - curr.x);
                curr.angle = angle + Math.PI / 2;
            }
            else {
                const angle = Math.atan2(curr.y - last.y, curr.x - last.x); //previous
                curr.angle = angle + Math.PI / 2;
            }
            if (rc) {
                curr.bright--;
                if (curr.bright < 0) {
                    curr.bright = 10;
                }
            }
            /*
            const dx = last.x - curr.x;
            const dy = last.y - curr.y;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - curr.angle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                const segmentTurnFactor = Math.min(0.3 * dt, 0.5);
                curr.angle += angleDiff * segmentTurnFactor;
            }*/
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    SimpleRotateTo(angle, target, spd) {
        let angleDifference = target - angle;
        // Normalize the angle difference to be within -PI to PI
        // This ensures the shortest rotation path
        if (angleDifference > Math.PI) {
            angleDifference -= 2 * Math.PI;
        }
        else if (angleDifference < -Math.PI) {
            angleDifference += 2 * Math.PI;
        }
        // If the angle difference is significant, rotate
        if (Math.abs(angleDifference) > spd) {
            // Move towards the target angle by the rotation speed
            angle += Math.sign(angleDifference) * spd;
        }
        else {
            // If close enough, snap to the target angle to prevent overshooting
            angle = target;
        }
        return angle; //adjusted
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    slither(obj, dt) {
        //let head = obj.parts[0];
        //console.log(dt)
        // 1. Calculate the target angle based on the target (e.g., mouse position)
        let deltaX = obj.tx - obj.x;
        let deltaY = obj.ty - obj.y;
        let targetAngle = Math.atan2(deltaY, deltaX);
        // 2. Smoothly rotate the obj towards the target angle
        let angleDifference = targetAngle - obj.angle;
        // Normalize angleDifference to be within -PI to PI
        if (angleDifference > Math.PI)
            angleDifference -= 2 * Math.PI;
        if (angleDifference < -Math.PI)
            angleDifference += 2 * Math.PI;
        // Apply a rotation speed to gradually turn the obj
        //let rotationSpeed = 0.12;// - (obj.radius / 2000)//0.05; // Adjust as needed as radius grows
        let rotationSpeed = 0.15; //FAST TURN
        //console.log(obj.radius / 2000)
        //        obj.angle += angleDifference * rotationSpeed;
        //console.log(obj.angle * (180 / Math.PI))
        obj.angle = this.SimpleRotateTo(obj.angle, targetAngle, rotationSpeed);
        //used for last position (lagged a bit behind)
        obj.ox = obj.x;
        obj.oy = obj.y;
        // 3. Update the obj head's position based on its current angle and speed
        if (obj.boost === 0 && obj.EXP > 100) { //min EXP required
            obj.x += Math.cos(obj.angle) * obj.speed * dt;
            obj.y += Math.sin(obj.angle) * obj.speed * dt;
        }
        else {
            obj.x += Math.cos(obj.angle) * this.fastSpeed * dt;
            obj.y += Math.sin(obj.angle) * this.fastSpeed * dt;
        }
        //console.log([obj.x, obj.tx, obj.y, obj.ty, obj.angle]);
        //console.log([obj.x, obj.y, obj.ox, obj.oy]);
        //tail parts
        this.moveTo(obj, dt);
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    DoDeath(obj) {
        //spawn extra food
        this.world.DeathFood(obj.parts);
        for (let i = 0; i < obj.parts.length; i++) {
            obj.parts[i].remove = 1;
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CheckSnakeHeads(obj, dt) {
        let tobj;
        //other snake check
        let res = this.CheckHeadHit(obj);
        if (res !== null) {
            obj.remove = 1;
            this.DoDeath(obj);
            return;
        }
        //bounds check
        if (this.world.CD.CircleCollision(obj.x, obj.y, obj.radius, this.world.w / 2, this.world.h / 2, this.world.w / 2) === false) {
            obj.remove = 1;
            this.DoDeath(obj);
            return;
        }
        //if(obj.x >= 0 && obj.y >= 0 && obj.x < this.world.w && obj.y < this.world.h){}
        //else { obj.remove = 1; this.DoDeath(obj); return; }
        //let fres = this.world.CD.IsObjHitAreaOXY(obj, "dynamic");//this.CheckHeadHitFood(obj);
        //Faster Collect (optimized)
        let fres = this.world.CD.IsObjHitAreaOXYFaster(obj, "dynamic");
        if (fres !== null) {
            tobj = fres[1];
            tobj.remove = 1; //flag to remove this food
            //EXP based System
            this.AddEXP(obj, tobj.radius);
            //console.log(tobj.radius / 5);
            //for (let gg = 0; gg < Math.floor(tobj.radius / 5); gg++) {
            //this.GrowSnake(obj, tobj.radius);
            //}
        }
        //Boost - Lose EXP/food here if boosting
        if (obj.boost === 1 && obj.EXP > 100) {
            obj.boost_time += dt;
            if (obj.boost_time >= obj.boost_cooldown) {
                this.LoseEXP(obj, 15); //standard food
                obj.boost_time = 0;
            }
        }
    }
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    CheckHeadHit(d) {
        //console.time('Check');
        //let units = this.world.CD.GetObjsArea(d.cx, d.cy, "unit");
        //More Optimzied (4 Cells only)
        let units = this.world.CD.GetOtherObjsArea4(d.x, d.y, "unit");
        //console.timeEnd('Check');
        for (let [oid, obj] of Object.entries(units)) {
            const o = obj;
            if (o.id !== d.id) { //not same head of snake
                if (o.owner !== d.id) { //not part of this snake
                    //Used Lagged last x/y
                    if (this.world.CD.CircleCollision(d.ox, d.oy, d.radius / 2, o.x, o.y, o.radius)) {
                        //if(this.world.CD.CircleCollision(d.x, d.y, d.radius/2, obj.x, obj.y, obj.radius)){
                        return [oid, o];
                    }
                }
            }
        }
        return null;
    }
}
exports.default = IOSnakeManager;
//# sourceMappingURL=snake.js.map