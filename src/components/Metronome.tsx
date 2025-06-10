import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useAudioContext } from '@/hooks/useAudioContext';

export const Metronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [meterSignature, setMeterSignature] = useState(4); // Bottom number of time signature
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { audioContext, initializeAudio } = useAudioContext();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const playClick = async (isAccent = false) => {
    let context = audioContext;
    if (!context) {
      context = await initializeAudio();
      if (!context) return;
    }

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(
        isAccent ? 880 : 440,
        context.currentTime
      );
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const startMetronome = () => {
    if (intervalRef.current) return;

    // Calculate interval based on meter signature (note value)
    const noteValue = 4 / meterSignature; // quarter note = 1, eighth note = 0.5, etc.
    const interval = (60000 / bpm) * noteValue;
    
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
  }, [bpm, timeSignature, meterSignature]);

  const getTimeSignatureDisplay = () => {
    return `${timeSignature}/${meterSignature}`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-purple-600 mb-4">
          {bpm}
        </div>
        <div className="text-lg text-gray-600 mb-2">BPM</div>
        <div className="text-2xl font-semibold text-gray-700">
          {getTimeSignatureDisplay()}
        </div>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Beats per Measure</label>
            <Select value={timeSignature.toString()} onValueChange={(value) => setTimeSignature(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="12">12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Note Value</label>
            <Select value={meterSignature.toString()} onValueChange={(value) => setMeterSignature(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Whole (1)</SelectItem>
                <SelectItem value="2">Half (2)</SelectItem>
                <SelectItem value="4">Quarter (4)</SelectItem>
                <SelectItem value="8">Eighth (8)</SelectItem>
                <SelectItem value="16">Sixteenth (16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <p className="mt-2 font-medium">Time Signature: {getTimeSignatureDisplay()}</p>
      </div>
    </div>
  );
};
