import { UnitObject } from "../../types";
import type SlitherWorld from "../slither-io";

function MLerp(start: number, end: number, amt: number)  { return (1-amt)*start+amt*end }

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}

function map(value: number, min: number, max: number, newMin: number, newMax: number) {
	if (min === max) {
		return newMin;
	}
	return lerp(newMin, newMax, (value - min) / (max - min));
}

const TINY = 0.0001;

class IOSnakeManager {
    private world: SlitherWorld;

    private scale = 0.6;
    private slowSpeed = 150;
    private fastSpeed = this.slowSpeed * 2;
    private rad = 16;
    private slerp = 0.47;
    private LevelXP = 20;

    private colors = [
        this.rgbToHex(255, 255, 255), // white
        this.rgbToHex(255, 182, 193), // light pink
        this.rgbToHex(173, 216, 230), // light blue
        this.rgbToHex(144, 238, 144), // light green
        this.rgbToHex(255, 218, 185), // peach
        this.rgbToHex(221, 160, 221), // plum
        this.rgbToHex(255, 255, 224), // light yellow
        this.rgbToHex(176, 196, 222), // light steel blue
        this.rgbToHex(255, 192, 203), // pink
        this.rgbToHex(152, 251, 152)  // pale green
    ]

    constructor(world: SlitherWorld) {
        this.world = world;
    }

    rgbToHex(r: number, g: number, b: number) {
        const toHex = (c: number) => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Helper function to describe snake properties based on score/EXP
    describeSnakeFromScore(score: number) {
        // Calculate radius based on level (similar to original logic but smoother)
        const level = Math.floor(score / this.LevelXP);
        const baseRadius = Math.max(0.7 * Math.log10(score / 300 + 2), 0.5)
        const radius = baseRadius * 32

        return {
            radius,
            spacingAtHead: Math.max(0.75 * radius, 0.5), // Minimum spacing for glow visibility
            spacingAtTail: 2.5 * radius,
            length: 64 * Math.log10(score / 256 + 1) + 3,
            turnSpeed: Math.max((360 - 100 * Math.log10(score / 150 + 1)) * Math.PI / 180, 45 * Math.PI / 180)
        };
    }

    CreateSnake(isAI: number, x: number, y: number, size = 5) {
        let z = 1000;
        let c = this.world.RandInt(this.colors.length - 1);
        let head = this.world.CreateUnit(1, x, y, z, 0, this.rad * 2, this.rad * 2, this.rad, this.slowSpeed, c);
        head.isAI = isAI;
        head.isLead = true;
        head.EXP = 10;
        head.bright = 0;
    

        let bb = 0;
        const description = this.describeSnakeFromScore(head.EXP);
        const actualSize = Math.floor(description.length);
        
        // Update head size based on initial EXP
        head.radius = description.radius;
        head.w = description.radius * 2;
        head.h = description.radius * 2;
        
        for(let i = 0; i < actualSize; i++) {
            z--;
            // Calculate initial spacing based on position in snake
            const spacing = lerp(description.spacingAtHead, description.spacingAtTail, i / actualSize);
            const offsetX = x - (spacing * (i + 1));
            
            let p = this.world.CreateUnit(1, offsetX, y, z, 0, description.radius * 2, description.radius * 2, description.radius, this.slowSpeed, c);

            p.prevUnitId = i === 0 ? head.id : head.parts[i - 1].id;
            p.owner = head.id;
            p.isLead = false;
            p.bright = bb;
            p.segmentIndex = i; // Track segment position for spacing

            p.spacing = spacing;

            head.parts.push(p);

            bb++;
            if(bb >= 10) { bb = 0; }
        }
        return head.id;
    }

    AddEXP(head: UnitObject, exp: number) {
        head.EXP += exp;

        const description = this.describeSnakeFromScore(head.EXP);
        const newRadius = description.radius;

        // Always update radius to ensure growth
        head.radius = newRadius;
        head.w = newRadius * 2;
        head.h = newRadius * 2;
        
        // Update all parts' radius
        for (let i = 0; i < head.parts.length; i++) {
            head.parts[i].radius = newRadius;
            head.parts[i].w = newRadius * 2;
            head.parts[i].h = newRadius * 2;
        }

        if(head.isAI === 0) {
            console.log("Grow EXP: " + head.EXP + " Radius: " + newRadius + " Links: " + head.parts.length);
        }
    }

    LoseEXP(head: UnitObject, exp: number) {
        head.EXP = Math.max(head.EXP - exp, 0);

        const description = this.describeSnakeFromScore(head.EXP);
        const newRadius = description.radius;

        // Always update radius
        head.radius = newRadius;
        head.w = newRadius * 2;
        head.h = newRadius * 2;
        
        // Update all parts' radius
        for (let i = 0; i < head.parts.length; i++) {
            head.parts[i].radius = newRadius;
            head.parts[i].w = newRadius * 2;
            head.parts[i].h = newRadius * 2;
        }

        if(head.EXP > 100) {
            let tail = head.parts[head.parts.length - 1];
            let frad = 15;
            let d = this.world.CreateDynamic(1, tail.x, tail.y, 0, 0, frad * 2, frad * 2, frad, 5, head.color);
            d.origin_x = tail.x;
            d.origin_y = tail.y;
        }
    }

    moveTo(head: UnitObject, dt: number) {
        const description = this.describeSnakeFromScore(head.EXP);
        const totalLength = head.parts.length;
        const desiredLengthFloat = description.length;
        const desiredLength = Math.floor(desiredLengthFloat);

        head.bright = ((head.bright ?? 0) + 1) % 10;

        for (let i = 0; i < head.parts.length; i++) {
            if(i >= desiredLength) {
                // Mark excess segments for removal
                head.parts[i].remove = 1;
                continue;
            }

            const curr = head.parts[i];
            const previous = i === 0 ? head : head.parts[i - 1];

            curr.boost = head.boost;

            // Keep all segments at full size
            curr.radius = description.radius;
            curr.w = description.radius * 2;
            curr.h = description.radius * 2;

            // Calculate dynamic spacing based on position in snake
            const t = i / Math.max(totalLength - 1, 1);
            const spacing = map(i, 0, totalLength, description.spacingAtHead, description.spacingAtTail);

            const curSpeed = head.boost === 1 ? this.fastSpeed * 0.75: this.slowSpeed;
            let alpha = (dt * curSpeed) / spacing

            // For boosting, ensure tail segments don't lag too much
            if (head.boost === 1 && i > totalLength * 0.7) {
                // Boost the alpha for tail segments to prevent them from lagging
                alpha *= 1.2;
            }

            alpha = Math.max(TINY, Math.min(1 - TINY, alpha));

            // Only apply to the last tail segment
            // if(i === obj.parts.length - 1 && !curr.dragged) {
            //     if(dist > spacing) {
            //         console.log('dragged')
            //         curr.dragged = true
            //     } else {
            //         alpha = 0.1;
            //     }
            // }

            // Apply fractional spacing for smooth growth on tail segment
            const isTailSegment = (i === head.parts.length - 1);

            if (isTailSegment && head.parts.length === desiredLength) {
                // For the tail segment, adjust the alpha based on growth fraction
                // This makes the tail follow closer when growth fraction is small
                curr.x = MLerp(curr.x, previous.x, alpha);
                curr.y = MLerp(curr.y, previous.y, alpha);
            } else {
                curr.x = MLerp(curr.x, previous.x, alpha);
                curr.y = MLerp(curr.y, previous.y, alpha);
            }

            // Update angle to face the target
            let targetAngle = Math.atan2(previous.y - curr.y, previous.x - curr.x);
            curr.angle = targetAngle; //this.SimpleRotateTo(curr.angle, targetAngle, rotationSpeed);

            curr.bright--;
            if(curr.bright < 0) { curr.bright = 10; }
        }

        if(totalLength < desiredLength) {
            for(let i = totalLength; i < desiredLength; i++) {
                let tail = head.parts[head.parts.length - 1];
                const newZ = tail.z - 1

                const spawnX = tail.x + (TINY * (i + 1));
                const spawnY = tail.y;

                let p = this.world.CreateUnit(1, spawnX, spawnY, newZ, 0, description.radius * 2, description.radius * 2, description.radius, 3, head.color);

                p.owner = head.id;
                p.isLead = false;
                p.angle = tail.angle;
                p.bright = tail.bright + 1;
                p.segmentIndex = i;

                head.parts.push(p);

                if((p.bright ?? 0) >= 10) { p.bright = 0; }
                p.prevUnitId = head.parts[head.parts.length - 2].id;
            }
        }

        // Remove excess segments that were marked for removal
        head.parts = head.parts.filter(part => !part.remove);
    }

    SimpleRotateTo(angle: number, target: number, spd: number) {
        let angleDifference = target - angle;

        if (angleDifference > Math.PI) {
            angleDifference -= 2 * Math.PI;
        } else if (angleDifference < -Math.PI) {
            angleDifference += 2 * Math.PI;
        }

        if (Math.abs(angleDifference) > spd) {
            angle += Math.sign(angleDifference) * spd;
        } else {
            angle = target;
        }
        return angle;
    }

    slither(head: UnitObject, dt: number) {
        const description = this.describeSnakeFromScore(head.EXP);
        
        let deltaX = head.tx - head.x;
        let deltaY = head.ty - head.y;
        let targetAngle = Math.atan2(deltaY, deltaX);

        let angleDifference = targetAngle - head.angle;
        if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
        if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

        // Use dynamic turn speed based on score
        let rotationSpeed = description.turnSpeed * dt;
        head.angle = this.SimpleRotateTo(head.angle, targetAngle, rotationSpeed);

        head.ox = head.x;
        head.oy = head.y;

        const speed = head.boost === 1 ? this.fastSpeed : head.speed;
        head.x += Math.cos(head.angle) * speed * dt;
        head.y += Math.sin(head.angle) * speed * dt;

        this.moveTo(head, dt);
    }

    DoDeath(obj: UnitObject) {
        this.world.DeathFood(obj.parts);
        for (let i = 0; i < obj.parts.length; i++) {
            obj.parts[i].remove = 1;
        }
    }

    CheckSnakeHeads(obj: UnitObject, dt: number) {
        let tobj, tid;

        let res = this.CheckHeadHit(obj);
        if(res !== null) {
            obj.remove = 1;
            this.DoDeath(obj);
            return;
        }

        if(this.world.CD.CircleCollision(obj.x, obj.y, obj.radius, this.world.w/2, this.world.h/2, this.world.w/2) === false) {
            obj.remove = 1;
            this.DoDeath(obj);
            return;
        }

        let fres = this.world.CD.IsObjHitAreaOXYFaster(obj, "dynamic");
        if(fres !== null) {
            tid = fres[0];
            tobj = fres[1];
            tobj.remove = 1;
            this.AddEXP(obj, tobj.radius);
        }

        if(obj.boost === 1 && obj.EXP > 100) {
            obj.boost_time += dt;
            if(obj.boost_time >= obj.boost_cooldown) {
                this.LoseEXP(obj, 1);
                obj.boost_time = 0;
            }
        }
    }

    CheckHeadHit(d: UnitObject) {
        let units = this.world.CD.GetOtherObjsArea4(d.x, d.y, "unit");
        for (let [oid, obj] of Object.entries(units)) {
            if(obj.id !== d.id) {
                if(obj.owner !== d.id) {
                    if(this.world.CD.CircleCollision(d.ox, d.oy, d.radius/2, obj.x, obj.y, obj.radius)) {
                        return [oid, obj];
                    }
                }
            }
        }
        return null;
    }
}

export default IOSnakeManager;