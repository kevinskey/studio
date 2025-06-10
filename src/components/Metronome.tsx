
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, Volume2 } from 'lucide-react';

export const Metronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playClick = (isAccent = false) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.setValueAtTime(
      isAccent ? 880 : 440,
      audioContextRef.current.currentTime
    );
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const startMetronome = () => {
    if (intervalRef.current) return;

    const interval = 60000 / bpm;
    intervalRef.current = setInterval(() => {
      setCurrentBeat((prev) => {
        const nextBeat = (prev % timeSignature) + 1;
        playClick(nextBeat === 1);
        return nextBeat;
      });
    }, interval);
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
  };

  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, timeSignature]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-purple-600 mb-4">
          {bpm}
        </div>
        <div className="text-lg text-gray-600 mb-2">BPM</div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tempo (BPM)</label>
          <Input
            type="number"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
            className="text-center text-lg"
          />
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Time Signature</label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="2">2/4</option>
            <option value="3">3/4</option>
            <option value="4">4/4</option>
            <option value="6">6/8</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={toggleMetronome}
          size="lg"
          className="w-20 h-20 rounded-full flex items-center justify-center"
        >
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </Button>
      </div>

      <div className="flex justify-center space-x-2 mb-4">
        {Array.from({ length: timeSignature }, (_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold ${
              currentBeat === i + 1
                ? i === 0
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Red circle = Strong beat (downbeat)</p>
        <p>Blue circle = Regular beat</p>
      </div>
    </div>
  );
};
