import { GameState } from "../gameState";

export function drawBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const worldRadius = 5000 / 2;//gameState.worldSize / 2;
    const centerX = -GameState.camera.x;
    const centerY = -GameState.camera.y;

    // --- Step 1: Draw striped background ---
    const stripeWidth = 20;
    const stripeColor1 = '#6b3d4d'; // dark stripe
    const stripeColor2 = '#8b566a'; // light stripe

    ctx.save();

    for (let x = -canvas.height; x < canvas.width + canvas.height; x += stripeWidth * 2) {
        ctx.fillStyle = stripeColor1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeWidth, 0);
        ctx.lineTo(x + canvas.height + stripeWidth, canvas.height);
        ctx.lineTo(x + canvas.height, canvas.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = stripeColor2;
        ctx.beginPath();
        ctx.moveTo(x + stripeWidth, 0);
        ctx.lineTo(x + stripeWidth * 2, 0);
        ctx.lineTo(x + canvas.height + stripeWidth * 2, canvas.height);
        ctx.lineTo(x + canvas.height + stripeWidth, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    // --- Step 2: Cut out gameplay circle ---
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, worldRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- Step 3: Draw ring at boundary ---
    ctx.save();
    ctx.strokeStyle = '#8b566a'; // white ring, can change color
    ctx.lineWidth = 40; // ring thickness
    ctx.beginPath();
    ctx.arc(centerX, centerY, worldRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // --- Step 4: Draw inside gameplay area background spots ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, worldRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const spot of GameState.backgroundSpots) {
        const screenX = spot.x - GameState.camera.x + canvas.width / 2;
        const screenY = spot.y - GameState.camera.y + canvas.height / 2;

        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, spot.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, spot.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function generateBackgroundSpots() {
    for (let i = 0; i < GameState.spotCount; i++) {
        GameState.backgroundSpots.push({
            x: (Math.random() - 0.5) * 1024,//gameState.worldSize,
            y: (Math.random() - 0.5) * 1024,//gameState.worldSize,
            radius: Math.random() * 500 + 400,        // Base size
            pulseSpeed: Math.random() * 0.02 + 0.005,  // Each spot breathes differently
            phase: Math.random() * Math.PI * 2        // Different start point in sine wave
        });
    }
}


