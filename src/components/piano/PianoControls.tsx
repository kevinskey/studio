
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { InstrumentType, instruments } from './types';

interface PianoControlsProps {
  selectedInstrument: InstrumentType;
  setSelectedInstrument: (instrument: InstrumentType) => void;
  currentOctave: number;
  setCurrentOctave: (octave: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isMobile?: boolean;
}

export const PianoControls: React.FC<PianoControlsProps> = ({
  selectedInstrument,
  setSelectedInstrument,
  currentOctave,
  setCurrentOctave,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  isMobile = false
}) => {
  const controlsClass = isMobile 
    ? "flex flex-col gap-3 p-4 bg-muted rounded-lg"
    : "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg";

  return (
    <div className={controlsClass}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Instrument:</span>
          <Select value={selectedInstrument} onValueChange={(value) => setSelectedInstrument(value as InstrumentType)}>
            <SelectTrigger className={isMobile ? "w-32" : "w-40"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(instruments).map(([key, instrument]) => (
                <SelectItem key={key} value={key}>
                  {instrument.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Start Octave:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOctave(Math.max(1, currentOctave - 1))}
              disabled={currentOctave <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center font-mono">C{currentOctave}-C{currentOctave + 2}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOctave(Math.min(5, currentOctave + 1))}
              disabled={currentOctave >= 5}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
            className={isMobile ? "w-16" : "w-20"}
          />
        </div>
      </div>
    </div>
  );
};
