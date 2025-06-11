
import React from 'react';
import { cn } from '@/lib/utils';

interface PitchGaugeProps {
  cents: number;
  isActive: boolean;
  targetNote?: string;
}

export const PitchGauge: React.FC<PitchGaugeProps> = ({ 
  cents, 
  isActive, 
  targetNote 
}) => {
  // Clamp cents to display range (-50 to +50)
  const clampedCents = Math.max(-50, Math.min(50, cents));
  
  // Calculate needle position (0 to 100, where 50 is center)
  const needlePosition = 50 + (clampedCents / 50) * 40; // 40% range on each side
  
  // Determine if in tune (within ±10 cents)
  const isInTune = Math.abs(cents) <= 10;
  const isFlat = cents < -10;
  const isSharp = cents > 10;

  return (
    <div className="flex flex-col items-center space-y-4">
      {targetNote && (
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Target Note</div>
          <div className="text-2xl font-bold text-primary">{targetNote}</div>
        </div>
      )}
      
      <div className="relative w-80 h-40">
        {/* Gauge background */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-yellow-400 to-red-500 rounded-lg opacity-80">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-800 transform -translate-x-0.5" />
          
          {/* Tick marks */}
          <div className="absolute left-1/4 top-0 w-0.5 h-3 bg-gray-600" />
          <div className="absolute right-1/4 top-0 w-0.5 h-3 bg-gray-600" />
          
          {/* Labels */}
          <div className="absolute left-4 -bottom-6 text-xs text-red-600 font-medium">Flat</div>
          <div className="absolute left-1/2 -bottom-6 text-xs text-green-600 font-medium transform -translate-x-1/2">In Tune</div>
          <div className="absolute right-4 -bottom-6 text-xs text-red-600 font-medium">Sharp</div>
        </div>
        
        {/* Needle */}
        {isActive && (
          <div 
            className="absolute bottom-20 w-1 h-16 transition-all duration-150 ease-out transform -translate-x-0.5"
            style={{ left: `${needlePosition}%` }}
          >
            <div className={cn(
              "w-full h-full rounded-full shadow-lg",
              isInTune && "bg-green-600",
              isFlat && "bg-red-500",
              isSharp && "bg-red-500",
              !isInTune && !isFlat && !isSharp && "bg-yellow-500"
            )} />
            
            {/* Needle tip */}
            <div className={cn(
              "absolute -bottom-2 left-1/2 w-3 h-3 transform -translate-x-1/2 rotate-45 shadow-lg",
              isInTune && "bg-green-600",
              isFlat && "bg-red-500",
              isSharp && "bg-red-500",
              !isInTune && !isFlat && !isSharp && "bg-yellow-500"
            )} />
          </div>
        )}
      </div>
      
      {/* Cent display */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground">Cents</div>
        <div className={cn(
          "text-xl font-mono font-bold",
          isInTune && "text-green-600",
          isFlat && "text-red-500",
          isSharp && "text-red-500",
          !isActive && "text-muted-foreground"
        )}>
          {isActive ? `${cents > 0 ? '+' : ''}${cents}` : '--'}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center space-x-2">
        <div className={cn(
          "w-3 h-3 rounded-full transition-colors",
          isActive && isInTune && "bg-green-500 animate-pulse",
          isActive && !isInTune && "bg-red-500",
          !isActive && "bg-gray-300"
        )} />
        <span className="text-sm font-medium">
          {!isActive && "Listening..."}
          {isActive && isInTune && "Perfect!"}
          {isActive && isFlat && "Too Flat"}
          {isActive && isSharp && "Too Sharp"}
        </span>
      </div>
    </div>
  );
};
