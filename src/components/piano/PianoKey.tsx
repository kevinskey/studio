
import React from 'react';
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
  const baseClasses = "relative transition-all duration-150 ease-out touch-manipulation select-none";
  
  const whiteKeyClasses = isPlaying
    ? 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-100 transform translate-y-1 shadow-inner'
    : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 shadow-lg hover:shadow-xl active:from-gray-200 active:via-gray-300 active:to-gray-100';

  const blackKeyClasses = isPlaying
    ? 'bg-gradient-to-b from-gray-700 via-gray-800 to-gray-600 transform translate-y-1 shadow-inner'
    : 'bg-gradient-to-b from-gray-800 via-gray-900 to-black hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 shadow-xl hover:shadow-2xl';

  const keyClasses = note.isSharp 
    ? `${baseClasses} ${blackKeyClasses} rounded-b-md border border-gray-600 pointer-events-auto z-10 absolute top-0`
    : `${baseClasses} ${whiteKeyClasses} border-r border-gray-300 rounded-b-md`;

  const textColor = note.isSharp ? 'text-white' : 'text-gray-500';

  const handleMouseEvents = {
    onMouseDown: () => onPlay(note.frequency, note.name),
    onMouseUp: () => onStop(note.name),
    onMouseLeave: () => onStop(note.name)
  };

  const handleTouchEvents = {
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      onPlay(note.frequency, note.name);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onStop(note.name);
    }
  };

  return (
    <button
      className={`${keyClasses} ${className || ''}`}
      style={style}
      {...handleMouseEvents}
      {...handleTouchEvents}
    >
      <span className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs ${textColor} font-medium pointer-events-none`}>
        {note.name.replace(/\d/, '')}
      </span>
    </button>
  );
};
