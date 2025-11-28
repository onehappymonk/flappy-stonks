


// Physics
export const GRAVITY = 0.4;
export const JUMP_STRENGTH = -7; // Negative goes up
export const OBSTACLE_SPEED = 3;
export const OBSTACLE_SPAWN_RATE = 100; // Frames between spawns (Legacy, switching to distance)
export const OBSTACLE_SPAWN_DISTANCE = 350; // Pixels between obstacles
export const OBSTACLE_GAP = 180; // Space between top and bottom bars
export const OBSTACLE_WIDTH = 60;

// Power-Ups
export const POWERUP_DATA = [
  { text: "REBRAND", color: "#0ea5e9" },     // Sky Blue
  { text: "AI", color: "#d946ef" },          // Fuchsia
  { text: "STAFF CUTS", color: "#ef4444" },  // Red
  { text: "WHOPPER", color: "#f59e0b" }      // Amber
];
export const POWERUP_DURATION = 300; // Frames (approx 5 seconds at 60fps)
export const POWERUP_SIZE = 40;
export const POWERUP_SPEED_MULTIPLIER = 2;

// Dimensions (Logical resolution for pixel art look)
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

// Assets
// NOTE: Please save the attached character image as 'ceo.png' in your project root.
export const ASSETS = {
  CEO_FLYING: './ceo.png', 
  // We use the same image for crash initially, but the GameCanvas will apply a filter effect.
  // Once you have the specific crashed PNG, you can change this to './ceo_crashed.png'.
  CEO_CRASHED: './ceo.png', 
  BACKGROUND: 'bg_gradient', 
};

export const COLORS = {
  SKY: '#0f172a', // Slate 900
  GRID: '#1e293b', // Slate 800
  CHART_LINE: '#22c55e', // Green 500
  OBSTACLE_GREEN: '#4ade80',
  OBSTACLE_RED: '#f87171',
  GOLD: '#fbbf24',
  POWERUP_BG: '#f59e0b',
  POWERUP_BORDER: '#b45309',
};
