
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Obstacle, PowerUp } from '../types';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  OBSTACLE_SPEED, 
  OBSTACLE_SPAWN_DISTANCE,
  OBSTACLE_GAP, 
  OBSTACLE_WIDTH, 
  GAME_WIDTH, 
  GAME_HEIGHT,
  COLORS,
  ASSETS,
  POWERUP_DATA,
  POWERUP_DURATION,
  POWERUP_SIZE,
  POWERUP_SPEED_MULTIPLIER
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  triggerJump: number; // Increment this to trigger a jump externally
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, triggerJump }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game Logic Refs (Mutable state outside React render cycle for performance)
  const reqRef = useRef<number>(undefined);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const distanceSinceSpawnRef = useRef<number>(0);
  
  // Speed Boost Refs
  const speedBoostTimerRef = useRef<number>(0);
  
  // CEO Physics
  const ceoRef = useRef({
    x: GAME_WIDTH / 4,
    y: GAME_HEIGHT / 2,
    velocity: 0,
    width: 75, // Increased size (was 50)
    height: 75, // Increased size (was 50)
    rotation: 0,
  });

  // Obstacles & Powerups
  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);

  // Background Graph Points (for the surreal stock chart effect)
  const chartPointsRef = useRef<{y: number}[]>([]);

  // Images
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  // Initialize Chart Points & Load Images
  useEffect(() => {
    const points = [];
    for (let i = 0; i <= GAME_WIDTH / 10; i++) {
      points.push({ y: GAME_HEIGHT / 2 + (Math.random() - 0.5) * 100 });
    }
    chartPointsRef.current = points;
    
    // Preload Images
    const imgFly = new Image();
    imgFly.src = ASSETS.CEO_FLYING;
    const imgCrash = new Image();
    imgCrash.src = ASSETS.CEO_CRASHED;
    
    // Helper to fallback if image fails (using simple color blocks)
    imgFly.onerror = () => { console.warn("Failed to load Fly Image"); };
    
    imagesRef.current = {
      fly: imgFly,
      crash: imgCrash
    };
    
    // No cleanup needed here as we aren't starting the animation loop in this effect
  }, []);

  // Reset Game
  const resetGame = useCallback(() => {
    ceoRef.current = {
      x: GAME_WIDTH / 4,
      y: GAME_HEIGHT / 2,
      velocity: 0,
      width: 75, // Keep consistent with init
      height: 75,
      rotation: 0,
    };
    obstaclesRef.current = [];
    powerUpsRef.current = [];
    scoreRef.current = 0;
    frameCountRef.current = 0;
    distanceSinceSpawnRef.current = 0;
    speedBoostTimerRef.current = 0;
    setScore(0);
  }, [setScore]);

  // Jump Action
  const jump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      ceoRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState]);

  // Watch for external jump triggers (tap from parent)
  useEffect(() => {
    if (triggerJump > 0) {
      jump();
    }
  }, [triggerJump, jump]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameState === GameState.START) {
      resetGame();
    }

    const loop = () => {
      // 1. Determine Current Speed
      let currentSpeed = OBSTACLE_SPEED;
      if (speedBoostTimerRef.current > 0) {
        currentSpeed *= POWERUP_SPEED_MULTIPLIER;
        speedBoostTimerRef.current--;
      }

      // 2. Clear
      ctx.fillStyle = COLORS.SKY;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // 3. Update & Draw Background (Surreal Stock Chart)
      updateAndDrawBackground(ctx, gameState === GameState.PLAYING, currentSpeed);

      // 4. Game Logic (Only if playing or transitioning to crash)
      if (gameState === GameState.PLAYING) {
        updatePhysics(currentSpeed);
        checkCollisions();
      } else if (gameState === GameState.GAME_OVER) {
         // Fall to ground if game over
         if (ceoRef.current.y < GAME_HEIGHT - 50) {
            ceoRef.current.velocity += GRAVITY;
            ceoRef.current.y += ceoRef.current.velocity;
         }
      }

      // 5. Draw Obstacles
      drawObstacles(ctx);

      // 6. Draw Powerups
      drawPowerUps(ctx);

      // 7. Draw CEO
      drawCEO(ctx);

      // 8. Loop
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [gameState, resetGame, jump, setGameState]);

  // --- Helper Functions ---

  const updatePhysics = (currentSpeed: number) => {
    frameCountRef.current++;
    const ceo = ceoRef.current;

    // Gravity
    ceo.velocity += GRAVITY;
    ceo.y += ceo.velocity;

    // Rotation based on velocity
    ceo.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (ceo.velocity * 0.1)));

    // --- Spawning Logic (Distance Based) ---
    // Instead of frames, we use distance traveled to ensure gap size remains consistent 
    // regardless of speed multiplier.
    distanceSinceSpawnRef.current += currentSpeed;

    if (distanceSinceSpawnRef.current >= OBSTACLE_SPAWN_DISTANCE) {
      distanceSinceSpawnRef.current = 0; // Reset distance tracker

      const minHeight = 100;
      const maxHeight = GAME_HEIGHT - OBSTACLE_GAP - 100;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
      
      obstaclesRef.current.push({
        x: GAME_WIDTH,
        topHeight,
        width: OBSTACLE_WIDTH,
        passed: false,
        type: Math.random() > 0.5 ? 'BULL' : 'BEAR'
      });

      // Chance to spawn a Power-Up between this obstacle and the next
      // We position it roughly half-way to the next spawn point
      if (Math.random() < 0.35) { // 35% chance
        const powerUpY = 100 + Math.random() * (GAME_HEIGHT - 200);
        const powerUpX = GAME_WIDTH + (OBSTACLE_SPAWN_DISTANCE / 2);
        
        // Pick random powerup type with color
        const type = POWERUP_DATA[Math.floor(Math.random() * POWERUP_DATA.length)];
        
        powerUpsRef.current.push({
          id: Date.now(),
          x: powerUpX,
          y: powerUpY,
          width: POWERUP_SIZE,
          height: POWERUP_SIZE,
          text: type.text,
          color: type.color,
          collected: false
        });
      }
    }

    // --- Move Obstacles ---
    obstaclesRef.current.forEach(obs => {
      obs.x -= currentSpeed;
    });
    
    // Cleanup old obstacles
    if (obstaclesRef.current.length > 0 && obstaclesRef.current[0].x < -OBSTACLE_WIDTH) {
      obstaclesRef.current.shift();
    }

    // --- Move Powerups ---
    powerUpsRef.current.forEach(p => {
      p.x -= currentSpeed;
    });
    // Cleanup collected or off-screen powerups
    // Increased buffer to -300 to ensure long text doesn't disappear prematurely
    powerUpsRef.current = powerUpsRef.current.filter(p => p.x > -300 && !p.collected);


    // --- Score Counting ---
    obstaclesRef.current.forEach(obs => {
      if (!obs.passed && ceo.x > obs.x + obs.width) {
        obs.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current); // Sync with React state for UI
      }
    });
  };

  const checkCollisions = () => {
    const ceo = ceoRef.current;
    const hitBoxInset = 12; // Adjusted inset for larger sprite
    const ceoLeft = ceo.x + hitBoxInset;
    const ceoRight = ceo.x + ceo.width - hitBoxInset;
    const ceoTop = ceo.y + hitBoxInset;
    const ceoBottom = ceo.y + ceo.height - hitBoxInset;
    
    // 1. Ground/Ceiling
    if (ceo.y + ceo.height >= GAME_HEIGHT || ceo.y <= 0) {
      setGameState(GameState.GAME_OVER);
      return;
    }

    // 2. Obstacles
    for (const obs of obstaclesRef.current) {
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.width;
      
      // Top Pipe
      if (
        ceoRight > obsLeft &&
        ceoLeft < obsRight &&
        ceoTop < obs.topHeight
      ) {
        setGameState(GameState.GAME_OVER);
        return;
      }

      // Bottom Pipe
      if (
        ceoRight > obsLeft &&
        ceoLeft < obsRight &&
        ceoBottom > obs.topHeight + OBSTACLE_GAP
      ) {
        setGameState(GameState.GAME_OVER);
        return;
      }
    }

    // 3. Power-Ups
    for (const p of powerUpsRef.current) {
      if (p.collected) continue;
      
      // Simple circle/box collision
      // Treating powerup as a box for simplicity or distance check
      const pRadius = p.width / 2;
      const pCenterX = p.x;
      const pCenterY = p.y;
      
      const dx = (ceo.x + ceo.width/2) - pCenterX;
      const dy = (ceo.y + ceo.height/2) - pCenterY;
      const distance = Math.sqrt(dx*dx + dy*dy);

      if (distance < (ceo.width/2 + pRadius)) {
        p.collected = true;
        // Activate Power-Up
        speedBoostTimerRef.current = POWERUP_DURATION;
      }
    }
  };

  const updateAndDrawBackground = (ctx: CanvasRenderingContext2D, isMoving: boolean, currentSpeed: number) => {
    // Draw Grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;

    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ctx.beginPath();
      // Simple parallax effect
      const scrollOffset = (frameCountRef.current * (currentSpeed / 2)) % 40;
      ctx.moveTo(x - scrollOffset, 0);
      ctx.lineTo(x - scrollOffset, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw "Stock Chart" line
    ctx.strokeStyle = COLORS.CHART_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Update chart points to scroll
    if (isMoving) {
        // Shift points left
        for(let i=0; i<chartPointsRef.current.length - 1; i++){
            chartPointsRef.current[i].y = chartPointsRef.current[i+1].y;
        }
        // New random point at end
        const lastY = chartPointsRef.current[chartPointsRef.current.length - 2].y;
        const volatility = currentSpeed > OBSTACLE_SPEED ? 40 : 20; // More volatile when fast
        const change = (Math.random() - 0.5) * volatility;
        let newY = lastY + change;
        // Clamp
        if (newY < 100) newY = 100;
        if (newY > GAME_HEIGHT - 100) newY = GAME_HEIGHT - 100;
        
        chartPointsRef.current[chartPointsRef.current.length - 1].y = newY;
    }

    // Draw the line
    const step = GAME_WIDTH / (chartPointsRef.current.length - 1);
    chartPointsRef.current.forEach((p, i) => {
        if (i === 0) ctx.moveTo(i * step, p.y);
        else ctx.lineTo(i * step, p.y);
    });
    ctx.stroke();

    // Fill area under chart
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.lineTo(0, GAME_HEIGHT);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fill();
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    obstaclesRef.current.forEach(obs => {
      // Determines styling based on "Bull" or "Bear" random type
      ctx.fillStyle = obs.type === 'BULL' ? COLORS.OBSTACLE_GREEN : COLORS.OBSTACLE_RED;
      
      // Top Bar
      ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, 0, obs.width, obs.topHeight);

      // Bottom Bar
      const bottomY = obs.topHeight + OBSTACLE_GAP;
      const bottomH = GAME_HEIGHT - bottomY;
      ctx.fillRect(obs.x, bottomY, obs.width, bottomH);
      ctx.strokeRect(obs.x, bottomY, obs.width, bottomH);

      // Add "Candlestick" wicks
      ctx.fillStyle = '#fff';
      ctx.fillRect(obs.x + obs.width/2 - 1, obs.topHeight - 20, 2, 20); 
      ctx.fillRect(obs.x + obs.width/2 - 1, bottomY, 2, 20); 
    });
  };

  const drawPowerUps = (ctx: CanvasRenderingContext2D) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Large font size for visibility (approx 6x original 8px)
    ctx.font = 'bold 36px "Press Start 2P"'; 

    powerUpsRef.current.forEach(p => {
      // Bobbing animation
      const bobOffset = Math.sin(frameCountRef.current * 0.1) * 5;
      
      // 1. Draw The Coin/Orb
      ctx.fillStyle = p.color; // Use the specific color for the type
      ctx.beginPath();
      ctx.arc(p.x, p.y + bobOffset, p.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Border for orb
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Shine effect on orb
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(p.x - 5, p.y + bobOffset - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw The Text BELOW the orb
      // Position: center x, y = orb bottom + padding
      const textY = p.y + bobOffset + p.width/2 + 35; 
      
      // Stroke for readability (black outline)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 6;
      ctx.strokeText(p.text, p.x, textY);
      
      // Fill text (White to pop)
      ctx.fillStyle = 'white';
      ctx.fillText(p.text, p.x, textY);
    });
  };

  const drawCEO = (ctx: CanvasRenderingContext2D) => {
    const ceo = ceoRef.current;
    
    ctx.save();
    ctx.translate(ceo.x + ceo.width / 2, ceo.y + ceo.height / 2);
    ctx.rotate(ceo.rotation);
    
    const img = gameState === GameState.GAME_OVER ? imagesRef.current.crash : imagesRef.current.fly;

    if (gameState === GameState.GAME_OVER) {
       ctx.filter = 'grayscale(100%) sepia(30%) brightness(80%)'; 
    }

    if (img && img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, -ceo.width / 2, -ceo.height / 2, ceo.width, ceo.height);
    } else {
        // Fallback
        ctx.fillStyle = gameState === GameState.GAME_OVER ? 'red' : 'blue';
        ctx.fillRect(-ceo.width / 2, -ceo.height / 2, ceo.width, ceo.height);
    }
    
    // Draw Speed Lines if boosted
    if (speedBoostTimerRef.current > 0 && gameState === GameState.PLAYING) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-ceo.width, -10);
        ctx.lineTo(-ceo.width - 20, -10);
        ctx.moveTo(-ceo.width - 5, 10);
        ctx.lineTo(-ceo.width - 30, 10);
        ctx.stroke();
    }

    ctx.filter = 'none';
    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full h-full object-contain"
    />
  );
};

export default GameCanvas;
