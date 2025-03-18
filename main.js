const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game settings
let FOV = Math.PI / 3; // Field of view
let RESOLUTION = 0.01; // Ray resolution
let WALL_HEIGHT = 1; // Height of walls
let SPEED = 0.05; // Player movement speed
let TURN_SPEED = 0.02; // Player turning speed

// Game map (1 = wall, 0 = empty space)
let map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Player starting position and angle
let player = {
  x: 1.5,
  y: 1.5,
  angle: 0,
};

// NPC
let npc = {
  x: 5.5,
  y: 5.5,
  message: "",
  messageTimer: 0,
  sprite: new Image(),
};

// Load NPC sprite
npc.sprite.src = "npc3.png"; // Replace with the path to your NPC sprite

// Debug menu state
let debugMenuVisible = false;
let miniMapVisible = false;
let collisionEnabled = true; // Toggle collision detection
let showFPS = false; // Toggle FPS display
let frameCount = 0;
let fps = 0;
let lastTime = performance.now();

// Draw the game
function render() {
  // Clear the canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cast rays
  for (let rayAngle = player.angle - FOV / 2; rayAngle < player.angle + FOV / 2; rayAngle += RESOLUTION) {
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);

    let rayX = player.x;
    let rayY = player.y;
    let rayLength = 0;

    // Cast the ray until it hits a wall
    while (rayLength < 20) {
      rayX += rayDirX * 0.01;
      rayY += rayDirY * 0.01;
      rayLength += 0.01;

      if (map[Math.floor(rayY)][Math.floor(rayX)] === 1) {
        break;
      }
    }

    // Fish-eye correction
    const distance = rayLength * Math.cos(rayAngle - player.angle);

    // Wall height and shading
    const wallHeight = (canvas.height / distance) * WALL_HEIGHT;
    const brightness = Math.max(0, 255 - distance * 20);
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

    // Draw the wall slice
    ctx.fillRect(
      ((rayAngle - (player.angle - FOV / 2)) / FOV) * canvas.width,
      (canvas.height - wallHeight) / 2,
      (RESOLUTION / FOV) * canvas.width,
      wallHeight
    );
  }

  // Draw NPC sprite (if not occluded by walls)
  drawNPC();

  // Draw NPC message
  if (npc.messageTimer > 0) {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(npc.message, canvas.width / 2 - 50, canvas.height - 50);
    npc.messageTimer -= 1 / 60; // Decrease timer
  }

  // Draw mini-map if enabled
  if (miniMapVisible) {
    drawMiniMap();
  }

  // Draw debug menu if enabled
  if (debugMenuVisible) {
    drawDebugMenu();
  }

  // Draw FPS if enabled
  if (showFPS) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 80, 20);

    ctx.fillStyle = "skyblue";
    ctx.font = "14px Arial";
    ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 20);
  }
}

// Draw NPC sprite
function drawNPC() {
    // Calculate NPC position relative to player
    const dx = npc.x - player.x;
    const dy = npc.y - player.y;
  
    // Calculate distance and angle to NPC
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) - player.angle;
  
    // Check if NPC is within FOV and not too close
    if (Math.abs(angle) < FOV / 2 && distance > 0.5) {
      // Check if the NPC is occluded by walls
      let rayX = player.x;
      let rayY = player.y;
      let rayLength = 0;
      const rayDirX = Math.cos(angle + player.angle);
      const rayDirY = Math.sin(angle + player.angle);
  
      // Cast a ray toward the NPC
      while (rayLength < distance) {
        rayX += rayDirX * 0.01;
        rayY += rayDirY * 0.01;
        rayLength += 0.01;
  
        // If the ray hits a wall before reaching the NPC, stop drawing
        if (map[Math.floor(rayY)][Math.floor(rayX)] === 1) {
          return;
        }
      }
  
      // Calculate screen position
      const screenX = (angle / FOV) * canvas.width + canvas.width / 2;
      const spriteHeight = (canvas.height / distance) * WALL_HEIGHT;
  
      // Preserve aspect ratio of the sprite
      const spriteWidth = spriteHeight * (npc.sprite.width / npc.sprite.height);
  
      // Draw NPC sprite
      ctx.drawImage(
        npc.sprite,
        screenX - spriteWidth / 2, // Center the sprite horizontally
        (canvas.height - spriteHeight) / 2,
        spriteWidth,
        spriteHeight
      );
    }
  }

// Draw mini-map
function drawMiniMap() {
  const miniMapSize = 150;
  const cellSize = miniMapSize / map.length;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, miniMapSize, miniMapSize);

  // Draw walls
  ctx.fillStyle = "white";
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === 1) {
        ctx.fillRect(10 + x * cellSize, 10 + y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Draw player
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(10 + player.x * cellSize, 10 + player.y * cellSize, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw NPC
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(10 + npc.x * cellSize, 10 + npc.y * cellSize, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw rays
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.moveTo(10 + player.x * cellSize, 10 + player.y * cellSize);
  for (let rayAngle = player.angle - FOV / 2; rayAngle < player.angle + FOV / 2; rayAngle += RESOLUTION) {
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    ctx.lineTo(10 + (player.x + rayDirX * 5) * cellSize, 10 + (player.y + rayDirY * 5) * cellSize);
  }
  ctx.stroke();
}

// Draw debug menu
function drawDebugMenu() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(10, canvas.height - 160, 250, 150);

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText("Debug Menu (ESC to close)", 20, canvas.height - 140);
  ctx.fillText(`Player: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})`, 20, canvas.height - 120);
  ctx.fillText(`Angle: ${(player.angle * 180 / Math.PI).toFixed(1)}°`, 20, canvas.height - 100);
  ctx.fillText(`NPC: (${npc.x.toFixed(2)}, ${npc.y.toFixed(2)})`, 20, canvas.height - 80);
  ctx.fillText(`Speed: ${SPEED.toFixed(2)} (Up/Down to adjust)`, 20, canvas.height - 60);
  ctx.fillText(`FOV: ${(FOV * 180 / Math.PI).toFixed(1)}° (Left/Right to adjust)`, 20, canvas.height - 40);
  ctx.fillText(`Collision: ${collisionEnabled ? "ON" : "OFF"} (C to toggle)`, 20, canvas.height - 20);
}

// Handle player movement
function movePlayer() {
  const moveX = Math.cos(player.angle) * SPEED;
  const moveY = Math.sin(player.angle) * SPEED;

  if (keys["w"]) {
    if (!collisionEnabled || map[Math.floor(player.y + moveY)][Math.floor(player.x + moveX)] === 0) {
      player.x += moveX;
      player.y += moveY;
    }
  }
  if (keys["s"]) {
    if (!collisionEnabled || map[Math.floor(player.y - moveY)][Math.floor(player.x - moveX)] === 0) {
      player.x -= moveX;
      player.y -= moveY;
    }
  }
  if (keys["a"]) player.angle -= TURN_SPEED;
  if (keys["d"]) player.angle += TURN_SPEED;

  // Adjust speed and FOV in debug mode
  if (debugMenuVisible) {
    if (keys["ArrowUp"]) SPEED += 0.01;
    if (keys["ArrowDown"]) SPEED -= 0.01;
    if (keys["ArrowLeft"]) FOV = Math.max(0.1, FOV - 0.05);
    if (keys["ArrowRight"]) FOV = Math.min(Math.PI, FOV + 0.05);
  }

  // Check for NPC interaction
  const distanceToNPC = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
  if (distanceToNPC < 1 && keys["x"]) {
    npc.message = "You found me!!";
    npc.messageTimer = 3; // Show message for 3 seconds
  }
}

// Handle map editing
canvas.addEventListener("click", (e) => {
  if (debugMenuVisible) {
    const miniMapSize = 150;
    const cellSize = miniMapSize / map.length;
    const x = Math.floor((e.offsetX - 10) / cellSize);
    const y = Math.floor((e.offsetY - 10) / cellSize);

    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
      map[y][x] = map[y][x] === 1 ? 0 : 1;
    }
  }
});

// Keyboard input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "Escape") debugMenuVisible = !debugMenuVisible;
  if (e.key === "m") miniMapVisible = !miniMapVisible;
  if (e.key === "c") collisionEnabled = !collisionEnabled; // Toggle collision
  if (e.key === "r") { // Reset player position
    player.x = 1.5;
    player.y = 1.5;
    player.angle = 0;
  }
  if (e.key === "f") showFPS = !showFPS; // Toggle FPS display
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Calculate FPS
function updateFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
  }
}

// Game loop
function gameLoop() {
  updateFPS();
  movePlayer();
  render();
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();