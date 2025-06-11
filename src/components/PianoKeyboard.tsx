
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAudioContext } from '@/hooks/useAudioContext';

interface Note {
  name: string;
  frequency: number;
  isSharp: boolean;
}

export const PianoKeyboard = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [currentOctave, setCurrentOctave] = useState(4);
  const { audioContext, initializeAudio, isAudioEnabled } = useAudioContext();

  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const currentOscillators = useRef<Set<OscillatorNode>>(new Set());

  // Generate notes for current octave
  const generateNotes = (octave: number): Note[] => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseFrequency = 261.63 * Math.pow(2, octave - 4); // C4 = 261.63 Hz
    
    return noteNames.map((noteName, i) => ({
      name: `${noteName}${octave}`,
      frequency: baseFrequency * Math.pow(2, i / 12),
      isSharp: noteName.includes('#')
    }));
  };

  const notes = generateNotes(currentOctave);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    
    if (Math.abs(deltaX) > 50) {
      isDragging.current = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null) {
      touchStartX.current = null;
      isDragging.current = false;
      return;
    }
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    
    if (Math.abs(deltaX) > 80) {
      if (deltaX > 0 && currentOctave > 1) {
        setCurrentOctave(prev => prev - 1);
      } else if (deltaX < 0 && currentOctave < 7) {
        setCurrentOctave(prev => prev + 1);
      }
    }
    
    touchStartX.current = null;
    isDragging.current = false;
  };

  const stopAllSounds = () => {
    currentOscillators.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    currentOscillators.current.clear();
    setIsPlaying(null);
  };

  const playNote = async (frequency: number, noteName: string) => {
    if (isMuted) return;

    let context = audioContext;
    if (!context || !isAudioEnabled) {
      context = await initializeAudio();
      if (!context) return;
    }

    try {
      // Stop any currently playing note
      stopAllSounds();

      // Create oscillator and gain
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Set frequency and wave type
      oscillator.frequency.value = frequency;
      oscillator.type = 'triangle';

      // Set volume with smooth envelope
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);

      // Start playing
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 1.5);

      // Track oscillator
      currentOscillators.current.add(oscillator);
      
      // Clean up when done
      oscillator.onended = () => {
        currentOscillators.current.delete(oscillator);
        if (currentOscillators.current.size === 0) {
          setIsPlaying(null);
        }
      };

      setIsPlaying(noteName);
      console.log(`Playing note: ${noteName} at ${frequency.toFixed(2)}Hz`);

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const changeOctave = (direction: 'up' | 'down') => {
    setCurrentOctave(prev => {
      if (direction === 'up' && prev < 7) return prev + 1;
      if (direction === 'down' && prev > 1) return prev - 1;
      return prev;
    });
  };

  const whiteKeys = notes.filter(note => !note.isSharp);
  const blackKeys = notes.filter(note => note.isSharp);

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          {!isAudioEnabled && (
            <Button
              onClick={initializeAudio}
              variant="outline"
              size="sm"
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Enable Audio
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Octave Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeOctave('down')}
          disabled={currentOctave <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Lower
        </Button>
        
        <div className="text-center">
          <div className="text-lg font-semibold">Octave {currentOctave}</div>
          <div className="text-sm text-muted-foreground">Swipe to change</div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeOctave('up')}
          disabled={currentOctave >= 7}
        >
          Higher
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Piano Keyboard */}
      <div 
        className="relative w-full bg-gray-900 p-2 rounded-lg shadow-2xl select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="relative h-48 flex">
          {/* White Keys */}
          {whiteKeys.map((note, index) => (
            <button
              key={note.name}
              className={`flex-1 h-full mx-0.5 rounded-b-md border transition-all ${
                isPlaying === note.name
                  ? 'bg-gray-300 scale-95 shadow-inner'
                  : 'bg-white hover:bg-gray-50 shadow-lg'
              }`}
              onMouseDown={() => playNote(note.frequency, note.name)}
              onTouchStart={(e) => {
                if (!isDragging.current) {
                  e.preventDefault();
                  playNote(note.frequency, note.name);
                }
              }}
            >
              <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                {note.name.replace(/\d/, '')}
              </span>
            </button>
          ))}

          {/* Black Keys */}
          <div className="absolute top-0 left-0 w-full h-2/3 flex pointer-events-none">
            {whiteKeys.map((whiteNote, whiteIndex) => {
              const noteWithoutOctave = whiteNote.name.replace(/\d/, '');
              const hasBlackKeyAfter = ['C', 'D', 'F', 'G', 'A'].includes(noteWithoutOctave);
              
              if (!hasBlackKeyAfter) {
                return <div key={whiteNote.name} className="flex-1" />;
              }

              const blackKeyName = noteWithoutOctave + '#' + whiteNote.name.match(/\d/)?.[0];
              const blackKey = blackKeys.find(key => key.name === blackKeyName);

              return (
                <div key={whiteNote.name} className="flex-1 relative">
                  {blackKey && (
                    <button
                      className={`absolute w-8 h-full rounded-b-md transition-all pointer-events-auto ${
                        isPlaying === blackKey.name
                          ? 'bg-gray-600 scale-95 shadow-inner'
                          : 'bg-black hover:bg-gray-800 shadow-xl'
                      }`}
                      style={{
                        right: '-16px',
                        zIndex: 10
                      }}
                      onMouseDown={() => playNote(blackKey.frequency, blackKey.name)}
                      onTouchStart={(e) => {
                        if (!isDragging.current) {
                          e.preventDefault();
                          playNote(blackKey.frequency, blackKey.name);
                        }
                      }}
                    >
                      <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-white">
                        {blackKey.name.replace(/\d/, '')}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Tap keys to play • Swipe left/right to change octaves</p>
        <p className="mt-1">Current: Piano • Octave {currentOctave}</p>
      </div>
    </div>
  );
};
