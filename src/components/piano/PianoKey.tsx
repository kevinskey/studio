
import React, { useRef, useCallback } from 'react';
import { Note } from './types';

interface PianoKeyProps {
  note: Note;
  isPlaying: boolean;
  onPlay: (frequency: number, noteName: string) => void;
  onStop: (noteName: string) => void;
  isMobile?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const PianoKey: React.FC<PianoKeyProps> = ({
  note,
  isPlaying,
  onPlay,
  onStop,
  isMobile = false,
  style,
  className
}) => {
  const keyRef = useRef<HTMLButtonElement>(null);
  const isPlayingRef = useRef(false);

  const baseClasses = "relative transition-all duration-100 ease-out touch-manipulation select-none focus:outline-none";
  
  const whiteKeyClasses = isPlaying
    ? 'bg-gradient-to-b from-blue-200 via-blue-300 to-blue-100 transform scale-95 shadow-inner border-2 border-blue-400'
    : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 shadow-lg hover:shadow-xl active:from-blue-200 active:via-blue-300 active:to-blue-100 active:scale-95 border-2 border-gray-300';

  const blackKeyClasses = isPlaying
    ? 'bg-gradient-to-b from-purple-600 via-purple-700 to-purple-500 transform scale-95 shadow-inner border-2 border-purple-400'
    : 'bg-gradient-to-b from-gray-800 via-gray-900 to-black hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 shadow-xl hover:shadow-2xl active:from-purple-600 active:via-purple-700 active:to-purple-500 active:scale-95 border-2 border-gray-600';

  const keyClasses = note.isSharp 
    ? `${baseClasses} ${blackKeyClasses} rounded-b-xl pointer-events-auto z-10 absolute top-0`
    : `${baseClasses} ${whiteKeyClasses} border-r border-gray-300 rounded-b-xl`;

  const textColor = note.isSharp ? 'text-white' : 'text-gray-600';
  const noteDisplay = note.name.replace(/\d/, '');

  const startPlaying = useCallback(() => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      onPlay(note.frequency, note.name);
    }
  }, [note.frequency, note.name, onPlay]);

  const stopPlaying = useCallback(() => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      onStop(note.name);
    }
  }, [note.name, onStop]);

  const handleMouseDown = useCallback(() => {
    startPlaying();
  }, [startPlaying]);

  const handleMouseUp = useCallback(() => {
    stopPlaying();
  }, [stopPlaying]);

  const handleMouseLeave = useCallback(() => {
    stopPlaying();
  }, [stopPlaying]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startPlaying();
  }, [startPlaying]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopPlaying();
  }, [stopPlaying]);

  // Enhanced touch handling for mobile
  const touchEvents = isMobile ? {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  } : {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };

  const mouseEvents = {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };

  return (
    <button
      ref={keyRef}
      className={`${keyClasses} ${className || ''}`}
      style={style}
      {...mouseEvents}
      {...touchEvents}
    >
      <span 
        className={`absolute ${note.isSharp ? 'bottom-3' : 'bottom-4'} left-1/2 transform -translate-x-1/2 ${isMobile ? 'text-sm' : 'text-xs'} ${textColor} font-bold pointer-events-none drop-shadow-sm`}
      >
        {noteDisplay}
      </span>
      
      {/* Visual feedback ring for mobile */}
      {isMobile && isPlaying && (
        <div className="absolute inset-0 rounded-b-xl border-4 border-blue-400 pointer-events-none animate-pulse" />
      )}
    </button>
  );
};
