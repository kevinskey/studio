
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
        '--white-key-width': '16mm',
        '--white-key-height': '100mm',
        '--black-key-width': '7mm',
        '--black-key-height': '60mm'
      }
    : {
        '--white-key-width': '23mm',
        '--white-key-height': '150mm',
        '--black-key-width': '10mm',
        '--black-key-height': '90mm'
      };

  return (
    <div 
      className="relative w-screen -mx-4 bg-gray-900 p-2 shadow-2xl"
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
      
      <div className="piano-keys relative w-full" style={{ height: keyboardStyle['--white-key-height'] }}>
        {/* White Keys */}
        <div className="flex w-full h-full">
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
                borderLeft: index === 0 ? '1px solid #d1d5db' : 'none'
              }}
              className="h-full"
            />
          ))}
        </div>

        {/* Black Keys */}
        <div className="absolute top-0 left-0 flex w-full h-full pointer-events-none">
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
                      left: 'calc(50% + var(--white-key-width) * 0.25)',
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
  );
};
