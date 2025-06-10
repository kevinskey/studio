import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudioContext } from '@/hooks/useAudioContext';

interface PitchNote {
  name: string;
  frequency: number;
  color: string;
}

export const PitchPipe = () => {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const { audioContext, initializeAudio } = useAudioContext();
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const notes: PitchNote[] = [
    { name: 'C', frequency: 261.63, color: 'bg-red-500' },
    { name: 'C#', frequency: 277.18, color: 'bg-red-600' },
    { name: 'D', frequency: 293.66, color: 'bg-orange-500' },
    { name: 'D#', frequency: 311.13, color: 'bg-orange-600' },
    { name: 'E', frequency: 329.63, color: 'bg-yellow-500' },
    { name: 'F', frequency: 349.23, color: 'bg-green-500' },
    { name: 'F#', frequency: 369.99, color: 'bg-green-600' },
    { name: 'G', frequency: 392.00, color: 'bg-blue-500' },
    { name: 'G#', frequency: 415.30, color: 'bg-blue-600' },
    { name: 'A', frequency: 440.00, color: 'bg-purple-500' },
    { name: 'A#', frequency: 466.16, color: 'bg-purple-600' },
    { name: 'B', frequency: 493.88, color: 'bg-pink-500' },
  ];

  const startTone = async (frequency: number, noteName: string) => {
    let context = audioContext;
    if (!context || isMuted) {
      context = await initializeAudio();
      if (!context || isMuted) return;
    }

    stopTone();

    try {
      oscillatorRef.current = context.createOscillator();
      gainNodeRef.current = context.createGain();

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(context.destination);

      oscillatorRef.current.frequency.setValueAtTime(frequency, context.currentTime);
      oscillatorRef.current.type = 'sine';

      gainNodeRef.current.gain.setValueAtTime(0, context.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(volume * 0.3, context.currentTime + 0.1);

      oscillatorRef.current.start(context.currentTime);

      setSelectedNote(noteName);
      setIsPlaying(true);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
    setSelectedNote(null);
  };

  const toggleTone = (frequency: number, noteName: string) => {
    if (isPlaying && selectedNote === noteName) {
      stopTone();
    } else {
      startTone(frequency, noteName);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select a pitch reference</h3>
        <p className="text-sm text-gray-600">Tap and hold to play continuous tone</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
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

      <div className="grid grid-cols-3 gap-3">
        {notes.map((note) => (
          <Button
            key={note.name}
            className={`h-16 text-white font-bold text-lg transition-all duration-200 ${note.color} ${
              selectedNote === note.name && isPlaying
                ? 'ring-4 ring-white ring-opacity-50 scale-95'
                : 'hover:scale-105'
            }`}
            onMouseDown={() => toggleTone(note.frequency, note.name)}
            onMouseUp={stopTone}
            onMouseLeave={stopTone}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleTone(note.frequency, note.name);
            }}
            onTouchEnd={stopTone}
          >
            {note.name}
          </Button>
        ))}
      </div>

      {selectedNote && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 mb-1">{selectedNote}</div>
          <div className="text-sm text-gray-600">
            {notes.find(n => n.name === selectedNote)?.frequency.toFixed(2)} Hz
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>Perfect for tuning instruments or vocal warm-ups</p>
        <p className="mt-1">Based on A4 = 440 Hz standard tuning</p>
      </div>
    </div>
  );
};
