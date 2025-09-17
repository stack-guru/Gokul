import { GameState } from "../gameState";

export class Food {
    centerX: number;
    centerY: number;
    size: number;
    hasGlow: boolean;
    color: string;
    pulse: number;
    offsetX: number;
    offsetY: number;
    vx: number;
    vy: number;
    targetVX: number;
    targetVY: number;
    maxOffset: number;
    speed: number;
    changeDirTimer: number;
    attractedTo: any;

    isDeathFood?: boolean;
    deathFoodPulse?: number;
    deathFoodColor?: string;
    deathFoodPulseSpeed?: number;

    constructor(x: number, y: number) {
        this.centerX = x;
        this.centerY = y;
        this.size = Math.random() * 8 + 4;
        this.hasGlow = true;

        // Random color generation - keeping current white color and adding more options
        const foodColors = [
            'rgba(255, 255, 255, 0.2)', // original white
            'rgba(255, 182, 193, 0.3)', // light pink
            'rgba(173, 216, 230, 0.3)', // light blue
            'rgba(144, 238, 144, 0.3)', // light green
            'rgba(255, 218, 185, 0.3)', // peach
            'rgba(221, 160, 221, 0.3)', // plum
            'rgba(255, 255, 224, 0.3)', // light yellow
            'rgba(176, 196, 222, 0.3)', // light steel blue
            'rgba(255, 192, 203, 0.3)', // pink
            'rgba(152, 251, 152, 0.3)'  // pale green
        ];
        this.color = foodColors[Math.floor(Math.random() * foodColors.length)];

        this.pulse = 0;

        this.offsetX = 0;
        this.offsetY = 0;

        this.vx = 0;
        this.vy = 0;

        this.targetVX = 0;
        this.targetVY = 0;

        this.maxOffset = 60 + Math.random() * 40;
        this.speed = 0.5 + Math.random() * 0.3;

        this.changeDirTimer = 0;
        this.attractedTo = null; // snake head that food is being pulled to
    }

    update(player: any, bots: any) {
        this.pulse += 0.1;

        // Update death food pulse if it's death food
        if (this.isDeathFood) {
            this.deathFoodPulse = (this.deathFoodPulse || 0) + (this.deathFoodPulseSpeed || 0.15);
        }

        // --- Check for attraction ---
        this.attractedTo = null;

        // Check against player
        if (this._isNear(player.segments[0], player)) {
            this.attractedTo = player.segments[0];
        }

        // Check against bots
        for (const bot of bots) {
            if (this._isNear(bot.segments[0], player)) {
                this.attractedTo = bot.segments[0];
                break;
            }
        }

        if (this.attractedTo) {
            // Move toward the snake head smoothly
            const dx = this.attractedTo.x - this.x;
            const dy = this.attractedTo.y - this.y;
            const angle = Math.atan2(dy, dx);
            const attractionSpeed = 4 + Math.random() * 1.5;

            this.vx = Math.cos(angle) * attractionSpeed;
            this.vy = Math.sin(angle) * attractionSpeed;

            this.offsetX += this.vx;
            this.offsetY += this.vy;
        } else {
            // Random drifting behavior (same as before)
            this.changeDirTimer--;
            if (this.changeDirTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                this.targetVX = Math.cos(angle) * this.speed;
                this.targetVY = Math.sin(angle) * this.speed;
                this.changeDirTimer = 50 + Math.floor(Math.random() * 50);
            }

            const lerpFactor = 0.05;
            this.vx += (this.targetVX - this.vx) * lerpFactor;
            this.vy += (this.targetVY - this.vy) * lerpFactor;

            this.offsetX += this.vx;
            this.offsetY += this.vy;

            const distSq = this.offsetX ** 2 + this.offsetY ** 2;
            if (distSq > this.maxOffset ** 2) {
                const pullFactor = 0.02;
                this.offsetX -= this.offsetX * pullFactor;
                this.offsetY -= this.offsetY * pullFactor;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const worldRadius = 5000 / 2;
        const distFromCenter = Math.hypot(this.x, this.y);

        if (distFromCenter > worldRadius - this.size) return;

        const x = this.x - GameState.camera.x;
        const y = this.y - GameState.camera.y;

        // Use normal food drawing for all food (including death food)
        this.drawRegularFood(ctx, x, y);
    }

    drawRegularFood(ctx: CanvasRenderingContext2D, x: number, y: number) {
        // Inverse glow size: smaller food = bigger glow
        const maxGlowSize = 50;
        const minGlowSize = 20;
        let glowRadius = Math.max(minGlowSize, maxGlowSize - this.size * 2.5);

        // Add extra glow for boost food
        if (this.hasGlow) {
            glowRadius *= 1.5; // 50% bigger glow
        }

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);

        // Adjust glow intensity for boost food
        if (this.hasGlow) {
            gradient.addColorStop(0, this._fadeColor(0.12));  // brighter center for boost food
            gradient.addColorStop(1, this._fadeColor(0));     // transparent edge
        } else {
            gradient.addColorStop(0, this._fadeColor(0.08));  // soft center for normal food
            gradient.addColorStop(1, this._fadeColor(0));     // transparent edge
        }

        ctx.save();

        // Draw blurry glow behind food
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw clear food center
        ctx.beginPath();
        ctx.arc(x, y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }

    drawDeathFood(ctx: CanvasRenderingContext2D, x: number, y: number) {
        // Pulsing effect for death food
        const pulseScale = 1 + Math.sin(this.deathFoodPulse || 0) * 0.3;
        const scaledSize = this.size * pulseScale;

        // Create a more intense glow for death food
        const glowRadius = scaledSize * 3;

        // Use bot's color or default to red
        const deathColor = this.deathFoodColor || '#FF6B6B';

        // Create gradient with bot's color
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, this._fadeColorWithColor(0.3, deathColor));  // bright center
        gradient.addColorStop(0.5, this._fadeColorWithColor(0.15, deathColor)); // medium
        gradient.addColorStop(1, this._fadeColorWithColor(0, deathColor));     // transparent edge

        ctx.save();

        // Draw intense glow behind death food
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw death food center with bot's color
        ctx.beginPath();
        ctx.arc(x, y, scaledSize, 0, Math.PI * 2);
        ctx.fillStyle = deathColor;
        ctx.fill();

        // Add a white highlight
        ctx.beginPath();
        ctx.arc(x - scaledSize * 0.3, y - scaledSize * 0.3, scaledSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }

    get x() {
        return this.centerX + this.offsetX;
    }

    get y() {
        return this.centerY + this.offsetY;
    }

    _isNear(snakeHead: any, player: any) {
        const dx = this.x - snakeHead.x;
        const dy = this.y - snakeHead.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only attract if within range
        if (distance >= 100) return false;

        // Check if food is directly in front of the snake
        // Get snake's current direction (assuming player has an angle property)
        if (typeof player !== 'undefined' && player.angle !== undefined) {
            const snakeAngle = player.angle;

            // Calculate angle from snake to food
            const foodAngle = Math.atan2(dy, dx);

            // Calculate angle difference
            let angleDiff = foodAngle - snakeAngle;

            // Normalize angle difference to -π to π
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Only attract if food is directly in front of snake (within 30 degrees)
            const frontAngle = Math.PI / 6; // 30 degrees (much narrower cone)
            if (Math.abs(angleDiff) > frontAngle) {
                return false; // Food is not directly in front
            }
        }

        return true; // Food is directly in front and within range
    }

    _fadeColor(alpha: number) {
        return this.color.replace(/[\d.]+\)$/g, `${alpha})`);
    }

    _fadeColorWithColor(alpha: number, color: string) {
        // Convert hex color to rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

