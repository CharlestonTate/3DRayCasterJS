const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game settings
let FOV = Math.PI / 3; // Field of view
let RESOLUTION = 0.01; // Ray resolution
let WALL_HEIGHT = 1; // Height of walls
let SPEED = 0.02; // Player movement speed
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
        [1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
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

// NPC sprite cycling
let npcSprites = []; // Array to hold all NPC images
let currentNpcIndex = 0; // Current NPC sprite index
const npcImagePaths = [
  "npcs/ethan-removebg-preview.png",
  "npcs/ethan.jpg",
  "npcs/npc.png",
  "npcs/npc1.jpg",
  "npcs/npc2.jpg",
  "npcs/npc3.png"
];

// Load all NPC sprites
npcImagePaths.forEach(path => {
  const img = new Image();
  img.src = path;
  npcSprites.push(img);
});

// Set default NPC sprite to ethan-removebg-preview.png (index 0)
npc.sprite = npcSprites[0];

// Gun animation system
let gunState = 'idle'; // 'idle', 'shooting', 'reloading'
let gunFrame = 0;
let gunAnimationTimer = 0;
const GUN_SHOOT_FRAME_TIME = 0.1; // Time per shoot frame (seconds)
const GUN_RELOAD_FRAME_TIME = 0.12; // Time per reload frame (seconds) - slowed down
const GUN_SHOOT_FRAMES = 3; // gun_shoot.png, gun_shoot2.png, gun_shoot.png
const GUN_RELOAD_FRAMES = 14; // gun_reload (2) through (15)
const GUN_SIZE_MULTIPLIER = 0.6; // Easy to adjust gun size (0.3 = 30%, 0.5 = 50%, etc.)

// Ammo system
let ammo = 3; // Starting ammo
const MAX_AMMO = 3; // Maximum ammo capacity

// Gun sound effects
// Multiple shoot sounds for variety
let shootSounds = [
    new Audio('sounds/shotgun1.mp3'),
    new Audio('sounds/shotgun2.mp3')
];
shootSounds.forEach(sound => sound.volume = 0.3);
let emptySound = new Audio('sounds/shotgun_empty.mp3');
emptySound.volume = 0.4;
let reloadSound = new Audio('sounds/shotgun_reload.mp3');
reloadSound.volume = 0.5;
// Multiple shell sounds for variety
let shellSounds = [
    new Audio('sounds/shotgun_shell1.mp3'),
    new Audio('sounds/shotgun_shell2.mp3'),
    new Audio('sounds/shotgun_shell3.mp3')
];
shellSounds.forEach(sound => sound.volume = 0.4);
let shellSoundTimer = 0; // Timer for shell drop sound
const SHELL_SOUND_DELAY = 0.5; // Delay in seconds before shell sound plays

// Gun vibration system (for empty click)
let gunVibrationX = 0;
let gunVibrationY = 0;
let gunVibrationIntensity = 0;
const GUN_VIBRATION_DECAY = 0.85; // How quickly vibration fades
const GUN_VIBRATION_INTENSITY = 8; // Base vibration intensity

// Screen shake system
let screenShakeX = 0;
let screenShakeY = 0;
let screenShakeIntensity = 0;
const SCREEN_SHAKE_DECAY = 0.9; // How quickly shake fades
const SCREEN_SHAKE_INTENSITY = 30; // Base shake intensity

// Debug menu sound and animation
let debugMenuSound = new Audio('sounds/debugStuff.mp3');
debugMenuSound.volume = 0;
let debugMenuSoundTargetVolume = 0.2;
let debugMenuAnimation = 0; // 0 to 1, animation progress
const DEBUG_MENU_ANIMATION_SPEED = 0.08; // How fast panels slide in (slower for smoother transition)
const DEBUG_SOUND_FADE_SPEED = 0.05; // How fast sound fades in/out

// Gun images
let gunIdle = new Image();
gunIdle.src = "gun/gunSRC/gun_idle1.png";

let gunShootFrames = [];
gunShootFrames[0] = new Image();
gunShootFrames[0].src = "gun/gunSRC/gun_shoot.png";
gunShootFrames[1] = new Image();
gunShootFrames[1].src = "gun/gunSRC/gun_shoot2.png";

let gunReloadFrames = [];
for (let i = 2; i <= 15; i++) {
  gunReloadFrames[i - 2] = new Image();
  gunReloadFrames[i - 2].src = `gun/gunSRC/gun_reload (${i}).png`;
}

// Bullet hit range
const BULLET_HIT_RANGE = 8.0; // Maximum range bullets can hit targets

// Hit marker class - stores world position and converts to screen each frame
class HitMarker {
    constructor(x, y, z) {
        this.x = x; // World X position
        this.y = y; // World Y position
        this.z = z; // World Z position (height)
        this.age = 0; // Age of hit marker
        this.lifetime = 1.0; // How long hit marker stays visible (1 second)
        this.active = true;
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }
    }
    
    getOpacity() {
        // Fade out over the last 30% of lifetime
        const fadeStartTime = this.lifetime * 0.7;
        if (this.age > fadeStartTime) {
            return 1 - ((this.age - fadeStartTime) / (this.lifetime - fadeStartTime));
        }
        return 1;
    }
    
    // Convert world position to screen position
    getScreenPosition() {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) - player.angle;
        
        // Normalize angle to -PI to PI
        let normalizedAngle = angle;
        while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
        while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
        
        // Check if within FOV and in front of player
        if (Math.abs(normalizedAngle) < FOV / 2 && distance > 0.1) {
            // Calculate horizontal screen position
            const screenX = (normalizedAngle / FOV) * canvas.width + canvas.width / 2;
            
            // Calculate vertical screen position
            const verticalShift = Math.tan(verticalAngle) * canvas.height;
            const heightOffset = ((this.z - player.height) / distance) * canvas.height * 0.5;
            const screenY = canvas.height / 2 + verticalShift + heightOffset;
            
            return {
                x: screenX,
                y: screenY,
                distance: distance,
                visible: true
            };
        }
        
        return { visible: false };
    }
}

// Array to store active hit markers
let hitMarkers = [];

// Bullet class for future bullet simulation
class Bullet {
    constructor(x, y, angle, verticalAngle = 0) {
        this.x = x; // Starting X position
        this.y = y; // Starting Y position
        this.z = player.height; // Starting Z position (height)
        this.angle = angle; // Horizontal angle (direction)
        this.verticalAngle = verticalAngle; // Vertical angle (up/down)
        this.speed = 0.3; // Bullet speed per frame
        this.lifetime = 2.0; // Time in seconds before bullet despawns
        this.age = 0; // Current age of bullet
        this.damage = 10; // Damage the bullet deals
        this.active = true; // Whether bullet is still active
        this.hasHit = false; // Whether bullet has already hit something
    }
    
    update(deltaTime) {
        if (!this.active || this.hasHit) return;
        
        // Calculate distance from starting position
        const distanceFromStart = Math.sqrt(
            Math.pow(this.x - player.x, 2) + 
            Math.pow(this.y - player.y, 2)
        );
        
        // Check if bullet is within hit range
        if (distanceFromStart > BULLET_HIT_RANGE) {
            this.active = false;
            return;
        }
        
        // Update age
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
            return;
        }
        
        // Move bullet forward in its direction
        const moveX = Math.cos(this.angle) * this.speed;
        const moveY = Math.sin(this.angle) * this.speed;
        const moveZ = Math.sin(this.verticalAngle) * this.speed; // Vertical movement
        
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        const newZ = this.z + moveZ;
        
        // Check for collisions with walls
        const mapX = Math.floor(newX);
        const mapY = Math.floor(newY);
        
        if (mapX >= 0 && mapX < rooms[currentRoom][0].length &&
            mapY >= 0 && mapY < rooms[currentRoom].length) {
            if (rooms[currentRoom][mapY][mapX] === 1) {
                // Hit a wall - deactivate bullet (hit marker already created by instant detection)
                this.hasHit = true;
                this.active = false;
                return;
            }
        }
        
        // Check for collisions with NPC
        if (npc.isVisible) {
            const dx = newX - npc.x;
            const dy = newY - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.5) { // NPC hit radius
                // Hit NPC - deactivate bullet (hit marker already created by instant detection)
                this.hasHit = true;
                this.active = false;
                return;
            }
        }
        
        // Update position if no collision
        this.x = newX;
        this.y = newY;
        this.z = newZ;
        
        // Check if bullet hit ground
        if (this.z <= 0) {
            this.z = 0;
            this.active = false;
        }
    }
    
    // Check if bullet hits a target at given position
    checkHit(targetX, targetY, targetZ = 0, hitRadius = 0.5) {
        const dx = this.x - targetX;
        const dy = this.y - targetY;
        const dz = this.z - targetZ;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < hitRadius;
    }
}

// Array to store active bullets
let bullets = [];

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

// Debug menu state
let debugMenuVisible = false;
let miniMapVisible = false;
let collisionEnabled = true; // Toggle collision detection
let showFPS = true; // Toggle FPS display
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

// Jump physics constants - easily tweakable
const JUMP_FORCE = 0.05; // Initial jump velocity
const GRAVITY_UP = -0.0015; // Gravity when rising (holding space) - lighter
const GRAVITY_DOWN = -0.0025; // Gravity when falling - stronger
const MAX_JUMP_HEIGHT = 0.25; // Maximum jump height
const MIN_JUMP_HEIGHT = 0.15; // Minimum jump height
const JUMP_CHARGE_RATE = 0.03; // How fast jump height increases while holding space
const SHORT_HOP_WINDOW = 0.12; // Time window for short hop in seconds
const SMOOTH_ZONE = 0.08; // Distance from max height where deceleration starts (smaller = smoother)
const JUMP_ACCELERATION = 0.1; // How quickly jump velocity changes
const JUMP_DAMPING = 0.95; // Damping factor for jump smoothness
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
const MAX_SPEED = 0.04; // Reduced maximum movement speed
let playerVelocity = { x: 0, y: 0 }; // Track player's current velocity
let mouseLookEnabled = true; // Track if mouse look is enabled (default: true)
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

    // Clear the canvas (before shake so background always covers)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake for all game elements
    ctx.save();
    ctx.translate(screenShakeX, screenShakeY);

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
        
        // Draw wall slice with vertical offset and height (heightOffset is added to make jump go up)
        ctx.fillRect(
            ((rayAngle - (player.angle - FOV / 2)) / FOV) * canvas.width,
            (canvas.height - wallHeight) / 2 + verticalShift + heightOffset,
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
    
    // Draw gun
    drawGun();
    
    // Draw crosshair
    drawCrosshair();
    
    // Draw ammo count
    drawAmmo();
    
    // Draw hit markers
    drawHitMarkers();
    
    // Restore canvas state (remove screen shake transform)
    ctx.restore();
}

function drawHitMarkers() {
    for (const marker of hitMarkers) {
        const screenPos = marker.getScreenPosition();
        if (!screenPos.visible) continue;
        
        const opacity = marker.getOpacity();
        if (opacity <= 0) continue;
        
        const size = 8; // Size of hit marker dot
        
        // Draw red dot with glow effect
        const gradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, size * 1.5);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
        gradient.addColorStop(0.6, `rgba(255, 0, 0, ${opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw solid center
        ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw white outline for visibility
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawAmmo() {
    const ammoText = `${ammo}/${MAX_AMMO}`;
    const fontSize = 24;
    const padding = 10;
    
    ctx.font = `${fontSize}px Arial`;
    const textWidth = ctx.measureText(ammoText).width;
    
    // Position in top right corner
    const x = canvas.width - textWidth - padding;
    const y = padding + fontSize;
    
    // Draw background for better visibility
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x - padding, y - fontSize - padding/2, textWidth + padding * 2, fontSize + padding);
    
    // Draw ammo text
    ctx.fillStyle = ammo === 0 ? "red" : "white"; // Red when out of ammo
    ctx.fillText(ammoText, x, y);
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
      
      // Calculate vertical offset based on vertical angle and player height
      const verticalShift = Math.tan(verticalAngle) * canvas.height;
      const heightOffset = player.height * (canvas.height / distance);
  
      // Draw NPC sprite (adjusted for both vertical angle and player height)
      ctx.save();
      if (npc.isPunched) {
        ctx.filter = 'brightness(200%) saturate(200%) hue-rotate(0deg)';
      }
      ctx.drawImage(
        npc.sprite,
        screenX - spriteWidth / 2,
        (canvas.height - spriteHeight) / 2 + verticalShift + heightOffset,
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
    // Update animation progress (smooth in both directions)
    if (debugMenuVisible && debugMenuAnimation < 1) {
        debugMenuAnimation = Math.min(1, debugMenuAnimation + DEBUG_MENU_ANIMATION_SPEED);
    } else if (!debugMenuVisible && debugMenuAnimation > 0) {
        debugMenuAnimation = Math.max(0, debugMenuAnimation - DEBUG_MENU_ANIMATION_SPEED);
    }
    
    // Update sound volume fade
    if (Math.abs(debugMenuSound.volume - debugMenuSoundTargetVolume) > 0.01) {
        if (debugMenuSound.volume < debugMenuSoundTargetVolume) {
            debugMenuSound.volume = Math.min(debugMenuSoundTargetVolume, debugMenuSound.volume + DEBUG_SOUND_FADE_SPEED);
        } else {
            debugMenuSound.volume = Math.max(debugMenuSoundTargetVolume, debugMenuSound.volume - DEBUG_SOUND_FADE_SPEED);
        }
    }
    
    // Stop sound if volume reaches 0
    if (debugMenuSound.volume <= 0.01 && debugMenuSoundTargetVolume === 0) {
        debugMenuSound.pause();
        debugMenuSound.currentTime = 0;
    }
    
    // Easing function for smooth animation (ease out)
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const animProgress = easeOut(debugMenuAnimation);
    
    // Don't draw if animation is at 0
    if (animProgress <= 0) return;
    
    // Define the lines for the left box
    const leftBoxLines = [
        "Debug Menu (` to close)",
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
        "\\: Map Overlay, .: Cycle NPC",
        "=: Toggle Keyboard Look",
        "↑/↓: Adjust Sensitivity"
    ];
    const rightBoxLines = 14; // Keep as before for right box
    
    const fontSize = 16;
    const lineHeight = fontSize * 1.4; // More generous line height
    const padding = 18;
    const menuWidth = 270;
    const leftBoxHeight = (leftBoxLines.length * lineHeight) + (padding * 2);
    const rightBoxHeight = (rightBoxLines * lineHeight) + (padding * 2);
    
    // Animated positions - left panel slides from left, right panel slides from right
    const leftPanelStartX = -menuWidth - 20; // Start off-screen left
    const leftPanelEndX = 10;
    const leftPanelX = leftPanelStartX + (leftPanelEndX - leftPanelStartX) * animProgress;
    const startY = canvas.height - leftBoxHeight - 10;
    
    const rightPanelStartX = canvas.width + 20; // Start off-screen right
    const rightPanelEndX = canvas.width - menuWidth - 10;
    const rightPanelX = rightPanelStartX + (rightPanelEndX - rightPanelStartX) * animProgress;
    const rightBoxY = canvas.height - rightBoxHeight - 10;

    // Draw left menu background (basic info) - slides from left
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(leftPanelX, startY, menuWidth, leftBoxHeight);

    // Draw right menu background (raycasting and NPC info) - slides from right
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(rightPanelX, rightBoxY, menuWidth, rightBoxHeight);

    // Draw borders (using animated positions)
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(leftPanelX, startY, menuWidth, leftBoxHeight);
    ctx.strokeRect(rightPanelX, rightBoxY, menuWidth, rightBoxHeight);

    // Set font with lighter weight
    ctx.font = `${fontSize}px Earthbound, monospace`;
    ctx.fillStyle = "white";
    let yOffset = startY + padding + fontSize; // Start after padding

    // Draw each line for the left box (using animated position)
    for (const line of leftBoxLines) {
        ctx.fillText(line, leftPanelX + 10, yOffset);
        yOffset += lineHeight;
    }

    // Right box - Ray casting and NPC info (using animated position)
    yOffset = rightBoxY + padding + fontSize;
    ctx.font = `${fontSize}px Earthbound, monospace`;
    ctx.fillStyle = "white";
    ctx.fillText("Ray Casting Info:", rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    if (rayHitInfo.length > 0) {
        const centerRay = Math.floor(rayHitInfo.length / 2);
        const hit = rayHitInfo[centerRay];
        ctx.fillText(`Center Ray Hit: (${hit.x.toFixed(2)}, ${hit.y.toFixed(2)})`, rightPanelX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Distance: ${hit.distance.toFixed(2)}`, rightPanelX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Column: ${hit.column}`, rightPanelX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Angle: ${(hit.angle * 180 / Math.PI).toFixed(1)}°`, rightPanelX + 10, yOffset);
    }
    yOffset += lineHeight;
    ctx.fillText("Z-Buffer Info:", rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    if (zBuffer.length > 0) {
        const centerZ = zBuffer[Math.floor(zBuffer.length / 2)];
        ctx.fillText(`Center Z: ${centerZ.toFixed(2)}`, rightPanelX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Min Z: ${Math.min(...zBuffer).toFixed(2)}`, rightPanelX + 10, yOffset);
        yOffset += lineHeight;
        ctx.fillText(`Max Z: ${Math.max(...zBuffer).toFixed(2)}`, rightPanelX + 10, yOffset);
    }
    yOffset += lineHeight * 2;
    ctx.fillText("NPC Info:", rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`Position: (${npc.x.toFixed(2)}, ${npc.y.toFixed(2)})`, rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`State: ${npcState}`, rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    ctx.fillText(`Visible: ${npc.isVisible}`, rightPanelX + 10, yOffset);
    yOffset += lineHeight;
    if (npcLastKnownPlayerPos) {
        ctx.fillText(`Last Player Pos: (${npcLastKnownPlayerPos.x.toFixed(2)}, ${npcLastKnownPlayerPos.y.toFixed(2)})`, rightPanelX + 10, yOffset);
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
    // Simplified, smooth jumping physics
    if (player.height > 0 || player.verticalSpeed !== 0) {
        // Apply gravity based on whether space is held
        if (keys[" "] && player.verticalSpeed > 0 && player.height < MAX_JUMP_HEIGHT) {
            // Lighter gravity when holding space and rising
            player.verticalSpeed += GRAVITY_UP;
        } else {
            // Stronger gravity when falling or at peak
            player.verticalSpeed += GRAVITY_DOWN;
        }
        
        // Smooth deceleration near peak
        if (player.verticalSpeed > 0) {
            const distanceToMax = MAX_JUMP_HEIGHT - player.height;
            if (distanceToMax < SMOOTH_ZONE && distanceToMax > 0) {
                // Gradually reduce upward velocity as we approach max
                const smoothFactor = distanceToMax / SMOOTH_ZONE;
                player.verticalSpeed *= (0.7 + smoothFactor * 0.3); // Slow down more as we get closer
            }
        }
        
        player.height += player.verticalSpeed;
        
        // Ground collision
        if (player.height <= 0) {
            player.height = 0;
            player.verticalSpeed = 0;
            player.isJumping = false;
            jumpCharge = 0;
            jumpStartTime = 0;
        }
        
        // Ceiling collision - smooth stop
        if (player.height >= MAX_JUMP_HEIGHT) {
            player.height = MAX_JUMP_HEIGHT;
            if (player.verticalSpeed > 0) {
                player.verticalSpeed = 0;
            }
            // Start falling
            player.verticalSpeed += GRAVITY_DOWN;
        }
    }

    // Handle jump input
    if (keys[" "] && !jumpPressedLastFrame && !player.isJumping && player.height === 0) {
        player.verticalSpeed = JUMP_FORCE;
        player.isJumping = true;
        jumpStartTime = performance.now() / 1000;
    }
    
    // Variable jump height - holding space increases height
    if (keys[" "] && player.isJumping && player.verticalSpeed > 0) {
        const currentTime = performance.now() / 1000;
        const timeHeld = currentTime - jumpStartTime;
        
        // Allow variable jump height based on how long space is held
        if (timeHeld < SHORT_HOP_WINDOW) {
            // Short hop - less upward boost
            if (player.verticalSpeed < JUMP_FORCE * 0.6) {
                player.verticalSpeed = JUMP_FORCE * 0.6;
            }
        } else if (timeHeld < SHORT_HOP_WINDOW * 2) {
            // Medium jump - normal boost
            if (player.verticalSpeed < JUMP_FORCE) {
                player.verticalSpeed = JUMP_FORCE;
            }
        }
        // Long hold allows reaching max height naturally
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
        // Calculate desired movement direction (use 1.0 since we normalize anyway)
        let desiredVelocityX = 0;
        let desiredVelocityY = 0;
        
        if (keys["w"]) {
            desiredVelocityX += Math.cos(player.angle);
            desiredVelocityY += Math.sin(player.angle);
        }
        if (keys["s"]) {
            desiredVelocityX -= Math.cos(player.angle);
            desiredVelocityY -= Math.sin(player.angle);
        }
        
        // Strafe left/right when in mouse look mode, otherwise turn
        if (mouseLookEnabled) {
            // Strafe left (A key)
            if (keys["a"]) {
                desiredVelocityX += Math.cos(player.angle - Math.PI / 2);
                desiredVelocityY += Math.sin(player.angle - Math.PI / 2);
            }
            // Strafe right (D key)
            if (keys["d"]) {
                desiredVelocityX += Math.cos(player.angle + Math.PI / 2);
                desiredVelocityY += Math.sin(player.angle + Math.PI / 2);
            }
        }

        // Apply acceleration
        if (desiredVelocityX !== 0 || desiredVelocityY !== 0) {
            // Normalize desired velocity to keep speed consistent (prevents diagonal movement from being faster)
            const length = Math.sqrt(desiredVelocityX * desiredVelocityX + desiredVelocityY * desiredVelocityY);
            // Safety check: avoid division by zero
            if (length > 0.0001) {
                desiredVelocityX = (desiredVelocityX / length) * MAX_SPEED;
                desiredVelocityY = (desiredVelocityY / length) * MAX_SPEED;
            } else {
                desiredVelocityX = 0;
                desiredVelocityY = 0;
            }

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
                // If collision occurs, try sliding along walls
                // Try X movement first (slide along Y axis)
                const newSlideX = player.x + playerVelocity.x * SLIDE_SPEED_MULTIPLIER;
                const slideMapX = Math.floor(newSlideX);
                const slideMapY = Math.floor(player.y);
                
                let canSlideX = false;
                if (slideMapX >= 1 && slideMapX < rooms[currentRoom][0].length - 1 &&
                    slideMapY >= 1 && slideMapY < rooms[currentRoom].length - 1 &&
                    rooms[currentRoom][slideMapY][slideMapX] === 0) {
                    player.x = newSlideX;
                    canSlideX = true;
                }
                
                // Try Y movement (slide along X axis)
                const newSlideY = player.y + playerVelocity.y * SLIDE_SPEED_MULTIPLIER;
                const slideMapX2 = Math.floor(player.x);
                const slideMapY2 = Math.floor(newSlideY);
                
                let canSlideY = false;
                if (slideMapX2 >= 1 && slideMapX2 < rooms[currentRoom][0].length - 1 &&
                    slideMapY2 >= 1 && slideMapY2 < rooms[currentRoom].length - 1 &&
                    rooms[currentRoom][slideMapY2][slideMapX2] === 0) {
                    player.y = newSlideY;
                    canSlideY = true;
                }
                
                // If we can slide in at least one direction, keep some velocity
                if (canSlideX || canSlideY) {
                    // Preserve velocity in the direction we can slide
                    if (!canSlideX) playerVelocity.x *= 0.3; // Reduce X velocity if can't slide X
                    if (!canSlideY) playerVelocity.y *= 0.3; // Reduce Y velocity if can't slide Y
                } else {
                    // Can't slide at all, reduce velocity more
                    playerVelocity.x *= 0.2;
                    playerVelocity.y *= 0.2;
                }
            }
        }
    } else {
        // No collision - move freely with acceleration
        let desiredVelocityX = 0;
        let desiredVelocityY = 0;
        
        if (keys["w"]) {
            desiredVelocityX += Math.cos(player.angle);
            desiredVelocityY += Math.sin(player.angle);
        }
        if (keys["s"]) {
            desiredVelocityX -= Math.cos(player.angle);
            desiredVelocityY -= Math.sin(player.angle);
        }
        
        // Strafe left/right when in mouse look mode
        if (mouseLookEnabled) {
            // Strafe left (A key)
            if (keys["a"]) {
                desiredVelocityX += Math.cos(player.angle - Math.PI / 2);
                desiredVelocityY += Math.sin(player.angle - Math.PI / 2);
            }
            // Strafe right (D key)
            if (keys["d"]) {
                desiredVelocityX += Math.cos(player.angle + Math.PI / 2);
                desiredVelocityY += Math.sin(player.angle + Math.PI / 2);
            }
        }
        
        // Normalize to keep speed consistent (prevents diagonal movement from being faster)
        if (desiredVelocityX !== 0 || desiredVelocityY !== 0) {
            const length = Math.sqrt(desiredVelocityX * desiredVelocityX + desiredVelocityY * desiredVelocityY);
            // Safety check: avoid division by zero
            if (length > 0.0001) {
                desiredVelocityX = (desiredVelocityX / length) * MAX_SPEED;
                desiredVelocityY = (desiredVelocityY / length) * MAX_SPEED;
            } else {
                desiredVelocityX = 0;
                desiredVelocityY = 0;
            }
            
            // Accelerate towards desired velocity
            playerVelocity.x += (desiredVelocityX - playerVelocity.x) * ACCELERATION;
            playerVelocity.y += (desiredVelocityY - playerVelocity.y) * ACCELERATION;
        } else {
            // Apply friction when no movement keys are pressed
            playerVelocity.x *= (1 - FRICTION);
            playerVelocity.y *= (1 - FRICTION);
        }
        
        // Move player
        player.x += playerVelocity.x;
        player.y += playerVelocity.y;
    }

    // Only turn with A/D when NOT in mouse look mode
    if (!mouseLookEnabled) {
        if (keys["a"]) player.angle -= TURN_SPEED;
        if (keys["d"]) player.angle += TURN_SPEED;
    }

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

// Handle map editing and pointer lock
canvas.addEventListener("click", (e) => {
  if (debugMenuVisible) {
    const miniMapSize = 150;
    const cellSize = miniMapSize / rooms[currentRoom].length;
    const x = Math.floor((e.offsetX - 10) / cellSize);
    const y = Math.floor((e.offsetY - 10) / cellSize);

    if (x >= 0 && x < rooms[currentRoom][0].length && y >= 0 && y < rooms[currentRoom].length) {
      rooms[currentRoom][y][x] = rooms[currentRoom][y][x] === 1 ? 0 : 1;
    }
  } else if (mouseLookEnabled && document.pointerLockElement !== canvas) {
    // Request pointer lock when clicking canvas if mouse look is enabled
    canvas.requestPointerLock();
  } else if (!debugMenuVisible && e.button === 0) {
    // Left click to shoot (only if not in debug menu)
    shootGun();
  }
});

// Keyboard input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "`" || e.key === "Backquote") {
    debugMenuVisible = !debugMenuVisible;
    
    if (debugMenuVisible) {
      // Opening debug menu - fade in sound and start animation
      debugMenuSound.currentTime = 0;
      debugMenuSoundTargetVolume = 0.2;
      debugMenuSound.play().catch(e => console.log("Could not play debug sound:", e));
      debugMenuAnimation = 0; // Start animation from 0
      
      // Don't exit pointer lock - keep mouse locked
    } else {
      // Closing debug menu - immediately stop sound and fade out animation
      debugMenuSoundTargetVolume = 0;
      debugMenuSound.volume = 0;
      debugMenuSound.pause();
      debugMenuSound.currentTime = 0;
      debugMenuAnimation = 0;
      
      // Don't need to re-request pointer lock since we never exited it
    }
  }
  if (e.key === "m") miniMapVisible = !miniMapVisible;
  if (e.key === "c") collisionEnabled = !collisionEnabled;
  if (e.key === "\\") showMapOverlay = !showMapOverlay;
  if (e.key === "=") {
    mouseLookEnabled = !mouseLookEnabled;
    if (mouseLookEnabled) {
      // Enable mouse look
      canvas.requestPointerLock();
    } else {
      // Disable mouse look (keyboard controls for camera)
      document.exitPointerLock();
      cameraVelocity = { x: 0, y: 0 }; // Reset camera velocity
      verticalAngle = 0; // Reset vertical angle
    }
  }
  if (e.key === "r" || e.key === "R") {
    if (debugMenuVisible) {
      // Reset player position in debug mode
      player.x = 1.5;
      player.y = 1.5;
      player.angle = 0;
      cameraVelocity = { x: 0, y: 0 }; // Reset camera velocity
      verticalAngle = 0; // Reset vertical angle
    } else {
      // Reload gun when not in debug mode
      reloadGun();
    }
  }
  if (e.key === "f") showFPS = !showFPS;
  
  // Cycle through NPC sprites with '.' key
  if (e.key === ".") {
    currentNpcIndex = (currentNpcIndex + 1) % npcSprites.length;
    npc.sprite = npcSprites[currentNpcIndex];
  }
  
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

// Gun functions
function drawGun() {
    // Don't draw gun when debug menu is visible (it overlaps the right debug box)
    if (debugMenuVisible) return;
    
    let gunImage = null;
    
    if (gunState === 'idle') {
        gunImage = gunIdle;
    } else if (gunState === 'shooting') {
        // Animation sequence: 0 -> gun_shoot.png, 1 -> gun_shoot2.png, 2 -> gun_shoot.png
        if (gunFrame === 2) {
            gunImage = gunShootFrames[0]; // Back to first shoot frame
        } else {
            gunImage = gunShootFrames[gunFrame];
        }
    } else if (gunState === 'reloading') {
        gunImage = gunReloadFrames[gunFrame];
    }
    
    if (gunImage && gunImage.complete) {
        // Calculate gun size (maintain aspect ratio) - easily adjustable via GUN_SIZE_MULTIPLIER
        const gunWidth = canvas.width * GUN_SIZE_MULTIPLIER;
        const gunHeight = gunWidth * (gunImage.height / gunImage.width);
        
        // Position in bottom right corner with vibration offset
        const gunX = canvas.width - gunWidth + gunVibrationX;
        const gunY = canvas.height - gunHeight + gunVibrationY;
        
        ctx.drawImage(gunImage, gunX, gunY, gunWidth, gunHeight);
    }
}

function shootGun() {
    // Check if out of ammo
    if (gunState === 'idle' && ammo === 0) {
        // Play empty sound and vibrate gun
        emptySound.currentTime = 0;
        emptySound.play().catch(e => console.log("Could not play empty sound:", e));
        gunVibrationIntensity = GUN_VIBRATION_INTENSITY;
        return;
    }
    
    // Only shoot if not already shooting or reloading and have ammo
    if (gunState === 'idle' && ammo > 0) {
        gunState = 'shooting';
        gunFrame = 0;
        gunAnimationTimer = 0;
        ammo--; // Decrease ammo
        
        // Play random shoot sound
        const randomShoot = shootSounds[Math.floor(Math.random() * shootSounds.length)];
        randomShoot.currentTime = 0;
        randomShoot.play().catch(e => console.log("Could not play shoot sound:", e));
        
        // Add screen shake for JUICE
        screenShakeIntensity = SCREEN_SHAKE_INTENSITY;
        
        // Schedule shell drop sound (random)
        shellSoundTimer = SHELL_SOUND_DELAY;
        
        // Create a new bullet when shooting
        const bullet = new Bullet(player.x, player.y, player.angle, verticalAngle);
        bullets.push(bullet);
        
        // Immediately check for hit at center of screen (instant hit detection)
        checkInstantHit();
    }
}

// Instant hit detection - raycasts from center of screen
function checkInstantHit() {
    const rayAngle = player.angle;
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    
    let rayX = player.x;
    let rayY = player.y;
    let rayZ = player.height; // Start at player height
    let distance = 0;
    const stepSize = 0.05;
    let hitSomething = false;
    let hitX = 0, hitY = 0, hitZ = 0;
    
    // Cast ray until we hit something or reach max range
    while (distance < BULLET_HIT_RANGE && !hitSomething) {
        rayX += rayDirX * stepSize;
        rayY += rayDirY * stepSize;
        // Add vertical component based on where we're aiming
        rayZ += Math.sin(verticalAngle) * stepSize;
        distance += stepSize;
        
        // Check wall collision
        const mapX = Math.floor(rayX);
        const mapY = Math.floor(rayY);
        
        if (mapX >= 0 && mapX < rooms[currentRoom][0].length &&
            mapY >= 0 && mapY < rooms[currentRoom].length) {
            if (rooms[currentRoom][mapY][mapX] === 1) {
                hitSomething = true;
                hitX = rayX;
                hitY = rayY;
                hitZ = rayZ;
                break;
            }
        }
        
        // Check NPC collision
        if (npc.isVisible) {
            const dx = rayX - npc.x;
            const dy = rayY - npc.y;
            const distToNpc = Math.sqrt(dx * dx + dy * dy);
            
            if (distToNpc < 0.5) {
                hitSomething = true;
                hitX = rayX;
                hitY = rayY;
                hitZ = rayZ;
                break;
            }
        }
    }
    
    // If we hit something within range, create a hit marker at the hit position
    if (hitSomething) {
        const hitMarker = new HitMarker(hitX, hitY, hitZ);
        hitMarkers.push(hitMarker);
    }
}

function drawCrosshair() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 8; // Size of crosshair lines
    const thickness = 2; // Thickness of crosshair lines
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = thickness;
    
    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.stroke();
    
    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();
}

function reloadGun() {
    // Only reload if not already shooting or reloading and ammo is not full
    if (gunState === 'idle' && ammo < MAX_AMMO) {
        gunState = 'reloading';
        gunFrame = 0;
        gunAnimationTimer = 0;
        
        // Play reload sound
        reloadSound.currentTime = 0; // Reset to start
        reloadSound.play().catch(e => console.log("Could not play reload sound:", e));
    }
}

function updateGunAnimation(deltaTime) {
    // Update screen shake
    if (screenShakeIntensity > 0) {
        screenShakeX = (Math.random() - 0.5) * screenShakeIntensity;
        screenShakeY = (Math.random() - 0.5) * screenShakeIntensity;
        screenShakeIntensity *= SCREEN_SHAKE_DECAY;
        if (screenShakeIntensity < 0.1) {
            screenShakeIntensity = 0;
            screenShakeX = 0;
            screenShakeY = 0;
        }
    }
    
    // Update gun vibration
    if (gunVibrationIntensity > 0) {
        gunVibrationX = (Math.random() - 0.5) * gunVibrationIntensity;
        gunVibrationY = (Math.random() - 0.5) * gunVibrationIntensity;
        gunVibrationIntensity *= GUN_VIBRATION_DECAY;
        if (gunVibrationIntensity < 0.1) {
            gunVibrationIntensity = 0;
            gunVibrationX = 0;
            gunVibrationY = 0;
        }
    }
    
    // Update shell sound timer
    if (shellSoundTimer > 0) {
        shellSoundTimer -= deltaTime;
        if (shellSoundTimer <= 0) {
            // Play random shell drop sound
            const randomShell = shellSounds[Math.floor(Math.random() * shellSounds.length)];
            randomShell.currentTime = 0; // Reset to start
            randomShell.play().catch(e => console.log("Could not play shell sound:", e));
            shellSoundTimer = 0;
        }
    }
    
    if (gunState === 'shooting') {
        gunAnimationTimer += deltaTime;
        if (gunAnimationTimer >= GUN_SHOOT_FRAME_TIME) {
            gunAnimationTimer = 0;
            gunFrame++;
            // Animation sequence: 0 (shoot) -> 1 (shoot2) -> 2 (shoot again) -> idle
            if (gunFrame >= GUN_SHOOT_FRAMES) {
                gunState = 'idle';
                gunFrame = 0;
            }
        }
    } else if (gunState === 'reloading') {
        gunAnimationTimer += deltaTime;
        if (gunAnimationTimer >= GUN_RELOAD_FRAME_TIME) {
            gunAnimationTimer = 0;
            gunFrame++;
            if (gunFrame >= GUN_RELOAD_FRAMES) {
                gunState = 'idle';
                gunFrame = 0;
                ammo = MAX_AMMO; // Refill ammo after reload animation completes
            }
        }
    }
}

function updateBullets(deltaTime) {
    // Update all active bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(deltaTime);
        
        // Remove inactive bullets
        if (!bullets[i].active) {
            bullets.splice(i, 1);
        }
    }
    
    // Update hit markers
    for (let i = hitMarkers.length - 1; i >= 0; i--) {
        hitMarkers[i].update(deltaTime);
        
        // Remove inactive hit markers
        if (!hitMarkers[i].active) {
            hitMarkers.splice(i, 1);
        }
    }
}

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
        const deltaTime = elapsed / 1000; // Convert to seconds
        movePlayer();
        moveNPC();
        updateGunAnimation(deltaTime);
        updateBullets(deltaTime);
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
    
    // Stop moving if dialogue menu is open
    if (dialogueMenuVisible) return;

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
