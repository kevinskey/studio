
import React from 'react';
import { Note } from './types';
import { PianoKey } from './PianoKey';

interface PianoKeyboardProps {
  notes: Note[];
  isPlaying: string | null;
  onPlayNote: (frequency: number, noteName: string) => void;
  onStopNote: (noteName: string) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  isMobile?: boolean;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  notes,
  isPlaying,
  onPlayNote,
  onStopNote,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isMobile = false
}) => {
  const whiteKeys = notes.filter(note => !note.isSharp);
  const blackKeys = notes.filter(note => note.isSharp);

  const keyboardStyle = isMobile 
    ? {
        '--white-key-width': '14vw',
        '--white-key-height': '35vh',
        '--black-key-width': '8vw',
        '--black-key-height': '22vh'
      }
    : {
        '--white-key-width': '23mm',
        '--white-key-height': '150mm',
        '--black-key-width': '10mm',
        '--black-key-height': '90mm'
      };

  return (
    <div 
      className={`relative ${isMobile ? 'w-screen h-screen overflow-hidden' : 'w-screen -mx-4'} bg-gradient-to-b from-gray-800 to-gray-900 ${isMobile ? 'pt-2 pb-4' : 'p-2'} shadow-2xl`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        .piano-keys {
          --white-key-width: ${keyboardStyle['--white-key-width']};
          --white-key-height: ${keyboardStyle['--white-key-height']};
          --black-key-width: ${keyboardStyle['--black-key-width']};
          --black-key-height: ${keyboardStyle['--black-key-height']};
        }
      `}</style>
      
      {isMobile && (
        <div className="text-center text-white mb-2 px-4">
          <div className="text-sm opacity-80">
            🎹 Touch and hold keys to play • Swipe to change octaves
          </div>
        </div>
      )}
      
      <div className="piano-keys relative w-full flex justify-center" style={{ height: keyboardStyle['--white-key-height'] }}>
        <div className="relative">
          {/* White Keys */}
          <div className="flex">
            {whiteKeys.map((note, index) => (
              <PianoKey
                key={note.name}
                note={note}
                isPlaying={isPlaying === note.name}
                onPlay={onPlayNote}
                onStop={onStopNote}
                isMobile={isMobile}
                style={{
                  width: 'var(--white-key-width)',
                  height: 'var(--white-key-height)',
                  borderLeft: index === 0 ? '2px solid #e5e7eb' : 'none'
                }}
                className="h-full"
              />
            ))}
          </div>

          {/* Black Keys */}
          <div className="absolute top-0 left-0 flex pointer-events-none">
            {whiteKeys.map((whiteNote) => {
              const noteWithoutOctave = whiteNote.name.replace(/\d/, '');
              const hasBlackKeyAfter = ['C', 'D', 'F', 'G', 'A'].includes(noteWithoutOctave);
              
              if (!hasBlackKeyAfter) {
                return (
                  <div 
                    key={whiteNote.name} 
                    style={{ width: 'var(--white-key-width)' }}
                  />
                );
              }

              const blackKeyName = noteWithoutOctave + '#' + whiteNote.name.match(/\d/)?.[0];
              const blackKey = blackKeys.find(key => key.name === blackKeyName);

              return (
                <div 
                  key={whiteNote.name} 
                  className="relative"
                  style={{ width: 'var(--white-key-width)' }}
                >
                  {blackKey && (
                    <PianoKey
                      note={blackKey}
                      isPlaying={isPlaying === blackKey.name}
                      onPlay={onPlayNote}
                      onStop={onStopNote}
                      isMobile={isMobile}
                      style={{
                        width: 'var(--black-key-width)',
                        height: 'var(--black-key-height)',
                        left: 'calc(50% + var(--white-key-width) * 0.3)',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center text-white text-xs opacity-70 px-4">
          <div className="bg-black/30 rounded-lg px-3 py-1">
            Hold keys for sustained notes • Release to stop
          </div>
        </div>
      )}
    </div>
  );
};
