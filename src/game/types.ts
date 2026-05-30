export interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'COIN' | 'FUEL';
  collected: boolean;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'BARRICADE' | 'ROCK';
  width: number;
  height: number;
  hit: boolean;
}

export interface CheckpointPint {
  id: number;
  x: number;
  y: number;
  passed: boolean;
  name: string;
}

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  type: 'smoke' | 'spark' | 'emoji' | 'text' | 'confetti';
  text?: string;
  gravity?: number;
  angle?: number;
  spinSpeed?: number;
}

export interface CarState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  fuel: number;
  score: number;
  distanceX: number;
  isGrounded: boolean;
  speed: number;
}

export interface ControlsState {
  left: boolean;
  right: boolean;
  up: boolean;
}
