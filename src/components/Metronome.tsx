
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Volume2 } from 'lucide-react';

export const Metronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubdivision, setCurrentSubdivision] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [meterSignature, setMeterSignature] = useState(4); // Bottom number of time signature
  const [isDotted, setIsDotted] = useState(false);
  const [subdivisionEnabled, setSubdivisionEnabled] = useState(false);
  const [subdivisionValue, setSubdivisionValue] = useState(2); // 2 = eighth notes, 4 = sixteenth notes
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

  const playClick = (isAccent = false, isSubdivision = false) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    let frequency = 440; // Default
    if (isAccent) {
      frequency = 880; // High for downbeat
    } else if (isSubdivision) {
      frequency = 330; // Lower for subdivisions
    }

    oscillator.frequency.setValueAtTime(
      frequency,
      audioContextRef.current.currentTime
    );
    oscillator.type = 'square';

    const volume = isSubdivision ? 0.05 : 0.1; // Quieter for subdivisions
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const startMetronome = () => {
    if (intervalRef.current) return;

    // Calculate base interval
    let noteValue = 4 / meterSignature; // quarter note = 1, eighth note = 0.5, etc.
    
    // Apply dotted note modifier (adds half the note value)
    if (isDotted) {
      noteValue = noteValue * 1.5;
    }

    const baseInterval = (60000 / bpm) * noteValue;
    
    // Calculate subdivision interval
    const subdivisionInterval = subdivisionEnabled ? baseInterval / subdivisionValue : baseInterval;
    
    intervalRef.current = setInterval(() => {
      if (subdivisionEnabled) {
        setCurrentSubdivision((prevSub) => {
          const nextSub = (prevSub + 1) % subdivisionValue;
          
          if (nextSub === 0) {
            // Main beat
            setCurrentBeat((prevBeat) => {
              const nextBeat = (prevBeat % timeSignature) + 1;
              playClick(nextBeat === 1, false);
              return nextBeat;
            });
          } else {
            // Subdivision
            playClick(false, true);
          }
          
          return nextSub;
        });
      } else {
        setCurrentBeat((prev) => {
          const nextBeat = (prev % timeSignature) + 1;
          playClick(nextBeat === 1);
          return nextBeat;
        });
      }
    }, subdivisionInterval);
  };

  const stopMetronome = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
    setCurrentSubdivision(0);
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
  }, [bpm, timeSignature, meterSignature, isDotted, subdivisionEnabled, subdivisionValue]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTimeSignatureDisplay = () => {
    const noteDisplay = isDotted ? `${meterSignature}.` : meterSignature.toString();
    return `${timeSignature}/${noteDisplay}`;
  };

  const getNoteValueDisplay = (value: string) => {
    const noteNames: { [key: string]: string } = {
      '1': 'Whole',
      '2': 'Half',
      '4': 'Quarter',
      '8': 'Eighth',
      '16': 'Sixteenth'
    };
    return `${noteNames[value]} (${value})`;
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
                <SelectItem value="1">{getNoteValueDisplay('1')}</SelectItem>
                <SelectItem value="2">{getNoteValueDisplay('2')}</SelectItem>
                <SelectItem value="4">{getNoteValueDisplay('4')}</SelectItem>
                <SelectItem value="8">{getNoteValueDisplay('8')}</SelectItem>
                <SelectItem value="16">{getNoteValueDisplay('16')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Dotted Notes</label>
          <Switch
            checked={isDotted}
            onCheckedChange={setIsDotted}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Subdivision Clicks</label>
          <Switch
            checked={subdivisionEnabled}
            onCheckedChange={setSubdivisionEnabled}
          />
        </div>

        {subdivisionEnabled && (
          <div>
            <label className="block text-sm font-medium mb-2">Subdivision</label>
            <Select value={subdivisionValue.toString()} onValueChange={(value) => setSubdivisionValue(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Eighth Notes (2)</SelectItem>
                <SelectItem value="3">Triplets (3)</SelectItem>
                <SelectItem value="4">Sixteenth Notes (4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
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
            {subdivisionEnabled && currentBeat === i + 1 && (
              <div className="absolute -bottom-6 flex space-x-1">
                {Array.from({ length: subdivisionValue }, (_, subI) => (
                  <div
                    key={subI}
                    className={`w-2 h-2 rounded-full ${
                      currentSubdivision === subI ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600">
        <p>Red circle = Strong beat (downbeat)</p>
        <p>Blue circle = Regular beat</p>
        {subdivisionEnabled && <p>Green dots = Subdivision clicks</p>}
        <p className="mt-2 font-medium">Time Signature: {getTimeSignatureDisplay()}</p>
      </div>
    </div>
  );
};
