
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Obstacle {
  x: number;
  topHeight: number;
  width: number;
  passed: boolean;
  type: 'BULL' | 'BEAR'; // Color variation for visual flair
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string; // Specific color for the powerup type
  collected: boolean;
  id: number; // Unique ID for keying if needed
}
