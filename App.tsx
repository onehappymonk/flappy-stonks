import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import BitcoinButton from './components/BitcoinButton';
import { GameState } from './types';
import { ASSETS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [jumpTrigger, setJumpTrigger] = useState(0);
  const [gameKey, setGameKey] = useState(0); // Key to force component remount

  // Handle High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  const handleStart = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
    setGameKey(prev => prev + 1); // Force GameCanvas to remount with fresh refs
    // Initial jump
    setJumpTrigger(prev => prev + 1);
  };

  const handleInteraction = (e: React.TouchEvent | React.MouseEvent | KeyboardEvent) => {
    if (gameState === GameState.PLAYING) {
      // Prevent default to avoid double firing on some touch devices or scrolling
      if ((e as Event).type !== 'keydown') {
        e.preventDefault(); 
      }
      setJumpTrigger(prev => prev + 1);
    } else if (gameState === GameState.GAME_OVER) {
       // Tap to restart quickly
       handleStart();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
             handleStart();
        } else {
             handleInteraction(e);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div 
      className="w-full h-screen bg-slate-900 flex items-center justify-center overflow-hidden"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div className="relative w-full max-w-md h-full max-h-[800px] bg-slate-950 shadow-2xl overflow-hidden border-x-4 border-slate-800">
        
        {/* Game Canvas */}
        {/* Passing gameKey forces the component to destroy and recreate when it changes, resetting all internal refs */}
        <GameCanvas 
          key={gameKey}
          gameState={gameState} 
          setGameState={setGameState} 
          setScore={setScore}
          triggerJump={jumpTrigger}
        />

        {/* UI Overlay: Score (Always visible when playing) */}
        {gameState === GameState.PLAYING && (
          <div className="absolute top-10 left-0 w-full text-center pointer-events-none">
            <span className="text-6xl text-white font-bold drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black">
              {score}
            </span>
          </div>
        )}

        {/* Title Screen */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-sm"
               onMouseDown={(e) => e.stopPropagation()} // Prevent auto-start when clicking UI
               onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex flex-col items-center animate-bounce">
              <h1 className="text-4xl md:text-5xl text-green-400 font-bold text-center mb-2 drop-shadow-[4px_4px_0_#000]">
                FLAPPY
              </h1>
              <h1 className="text-4xl md:text-5xl text-red-500 font-bold text-center drop-shadow-[4px_4px_0_#000]">
                STONKS
              </h1>
            </div>
            
            {/* Character Preview */}
            <div className="mb-10 p-4 border-4 border-white bg-slate-800 rounded-lg shadow-lg">
                <img src={ASSETS.CEO_FLYING} alt="CEO" className="w-16 h-16 object-contain pixelated" style={{imageRendering: 'pixelated'}} />
            </div>

            <BitcoinButton onClick={handleStart} label="START" />
            
            <p className="mt-8 text-gray-400 text-xs text-center px-8">
              Tap screen or Press Space to Fly.<br/>
              Avoid the market volatility!
            </p>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20"
               onMouseDown={(e) => e.stopPropagation()} 
               onTouchStart={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl text-red-500 font-bold mb-4 drop-shadow-[4px_4px_0_#000] text-center">STONKS CRASHED</h2>
            
            <div className="bg-slate-800 border-4 border-white p-6 rounded-lg text-center mb-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
              <div className="mb-2 text-yellow-400 text-sm">SCORE</div>
              <div className="text-4xl text-white mb-4">{score}</div>
              
              <div className="mb-2 text-green-400 text-sm">BEST</div>
              <div className="text-2xl text-white">{highScore}</div>
            </div>

            <BitcoinButton onClick={handleStart} label="RETRY" />
            <p className="mt-8 text-gray-500 text-xs text-center">Tap anywhere to retry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;