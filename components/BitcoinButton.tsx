import React from 'react';

interface BitcoinButtonProps {
  onClick: () => void;
  label?: string;
}

const BitcoinButton: React.FC<BitcoinButtonProps> = ({ onClick, label = "START" }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center transition-transform active:scale-95"
    >
      {/* Outer Coin Ring */}
      <div className="w-24 h-24 bg-yellow-500 rounded-full border-4 border-yellow-700 shadow-[0_4px_0_rgb(161,98,7)] flex items-center justify-center relative overflow-hidden group-hover:brightness-110">
        
        {/* Inner Detail */}
        <div className="w-20 h-20 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center">
             <span className="text-4xl font-bold text-yellow-800 drop-shadow-md leading-none pb-1">₿</span>
        </div>
        
        {/* Shine effect */}
        <div className="absolute top-2 left-4 w-6 h-3 bg-white opacity-40 rounded-full rotate-[-45deg]"></div>
      </div>
      
      {/* Text Label */}
      <div className="mt-4 bg-white px-4 py-2 border-2 border-black shadow-[4px_4px_0_black]">
        <span className="text-black font-bold tracking-widest text-sm uppercase">{label}</span>
      </div>
    </button>
  );
};

export default BitcoinButton;