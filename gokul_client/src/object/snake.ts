import { GameState } from "../gameState";
import { SnakeSegment } from "../type";

// Vibrant color helpers
function hslToHex(h: number, s: number, l: number) {
    s /= 100; l /= 100;
    const k = (n: any) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: any) => {
        const col = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * col).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function getRandomVibrantColor() {
    const h = Math.floor(Math.random() * 360);
    return hslToHex(h, 78, 52);
}

export class Snake {
    segments: SnakeSegment[];
    baseColor: string;
    color: string;
    size: number;
    speed: number;
    angle: number;
    targetAngle: number;
    segmentSpacing: number;
    boostBlend: number;

    constructor(x: number, y: number, color = '#4CAF50') {
        this.segments = [];
        this.baseColor = getRandomVibrantColor();   // <- source of truth for rendering
        this.color = color;       // <- kept for compatibility if your code reads this
        this.size = 100;
        this.speed = 3;
        this.angle = 0;
        this.targetAngle = 0;
        this.boostBlend = 10; // should be changed

        // spacing between segment centers (use <= size for a tight body)
        this.segmentSpacing = this.size * 0.9;
        //this.segmentSpacing = this.size * 3.9;

        // build initial body
        const startLen = 6;//25
        for (let i = 0; i < startLen; i++) {
            this.segments.push({
                x: x - i * this.segmentSpacing,
                y: y,
                size: this.size
            });
        }
    }

    update() {
        // Default player control uses mouse+camera.
        // (Bots override movement in their own update())
        if (window.mouse && window.camera) {
            const head = this.segments[0];
            const dx = window.mouse.x - (head.x - window.camera.x);
            const dy = window.mouse.y - (head.y - window.camera.y);
            this.targetAngle = Math.atan2(dy, dx);

            let angleDiff = this.targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            this.angle += angleDiff * 0.08;

            const speed = window.boosting ? this.speed * 1.6 : this.speed;

            // move head
            head.x += Math.cos(this.angle) * speed;
            head.y += Math.sin(this.angle) * speed;

            // follow segments
            for (let i = 1; i < this.segments.length; i++) {
                const prev = this.segments[i - 1];
                const curr = this.segments[i];
                const dx2 = prev.x - curr.x;
                const dy2 = prev.y - curr.y;
                const d = Math.hypot(dx2, dy2);
                if (d > this.segmentSpacing) {
                    const r = (d - this.segmentSpacing) / d;
                    curr.x += dx2 * r * 0.35;
                    curr.y += dy2 * r * 0.35;
                }
                curr.size = this.size;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const t = Math.max(0, Math.min(1, this.boostBlend)); // clamp 0..1

        // ctx.save();
        // ctx.globalAlpha = 1 - t;
        // this.drawCruiseLook();
        // ctx.restore();

        ctx.save();
        ctx.globalAlpha = t;
        this.drawBoostLook(ctx);
        ctx.restore();

        // Eyes drawn fully opaque on top
        // const headW = this.size * 2.0;
        this.drawEyes(ctx);
    }

    drawCruiseLook(ctx: CanvasRenderingContext2D) {
        ctx.lineJoin = "round"; ctx.lineCap = "round";

        const head = this.segments[0];
        const tail = this.segments[this.segments.length - 1];

        const headW = this.size * 2.00;
        const tailW = this.size * 1.65;

        // base tube
        const bodyGrad = ctx.createLinearGradient(
            head.x - GameState.camera.x, head.y - GameState.camera.y,
            tail.x - GameState.camera.x, tail.y - GameState.camera.y
        );
        bodyGrad.addColorStop(0.00, "#79d9e5");
        bodyGrad.addColorStop(0.60, "#74d1db");
        bodyGrad.addColorStop(1.00, "#6ac0cb");

        for (let i = this.segments.length - 1; i > 0; i--) {
            const a = this.segments[i], b = this.segments[i - 1];
            const t = i / (this.segments.length - 1);
            const w = headW * (1 - t) + tailW * t;

            ctx.strokeStyle = bodyGrad;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(a.x - GameState.camera.x, a.y - GameState.camera.y);
            ctx.lineTo(b.x - GameState.camera.x, b.y - GameState.camera.y);
            ctx.stroke();
        }

        // segment half-rings (BACK visible)
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        for (let i = 1; i < this.segments.length; i++) {
            const prev = this.segments[i - 1];
            const next = this.segments[i + 1] || prev;
            const seg = this.segments[i];

            const tang = Math.atan2(prev.y - next.y, prev.x - next.x);
            const x = seg.x - GameState.camera.x, y = seg.y - GameState.camera.y;

            const t = i / (this.segments.length - 1);
            const w = headW * (1 - t) + tailW * t;
            const r = w * 0.50;

            const nx = Math.cos(tang), ny = Math.sin(tang);

            const g = ctx.createLinearGradient(
                x + nx * r, y + ny * r,   // front (hidden)
                x - nx * r, y - ny * r    // back (visible)
            );
            g.addColorStop(0.00, "rgba(255,255,255,0.00)");
            g.addColorStop(0.40, "rgba(255,255,255,0.05)");
            g.addColorStop(0.70, "rgba(255,255,255,0.11)");
            g.addColorStop(1.00, "rgba(255,255,255,0.18)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.98, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawBoostLook(ctx: CanvasRenderingContext2D) {
        ctx.lineJoin = "round"; ctx.lineCap = "round";

        const head = this.segments[0];
        const tail = this.segments[this.segments.length - 1];

        const headW = this.size * 2.00;
        const tailW = this.size * 1.65;

        // // outer glow
        // for (let i = this.segments.length - 1; i > 0; i--) {
        //   const a = this.segments[i], b = this.segments[i - 1];
        //   const t = i / (this.segments.length - 1);
        //   const w = (headW * (1 - t) + tailW * t) * 1.25;

        //   ctx.save();
        //   ctx.shadowColor = "rgba(123, 242, 233, 1)";
        //   ctx.shadowBlur = w * 0.4;
        //   ctx.strokeStyle = "rgba(123, 242, 233, 1)";
        //   ctx.lineWidth = w * 0.5;
        //   ctx.beginPath();
        //   ctx.moveTo(a.x - camera.x, a.y - camera.y);
        //   ctx.lineTo(b.x - camera.x, b.y - camera.y);
        //   ctx.stroke();
        //   ctx.restore();
        // }

        // base tube
        const bodyGrad = ctx.createLinearGradient(
            head.x - GameState.camera.x, head.y - GameState.camera.y,
            tail.x - GameState.camera.x, tail.y - GameState.camera.y
        );
        bodyGrad.addColorStop(0.00, "#79d9e5");
        bodyGrad.addColorStop(0.60, "#74d1db");
        bodyGrad.addColorStop(1.00, "#6ac0cb");

        for (let i = this.segments.length - 1; i > 0; i--) {
            const a = this.segments[i], b = this.segments[i - 1];
            const t = i / (this.segments.length - 1);
            const w = headW * (1 - t) + tailW * t;

            ctx.strokeStyle = bodyGrad;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(a.x - GameState.camera.x, a.y - GameState.camera.y);
            ctx.lineTo(b.x - GameState.camera.x, b.y - GameState.camera.y);
            ctx.stroke();
        }

        // segment half-rings (BACK visible)
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        for (let i = 1; i < this.segments.length; i++) {
            const prev = this.segments[i - 1];
            const next = this.segments[i + 1] || prev;
            const seg = this.segments[i];

            const tang = Math.atan2(prev.y - next.y, prev.x - next.x);
            const x = seg.x - GameState.camera.x, y = seg.y - GameState.camera.y;

            const t = i / (this.segments.length - 1);
            const w = headW * (1 - t) + tailW * t;
            const r = w * 0.50;

            const nx = Math.cos(tang), ny = Math.sin(tang);

            const g = ctx.createLinearGradient(
                x + nx * r, y + ny * r,   // front (hidden)
                x - nx * r, y - ny * r    // back (visible)
            );
            g.addColorStop(0.00, "rgba(255,255,255,0.00)");
            g.addColorStop(0.40, "rgba(255,255,255,0.05)");
            g.addColorStop(0.70, "rgba(255,255,255,0.11)");
            g.addColorStop(1.00, "rgba(255,255,255,0.18)");

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.98, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawEyes(ctx: CanvasRenderingContext2D) {
        const head = this.segments[0];
        const hx = head.x - GameState.camera.x, hy = head.y - GameState.camera.y;
        const eyeDist = this.size * 0.60, eyeR = this.size * 0.44, pupilR = eyeR * 0.58;

        const lx = hx + Math.cos(this.angle - 0.85) * eyeDist;
        const ly = hy + Math.sin(this.angle - 0.85) * eyeDist;
        const rx = hx + Math.cos(this.angle + 0.85) * eyeDist;
        const ry = hy + Math.sin(this.angle + 0.85) * eyeDist;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(255,255,255,0.98)";
        ctx.beginPath(); ctx.arc(lx, ly, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = "rgba(18,22,28,0.98)";
        const look = this.size * 0.16;
        ctx.beginPath();
        ctx.arc(lx + Math.cos(this.angle) * look, ly + Math.sin(this.angle) * look, pupilR, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rx + Math.cos(this.angle) * look, ry + Math.sin(this.angle) * look, pupilR, 0, Math.PI * 2);
        ctx.fill();
    }

    grow() {
        const tail = this.segments[this.segments.length - 1];
        this.segments.push({ x: tail.x, y: tail.y, size: this.size });
    }
}

// If you use modules:
// export default Snake;

