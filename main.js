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
const SLIDE_SPEED_MULTIPLIER = 0.7; // Speed multiplier when sliding along walls

// NPC movement settings
let npcMoveTimer = 0;
const NPC_MOVE_INTERVAL = 0.5;
const NPC_MOVE_SPEED = 0.02;
let npcTargetX = 0;
let npcTargetY = 0;
let npcDirection = 0;
let npcIsResting = false;
let npcRestTimer = 0;
const NPC_REST_DURATION = 30;
const NPC_MOVE_DURATION = 15;
let npcPath = [];
let npcState = 'exploring'; // Can be: 'exploring', 'resting', 'investigating'
let npcLastKnownPlayerPos = null;
const NPC_INVESTIGATE_DISTANCE = 5;
const NPC_FORGET_TIME = 10;
let npcForgetTimer = 0;

// Game map (1 = wall, 0 = empty space)
let currentRoom = 0;
let rooms = [
    // Room 0 - Starting room
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Room 1 - Garden
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Room 2 - Maze
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Room 3 - Speed Test
    [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
];

// Player starting position and angle
let player = {
  x: 1.5,
  y: 1.5,
  angle: 0,
  height: 0,        // Current height above ground
  verticalSpeed: 0, // Vertical velocity
  isJumping: false
};

// NPC
let npc = {
  x: 5.5,
  y: 5.5,
  message: "",
  messageTimer: 0,
  sprite: new Image(),
  isVisible: true,
  isPunched: false, // Add punched state
  punchTimer: 0, // Add punch animation timer
};

// Dialogue menu state
let dialogueMenuVisible = false;
let dialogueOptions = [
  { text: "Say Hi", action: () => { npc.message = "Hey hows it going!"; npc.messageTimer = 3; dialogueMenuVisible = false; } },
  { text: "Kiss", action: () => { npc.message = "*Smooch*"; npc.messageTimer = 3; dialogueMenuVisible = false; } },
  { text: "Punch", action: () => { 
    npc.isPunched = true;
    npc.punchTimer = 1;
    npc.message = "";
    dialogueMenuVisible = false;
  } },
  { text: "Leave", action: () => { npc.message = "Okay cya later!"; npc.messageTimer = 3; dialogueMenuVisible = false; } }
];
let selectedOption = 0;
let lastMenuKeyPress = 0; // Add cooldown for menu navigation
const MENU_KEY_COOLDOWN = 150; // Cooldown in milliseconds

// Load NPC sprite
npc.sprite.src = "ethan-removebg-preview.png "; // Replace with the path to your NPC sprite

// Debug menu state
let debugMenuVisible = false;
let miniMapVisible = false;
let collisionEnabled = true; // Toggle collision detection
let showFPS = false; // Toggle FPS display
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();
let lastTime = performance.now();

// Audio state
let audioElement = null;

// Add these variables at the top with other game state variables
let rayHitInfo = [];
let zBuffer = [];
let spriteRenderInfo = [];
let showMapOverlay = false;
let rayHitBlocks = new Set(); // Store all hit blocks as "x,y" strings
let highlightedBlock = null;

// Add this at the top with other game state variables
let customFont = new FontFace('Earthbound', 'url(earthbound.otf.woff2)');
customFont.load().then(() => {
    document.fonts.add(customFont);
});

// Add these variables at the top with other game settings
const JUMP_FORCE = 0.08;
const GRAVITY_UP = -0.001;
const GRAVITY_DOWN = -0.0018;
const MAX_JUMP_HEIGHT = 0.6;
const MIN_JUMP_HEIGHT = 0.15;
const JUMP_CHARGE_RATE = 0.05;
const SHORT_HOP_WINDOW = 0.15; // Time window for short hop in seconds
let jumpCharge = 0;
let jumpPressedLastFrame = false;
let jumpStartTime = 0;

// Add these variables at the top with other game settings
const TARGET_FPS = 120;
const FRAME_TIME = 1000 / TARGET_FPS; // Time per frame in milliseconds
let lastFrameTime = performance.now();

// Add these variables at the top with other game settings
const ACCELERATION = 0.15; // How quickly the player accelerates
const FRICTION = 0.1; // How quickly the player slows down
const MAX_SPEED = 0.06; // Reduced maximum movement speed
let playerVelocity = { x: 0, y: 0 }; // Track player's current velocity
let mouseLookEnabled = false; // Track if mouse look is enabled
let MOUSE_SENSITIVITY = 0.003; // Mouse look sensitivity (now adjustable)
const CAMERA_ACCELERATION = 0.2; // How quickly the camera accelerates
const CAMERA_FRICTION = 0.1; // How quickly the camera slows down
let cameraVelocity = { x: 0, y: 0 }; // Track camera rotation velocity (now 2D)
const MIN_SENSITIVITY = 0.001; // Minimum sensitivity
const MAX_SENSITIVITY = 0.01; // Maximum sensitivity
const SENSITIVITY_STEP = 0.0005; // How much to change sensitivity by
const MAX_VERTICAL_ANGLE = Math.PI / 4; // Maximum vertical look angle (45 degrees)
let verticalAngle = 0; // Track vertical camera angle

// Function to initialize audio
function initAudio() {
    if (!audioElement) {
        audioElement = new Audio('start.mp3');
        audioElement.loop = true;
        console.log('Audio initialized successfully');
    }
}

// Function to play audio with fade in
function playAudioWithFadeIn() {
    if (!audioElement) {
        initAudio();
    }

    // Start with volume at 0
    audioElement.volume = 0;
    
    // Play the audio
    audioElement.play();
    
    // Fade in over 0.5 seconds
    const fadeInDuration = 0.5;
    const fadeInSteps = 50;
    const volumeStep = 1 / fadeInSteps;
    const timeStep = fadeInDuration / fadeInSteps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
        currentStep++;
        audioElement.volume = Math.min(1, currentStep * volumeStep);
        if (currentStep >= fadeInSteps) {
            clearInterval(fadeInterval);
        }
    }, timeStep * 1000);
}

// Function to fade out audio
function fadeOutAudio() {
    if (!audioElement) return;

    const fadeOutDuration = 1;
    const fadeOutSteps = 50;
    const volumeStep = 1 / fadeOutSteps;
    const timeStep = fadeOutDuration / fadeOutSteps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
        currentStep++;
        audioElement.volume = Math.max(0, 1 - (currentStep * volumeStep));
        if (currentStep >= fadeOutSteps) {
            clearInterval(fadeInterval);
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }, timeStep * 1000);
}

// Draw the game
function render() {
    // Clear previous debug info
    rayHitInfo = [];
    zBuffer = [];
    spriteRenderInfo = [];
    rayHitBlocks.clear();

    // Clear the canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor and ceiling
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;
    
    for (let y = screenHeight / 2; y < screenHeight; y++) {
        // Ray angle for this screen y coordinate
        const rayDirY = (y - screenHeight / 2) / (screenHeight / 2);
        const cameraZ = screenHeight / 2 / Math.tan(verticalAngle + Math.PI/4) * 1.5; // Increased camera distance
        
        // Calculate ray direction in world space
        for (let x = 0; x < screenWidth; x++) {
            const rayDirX = (x - screenWidth / 2) / screenWidth;
            
            // Calculate the ray's position and direction
            const rayDirLength = Math.sqrt(rayDirX * rayDirX + rayDirY * rayDirY);
            const floorX = player.x + rayDirX * cameraZ / rayDirLength;
            const floorY = player.y + rayDirY * cameraZ / rayDirLength;
            
            // Get the floor tile
            const cellX = Math.floor(floorX);
            const cellY = Math.floor(floorY);
            
            // Draw floor pixel
            if (cellX >= 0 && cellX < rooms[currentRoom][0].length && 
                cellY >= 0 && cellY < rooms[currentRoom].length) {
                // Floor color (darker)
                ctx.fillStyle = `rgb(40, 40, 40)`;
                ctx.fillRect(x, y, 1, 1);
                
                // Ceiling color (slightly lighter)
                ctx.fillStyle = `rgb(60, 60, 60)`;
                ctx.fillRect(x, screenHeight - y, 1, 1);
            }
        }
    }

    // Cast rays for walls
    let rayIndex = 0;
    for (let rayAngle = player.angle - FOV / 2; rayAngle < player.angle + FOV / 2; rayAngle += RESOLUTION) {
        const rayDirX = Math.cos(rayAngle);
        const rayDirY = Math.sin(rayAngle);

        let rayX = player.x;
        let rayY = player.y;
        let rayLength = 0;
        let hitWall = false;

        while (rayLength < 20 && !hitWall) {
            rayX += rayDirX * 0.01;
            rayY += rayDirY * 0.01;
            rayLength += 0.01;

            const blockX = Math.floor(rayX);
            const blockY = Math.floor(rayY);

            rayHitBlocks.add(`${blockX},${blockY}`);

            if (rooms[currentRoom][blockY][blockX] === 1) {
                hitWall = true;
                rayHitInfo.push({
                    x: rayX,
                    y: rayY,
                    distance: rayLength,
                    column: rayIndex,
                    angle: rayAngle
                });
            }
        }

        // Fish-eye correction
        const distance = rayLength * Math.cos(rayAngle - player.angle);
        zBuffer[rayIndex] = distance;

        // Wall height and shading
        const wallHeight = (canvas.height / distance) * WALL_HEIGHT;
        const brightness = Math.max(0, 255 - distance * 20);
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

        // Calculate vertical offset based on vertical angle and player height
        const verticalShift = Math.tan(verticalAngle) * canvas.height;
        const heightOffset = player.height * (canvas.height / distance);
        
        // Draw wall slice with vertical offset and height
        ctx.fillRect(
            ((rayAngle - (player.angle - FOV / 2)) / FOV) * canvas.width,
            (canvas.height - wallHeight) / 2 + verticalShift - heightOffset,
            (RESOLUTION / FOV) * canvas.width,
            wallHeight
        );
        rayIndex++;
    }

    // Draw NPC sprite
    drawNPC();

    // Draw NPC message
    if (npc.messageTimer > 0) {
        // Calculate text width for box sizing
        ctx.font = "20px Arial";
        const textWidth = ctx.measureText(npc.message).width;
        const boxWidth = textWidth + 40;
        const boxHeight = 40;
        const boxX = canvas.width / 2 - boxWidth / 2;
        const boxY = canvas.height - 70;

        // Draw black box background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw white border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = "white";
        ctx.fillText(npc.message, canvas.width / 2 - textWidth / 2, canvas.height - 45);
        
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

    // Draw dialogue menu if visible
    if (dialogueMenuVisible) {
        drawDialogueMenu();
    }

    // Draw FPS if enabled
    if (showFPS) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(5, 5, 80, 20);

        ctx.fillStyle = "skyblue";
        ctx.font = "14px Arial";
        ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 20);
    }

    // Draw map overlay if enabled
    drawMapOverlay();
}

// Draw NPC sprite
function drawNPC() {
    if (!npc.isVisible) return; // Don't draw if NPC is not visible
    
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
        if (rooms[currentRoom][Math.floor(rayY)][Math.floor(rayX)] === 1) {
          return;
        }
      }
  
      // Calculate screen position
      const screenX = (angle / FOV) * canvas.width + canvas.width / 2;
      const spriteHeight = (canvas.height / distance) * WALL_HEIGHT;
  
      // Preserve aspect ratio of the sprite
      const spriteWidth = spriteHeight * (npc.sprite.width / npc.sprite.height);
  
      // Draw NPC sprite
      ctx.save();
      if (npc.isPunched) {
        ctx.filter = 'brightness(200%) saturate(200%) hue-rotate(0deg)';
      }
      ctx.drawImage(
        npc.sprite,
        screenX - spriteWidth / 2,
        (canvas.height - spriteHeight) / 2,
        spriteWidth,
        spriteHeight
      );
      ctx.restore();
    }
}

// Draw dialogue menu
function drawDialogueMenu() {
    const menuWidth = 200;
    const menuHeight = 250;
    const menuX = canvas.width / 2 - menuWidth / 2;
    const menuY = canvas.height / 2 - menuHeight / 2;

    // Draw menu background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Draw border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Draw title
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Talk to NPC", menuX + 10, menuY + 30);

    // Draw options
    ctx.font = "16px Arial";
    dialogueOptions.forEach((option, index) => {
        ctx.fillStyle = index === selectedOption ? "yellow" : "white";
        ctx.fillText(option.text, menuX + 20, menuY + 60 + index * 30);
    });
}

// Draw mini-map
function drawMiniMap() {
  const miniMapSize = 150;
  const cellSize = miniMapSize / rooms[currentRoom].length;
    const mapWidth = rooms[currentRoom][0].length * cellSize;
    const mapHeight = rooms[currentRoom].length * cellSize;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, 10, mapWidth, mapHeight);

  // Draw walls
  ctx.fillStyle = "white";
  for (let y = 0; y < rooms[currentRoom].length; y++) {
    for (let x = 0; x < rooms[currentRoom][y].length; x++) {
      if (rooms[currentRoom][y][x] === 1) {
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

// Update the drawDebugMenu function
function drawDebugMenu() {
    // Define the lines for the left box
    const leftBoxLines = [
        "Debug Menu (ESC to close)",
        `Player: (${player.x.toFixed(2)}, ${player.y.toFixed(2)})`,
        `Angle: ${((player.angle * 180 / Math.PI + 360) % 360).toFixed(1)}°`,
        `Vertical: ${(verticalAngle * 180 / Math.PI).toFixed(1)}°`,
        `FPS: ${fps}`,
        `Speed: ${(Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.y * playerVelocity.y) * 100).toFixed(1)} pixels/s`,
        `Collisions: ${collisionEnabled ? "ON" : "OFF"}`,
        `Controls: ${mouseLookEnabled ? "Mouse" : "Keyboard"}`,
        `Sensitivity: ${(MOUSE_SENSITIVITY * 1000).toFixed(1)}`,
        "",
        "Controls:",
        "WASD: Move",
        "Space: Jump",
        "M: Minimap, C: Collision",
        "\\: Map Overlay",
        "=: Toggle Mouse Look",
        "↑/↓: Adjust Sensitivity"
    ];
    const rightBoxLines = 14; // Keep as before for right box
    
    const fontSize = 16;
    const lineHeight = fontSize * 1.4; // More generous line height
    const padding = 18;
    const menuWidth = 270;
    const leftBoxHeight = (leftBoxLines.length * lineHeight) + (padding * 2);
    const rightBoxHeight = (rightBoxLines * lineHeight) + (padding * 2);
    const startX = 10;
    const startY = canvas.height - leftBoxHeight - 10;
    const rightBoxX = canvas.width - menuWidth - 10;
    const rightBoxY = canvas.height - rightBoxHeight - 10;

    // Draw left menu background (basic info)
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(startX, startY, menuWidth, leftBoxHeight);

    // Draw right menu background (raycasting and NPC info)
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(rightBoxX, rightBoxY, menuWidth, rightBoxHeight);

    // Draw borders
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, menuWidth, leftBoxHeight);
    ctx.strokeRect(rightBoxX, rightBoxY, menuWidth, rightBoxHeight);

    // Set font with lighter weight
    ctx.font = `${fontSize}px Earthbound, monospace`;
    ctx.fillStyle = "white";
    let yOffset = startY + padding + fontSize; // Start after padding

    // Draw each line for the left box
    for (const line of leftBoxLines) {
        ctx.fillText(line, startX + 10, yOffset);
        yOffset += lineHeight;
    }

    // Right box - Ray casting and NPC info (unchanged)
    yOffset = rightBoxY + padding + fontSize;
    ctx.font = `${fontSize}px Earthbound, monospace`;
    ctx.fillStyle = "white";
    ctx.fillText("Ray Casting Info:", rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    if (rayHitInfo.length > 0) {
        const centerRay = Math.floor(rayHitInfo.length / 2);
        const hit = rayHitInfo[centerRay];
        ctx.fillText(`Center Ray Hit: (${hit.x.toFixed(2)}, ${hit.y.toFixed(2)})`, rightBoxX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Distance: ${hit.distance.toFixed(2)}`, rightBoxX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Column: ${hit.column}`, rightBoxX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Angle: ${(hit.angle * 180 / Math.PI).toFixed(1)}°`, rightBoxX + 10, yOffset);
    }
    yOffset += lineHeight;
    ctx.fillText("Z-Buffer Info:", rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    if (zBuffer.length > 0) {
        const centerZ = zBuffer[Math.floor(zBuffer.length / 2)];
        ctx.fillText(`Center Z: ${centerZ.toFixed(2)}`, rightBoxX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Min Z: ${Math.min(...zBuffer).toFixed(2)}`, rightBoxX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Max Z: ${Math.max(...zBuffer).toFixed(2)}`, rightBoxX + 10, yOffset);
    }
    yOffset += lineHeight * 2;
    ctx.fillText("NPC Info:", rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`Position: (${npc.x.toFixed(2)}, ${npc.y.toFixed(2)})`, rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`State: ${npcState}`, rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`Visible: ${npc.isVisible}`, rightBoxX + 10, yOffset);
    yOffset += lineHeight;
    if (npcLastKnownPlayerPos) {
        ctx.fillText(`Last Player Pos: (${npcLastKnownPlayerPos.x.toFixed(2)}, ${npcLastKnownPlayerPos.y.toFixed(2)})`, rightBoxX + 10, yOffset);
    }
}

// Update the drawMapOverlay function
function drawMapOverlay() {
    if (!showMapOverlay) return;

    // Set font and style
    ctx.font = "16px monospace";
    const lineHeight = 24;
    let yOffset = 40;

    // Draw room title
    ctx.fillStyle = "rgb(87, 231, 246)";  // Light blue comment color
    ctx.fillText(`// Room ${currentRoom} - ${currentRoom === 0 ? "Starting room" : currentRoom === 1 ? "Garden" : currentRoom === 2 ? "Maze" : "Speed Test"}`, 40, yOffset);
    yOffset += lineHeight;

    // Opening bracket
    ctx.fillStyle = "white";
    ctx.fillText("[", 40, yOffset);
    yOffset += lineHeight;

    // Draw the map matrix
    rooms[currentRoom].forEach((row, rowIndex) => {
        let line = "    [";  // 4 spaces for indentation
        row.forEach((cell, colIndex) => {
            // Check if this block is being hit by any ray
            const isHit = rayHitBlocks.has(`${colIndex},${rowIndex}`);
            ctx.fillStyle = isHit ? "yellow" : "rgb(209, 105, 105)"; // Yellow for hit blocks, red for others

            // Add the cell value and comma
            line += cell;
            if (colIndex < row.length - 1) {
                line += ", ";
            }
        });
        line += "],";

        // Draw brackets and commas in white
        ctx.fillStyle = "white";
        ctx.fillText(line, 40, yOffset);
        yOffset += lineHeight;
    });

    // Closing bracket
  ctx.fillStyle = "white";
    ctx.fillText("],", 40, yOffset);
}

// Handle player movement
function movePlayer() {
    // Handle sensitive jumping physics
    if (player.height > 0 || player.verticalSpeed !== 0) {
        // If space is held and still rising, use floaty gravity; if released or falling, use stronger gravity
        if (keys[" "] && player.verticalSpeed > 0) {
            player.verticalSpeed += GRAVITY_UP;
        } else {
            player.verticalSpeed += GRAVITY_DOWN;
        }
        player.height += player.verticalSpeed; // Normal height change
        
        // Ground collision
        if (player.height <= 0) {
            player.height = 0;
            player.verticalSpeed = 0;
            player.isJumping = false;
            jumpCharge = 0;
            jumpStartTime = 0;
        }
        // Ceiling collision
        if (player.height >= MAX_JUMP_HEIGHT) {
            player.height = MAX_JUMP_HEIGHT;
            player.verticalSpeed = 0;
        }
    }

    // Handle jump with space (on press, not release)
    if (keys[" "] && !jumpPressedLastFrame && !player.isJumping && player.height === 0) {
        player.verticalSpeed = JUMP_FORCE; // Normal jump force
        player.isJumping = true;
        jumpCharge = MIN_JUMP_HEIGHT;
        jumpStartTime = performance.now() / 1000;
    }
    
    // Increase jump height while space is held
    if (keys[" "] && player.isJumping && player.verticalSpeed > 0) {
        const currentTime = performance.now() / 1000;
        const timeHeld = currentTime - jumpStartTime;
        
        // More gradual height increase during short hop window
        if (timeHeld < SHORT_HOP_WINDOW) {
            jumpCharge += JUMP_CHARGE_RATE * 0.5;
        } else {
            jumpCharge += JUMP_CHARGE_RATE;
        }
        
        if (jumpCharge > MAX_JUMP_HEIGHT) jumpCharge = MAX_JUMP_HEIGHT;
        
        // Smooth transition between min and max jump height
        const jumpProgress = (jumpCharge - MIN_JUMP_HEIGHT) / (MAX_JUMP_HEIGHT - MIN_JUMP_HEIGHT);
        player.verticalSpeed = JUMP_FORCE * (MIN_JUMP_HEIGHT + (MAX_JUMP_HEIGHT - MIN_JUMP_HEIGHT) * jumpProgress) / MAX_JUMP_HEIGHT;
    }
    
    jumpPressedLastFrame = keys[" "];

    if (dialogueMenuVisible) {
        const currentTime = performance.now();
        // Handle menu navigation with cooldown
        if (keys["ArrowUp"] && currentTime - lastMenuKeyPress > MENU_KEY_COOLDOWN) {
            selectedOption = (selectedOption - 1 + dialogueOptions.length) % dialogueOptions.length;
            lastMenuKeyPress = currentTime;
        }
        if (keys["ArrowDown"] && currentTime - lastMenuKeyPress > MENU_KEY_COOLDOWN) {
            selectedOption = (selectedOption + 1) % dialogueOptions.length;
            lastMenuKeyPress = currentTime;
        }
        if (keys["Enter"]) {
            dialogueOptions[selectedOption].action();
            fadeOutAudio();
        }
        if (keys["Escape"]) {
            dialogueMenuVisible = false;
            fadeOutAudio();
        }
        return; // Don't allow movement while menu is open
    }

    // Handle smooth movement with acceleration and friction
    if (collisionEnabled) {
        // Calculate desired movement direction
        let desiredVelocityX = 0;
        let desiredVelocityY = 0;
        
        if (keys["w"]) {
            desiredVelocityX += Math.cos(player.angle) * SPEED;
            desiredVelocityY += Math.sin(player.angle) * SPEED;
        }
        if (keys["s"]) {
            desiredVelocityX -= Math.cos(player.angle) * SPEED;
            desiredVelocityY -= Math.sin(player.angle) * SPEED;
        }

        // Apply acceleration
        if (desiredVelocityX !== 0 || desiredVelocityY !== 0) {
            // Normalize desired velocity
            const length = Math.sqrt(desiredVelocityX * desiredVelocityX + desiredVelocityY * desiredVelocityY);
            desiredVelocityX = (desiredVelocityX / length) * MAX_SPEED;
            desiredVelocityY = (desiredVelocityY / length) * MAX_SPEED;

            // Accelerate towards desired velocity
            playerVelocity.x += (desiredVelocityX - playerVelocity.x) * ACCELERATION;
            playerVelocity.y += (desiredVelocityY - playerVelocity.y) * ACCELERATION;
        } else {
            // Apply friction when no movement keys are pressed
            playerVelocity.x *= (1 - FRICTION);
            playerVelocity.y *= (1 - FRICTION);
            
            // Stop completely when velocity is very small
            if (Math.abs(playerVelocity.x) < 0.001) playerVelocity.x = 0;
            if (Math.abs(playerVelocity.y) < 0.001) playerVelocity.y = 0;
        }

        // Try to move with current velocity
        if (playerVelocity.x !== 0 || playerVelocity.y !== 0) {
            const newX = player.x + playerVelocity.x;
            const newY = player.y + playerVelocity.y;
            const mapX = Math.floor(newX);
            const mapY = Math.floor(newY);
            
            // Check for collisions
            if (mapX >= 1 && mapX < rooms[currentRoom][0].length - 1 &&
                mapY >= 1 && mapY < rooms[currentRoom].length - 1 &&
                rooms[currentRoom][mapY][mapX] === 0) {
                player.x = newX;
                player.y = newY;
            } else {
                // If collision occurs, try sliding
                const slideX = playerVelocity.x * SLIDE_SPEED_MULTIPLIER;
                const slideY = playerVelocity.y * SLIDE_SPEED_MULTIPLIER;
                
                // Try X slide first
                const newSlideX = player.x + slideX;
                const slideMapX = Math.floor(newSlideX);
                const slideMapY = Math.floor(player.y);
                
                if (slideMapX >= 1 && slideMapX < rooms[currentRoom][0].length - 1 &&
                    slideMapY >= 1 && slideMapY < rooms[currentRoom].length - 1 &&
                    rooms[currentRoom][slideMapY][slideMapX] === 0) {
                    player.x = newSlideX;
                } else {
                    // If X slide failed, try Y slide
                    const newSlideY = player.y + slideY;
                    const slideMapX2 = Math.floor(player.x);
                    const slideMapY2 = Math.floor(newSlideY);
                    
                    if (slideMapX2 >= 1 && slideMapX2 < rooms[currentRoom][0].length - 1 &&
                        slideMapY2 >= 1 && slideMapY2 < rooms[currentRoom].length - 1 &&
                        rooms[currentRoom][slideMapY2][slideMapX2] === 0) {
                        player.y = newSlideY;
                    }
                }
                
                // Reduce velocity when hitting walls
                playerVelocity.x *= 0.5;
                playerVelocity.y *= 0.5;
            }
        }
    } else {
        // No collision - move freely with acceleration
        if (keys["w"]) {
            playerVelocity.x += Math.cos(player.angle) * SPEED * ACCELERATION;
            playerVelocity.y += Math.sin(player.angle) * SPEED * ACCELERATION;
        }
        if (keys["s"]) {
            playerVelocity.x -= Math.cos(player.angle) * SPEED * ACCELERATION;
            playerVelocity.y -= Math.sin(player.angle) * SPEED * ACCELERATION;
        }
        
        // Apply friction
        playerVelocity.x *= (1 - FRICTION);
        playerVelocity.y *= (1 - FRICTION);
        
        // Move player
        player.x += playerVelocity.x;
        player.y += playerVelocity.y;
    }

    if (keys["a"]) player.angle -= TURN_SPEED;
    if (keys["d"]) player.angle += TURN_SPEED;

    // Adjust speed and FOV in debug mode
    if (debugMenuVisible) {
        if (keys["ArrowUp"]) SPEED += 0.01;
        if (keys["ArrowDown"]) SPEED -= 0.01;
        if (keys["ArrowLeft"]) FOV = Math.max(0.1, FOV - 0.05);
        if (keys["ArrowRight"]) FOV = Math.min(Math.PI, FOV + 0.05);
        if (keys["1"]) switchRoom(0);
        if (keys["2"]) switchRoom(1);
        if (keys["3"]) switchRoom(2);
        if (keys["4"]) switchRoom(3);
    }

    // Check for NPC interaction
    const distanceToNPC = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
    if (distanceToNPC < 1 && keys["x"] && npc.isVisible) {
        dialogueMenuVisible = true;
        selectedOption = 0;
        playAudioWithFadeIn();
    }
}

// Handle map editing
canvas.addEventListener("click", (e) => {
  if (debugMenuVisible) {
    const miniMapSize = 150;
    const cellSize = miniMapSize / rooms[currentRoom].length;
    const x = Math.floor((e.offsetX - 10) / cellSize);
    const y = Math.floor((e.offsetY - 10) / cellSize);

    if (x >= 0 && x < rooms[currentRoom][0].length && y >= 0 && y < rooms[currentRoom].length) {
      rooms[currentRoom][y][x] = rooms[currentRoom][y][x] === 1 ? 0 : 1;
    }
  }
});

// Keyboard input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "Escape") {
    debugMenuVisible = !debugMenuVisible;
    if (mouseLookEnabled) {
      mouseLookEnabled = false;
      document.exitPointerLock();
      cameraVelocity = { x: 0, y: 0 }; // Reset camera velocity
      verticalAngle = 0; // Reset vertical angle
    }
  }
  if (e.key === "m") miniMapVisible = !miniMapVisible;
  if (e.key === "c") collisionEnabled = !collisionEnabled;
  if (e.key === "\\") showMapOverlay = !showMapOverlay;
  if (e.key === "=") {
    mouseLookEnabled = !mouseLookEnabled;
    if (mouseLookEnabled) {
      canvas.requestPointerLock();
    } else {
      document.exitPointerLock();
      cameraVelocity = { x: 0, y: 0 }; // Reset camera velocity
      verticalAngle = 0; // Reset vertical angle
    }
  }
  if (e.key === "r") {
    player.x = 1.5;
    player.y = 1.5;
    player.angle = 0;
    cameraVelocity = { x: 0, y: 0 }; // Reset camera velocity
    verticalAngle = 0; // Reset vertical angle
  }
  if (e.key === "f") showFPS = !showFPS;
  
  // Adjust sensitivity in debug menu
  if (debugMenuVisible) {
    if (e.key === "ArrowUp") {
      MOUSE_SENSITIVITY = Math.min(MAX_SENSITIVITY, MOUSE_SENSITIVITY + SENSITIVITY_STEP);
    }
    if (e.key === "ArrowDown") {
      MOUSE_SENSITIVITY = Math.max(MIN_SENSITIVITY, MOUSE_SENSITIVITY - SENSITIVITY_STEP);
    }
  }
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Update the game loop function
function gameLoop() {
    const currentTime = performance.now();
    const elapsed = currentTime - lastFrameTime;
    
    // Only update if enough time has passed for our target FPS
    if (elapsed >= FRAME_TIME) {
        // Calculate actual FPS
        frameCount++;
        if (currentTime - lastFpsUpdate >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsUpdate = currentTime;
        }

        // Apply camera friction
        cameraVelocity.x *= (1 - CAMERA_FRICTION);
        cameraVelocity.y *= (1 - CAMERA_FRICTION);
        
        // Stop camera rotation when velocity is very small
        if (Math.abs(cameraVelocity.x) < 0.0001) cameraVelocity.x = 0;
        if (Math.abs(cameraVelocity.y) < 0.0001) cameraVelocity.y = 0;
        
        // Update player angle with camera velocity
        player.angle += cameraVelocity.x;
        
        // Update vertical angle with limits
        verticalAngle = Math.max(-MAX_VERTICAL_ANGLE, 
                               Math.min(MAX_VERTICAL_ANGLE, 
                                      verticalAngle + cameraVelocity.y));

        // Update game state
        movePlayer();
        moveNPC();
        render();
        
        lastFrameTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Initialize audio when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio context on first user interaction
    const initAudioOnInteraction = () => {
        initAudio();
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('keydown', initAudioOnInteraction);
    };
    
    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);
});

// Function to find valid position
function findValidPosition(startX, startY, maxDistance) {
    const directions = [
        { x: 1, y: 0 },   // right
        { x: 0, y: 1 },   // down
        { x: -1, y: 0 },  // left
        { x: 0, y: -1 }   // up
    ];
    
    // Try each direction
    for (let i = 0; i < directions.length; i++) {
        const dir = directions[i];
        let newX = startX + dir.x;
        let newY = startY + dir.y;
        
        // Check if position is valid and within bounds
        if (newX >= 1 && newX < rooms[currentRoom][0].length - 1 &&
            newY >= 1 && newY < rooms[currentRoom].length - 1 &&
            rooms[currentRoom][Math.floor(newY)][Math.floor(newX)] === 0) {
            return { x: newX, y: newY };
        }
    }
    
    // If no valid position found, return current position
    return { x: startX, y: startY };
}

// Function to get all valid adjacent positions
function getAdjacentPositions(x, y) {
    const directions = [
        { x: 1, y: 0 },   // right
        { x: 0, y: 1 },   // down
        { x: -1, y: 0 },  // left
        { x: 0, y: -1 },  // up
        { x: 1, y: 1 },   // down-right
        { x: -1, y: 1 },  // down-left
        { x: 1, y: -1 },  // up-right
        { x: -1, y: -1 }  // up-left
    ];
    
    const validPositions = [];
    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        
        if (newX >= 1 && newX < rooms[currentRoom][0].length - 1 &&
            newY >= 1 && newY < rooms[currentRoom].length - 1 &&
            rooms[currentRoom][Math.floor(newY)][Math.floor(newX)] === 0) {
            validPositions.push({ x: newX, y: newY });
        }
    }
    return validPositions;
}

// Function to find a path to a target
function findPathToTarget(startX, startY, targetX, targetY) {
    const visited = new Set();
    const queue = [[{ x: startX, y: startY }]];
    
    while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];
        
        if (current.x === targetX && current.y === targetY) {
            return path.slice(1); // Return path excluding start position
        }
        
        const key = `${current.x},${current.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        const adjacent = getAdjacentPositions(current.x, current.y);
        for (const next of adjacent) {
            const newPath = [...path, next];
            queue.push(newPath);
        }
    }
    
    return []; // No path found
}

// Function to choose next target position
function chooseNextTarget(currentX, currentY) {
    const adjacent = getAdjacentPositions(currentX, currentY);
    if (adjacent.length === 0) return { x: currentX, y: currentY };
    
    // If we have a last known player position and we're investigating
    if (npcState === 'investigating' && npcLastKnownPlayerPos) {
        const path = findPathToTarget(currentX, currentY, 
            Math.floor(npcLastKnownPlayerPos.x), 
            Math.floor(npcLastKnownPlayerPos.y));
        if (path.length > 0) {
            return path[0];
        }
    }
    
    // Otherwise choose a random adjacent position
    return adjacent[Math.floor(Math.random() * adjacent.length)];
}

// Function to move NPC
function moveNPC() {
    if (!npc.isVisible) return;

    // Update state timers
    if (npcState === 'resting') {
        npcRestTimer += 1 / 60;
        if (npcRestTimer >= NPC_REST_DURATION) {
            npcState = 'exploring';
            npcRestTimer = 0;
        }
        return;
    } else {
        npcRestTimer += 1 / 60;
        if (npcRestTimer >= NPC_MOVE_DURATION) {
            npcState = 'resting';
            npcRestTimer = 0;
            return;
        }
    }

    // Check if player is nearby
    const distanceToPlayer = Math.sqrt(
        Math.pow(player.x - npc.x, 2) + 
        Math.pow(player.y - npc.y, 2)
    );

    if (distanceToPlayer < NPC_INVESTIGATE_DISTANCE) {
        npcState = 'investigating';
        npcLastKnownPlayerPos = { x: player.x, y: player.y };
        npcForgetTimer = 0;
    } else if (npcState === 'investigating') {
        npcForgetTimer += 1 / 60;
        if (npcForgetTimer >= NPC_FORGET_TIME) {
            npcState = 'exploring';
            npcLastKnownPlayerPos = null;
        }
    }

    // Update movement
    npcMoveTimer += 1 / 60;
    if (npcMoveTimer >= NPC_MOVE_INTERVAL) {
        npcMoveTimer = 0;

        const currentX = Math.floor(npc.x);
        const currentY = Math.floor(npc.y);
        
        const nextPos = chooseNextTarget(currentX, currentY);
        npcTargetX = nextPos.x + 0.5;
        npcTargetY = nextPos.y + 0.5;
    }

    // Move towards target
    if (npcTargetX !== 0 && npcTargetY !== 0) {
        const dx = npcTargetX - npc.x;
        const dy = npcTargetY - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.1) {
            const moveX = (dx / distance) * NPC_MOVE_SPEED;
            const moveY = (dy / distance) * NPC_MOVE_SPEED;

        const newX = npc.x + moveX;
        const newY = npc.y + moveY;
        const mapX = Math.floor(newX);
        const mapY = Math.floor(newY);

            if (mapX >= 1 && mapX < rooms[currentRoom][0].length - 1 &&
                mapY >= 1 && mapY < rooms[currentRoom].length - 1 &&
            rooms[currentRoom][mapY][mapX] === 0) {
            npc.x = newX;
            npc.y = newY;
            } else {
                npcMoveTimer = NPC_MOVE_INTERVAL;
            }
        }
    }
}

// Function to switch rooms
function switchRoom(newRoom) {
    if (newRoom >= 0 && newRoom < rooms.length) {
        currentRoom = newRoom;
        // Reset player position to center of new room
        player.x = rooms[currentRoom][0].length / 2;
        player.y = rooms[currentRoom].length / 2;
        player.angle = 0;
    }
}

// Update the mouse movement handler
document.addEventListener("mousemove", (e) => {
    if (mouseLookEnabled) {
        // Calculate target velocity based on mouse movement
        const targetVelocityX = e.movementX * MOUSE_SENSITIVITY;
        const targetVelocityY = -e.movementY * MOUSE_SENSITIVITY * 0.5; // Inverted vertical movement
        
        // Smoothly accelerate towards target velocity
        cameraVelocity.x += (targetVelocityX - cameraVelocity.x) * CAMERA_ACCELERATION;
        cameraVelocity.y += (targetVelocityY - cameraVelocity.y) * CAMERA_ACCELERATION;
    }
});