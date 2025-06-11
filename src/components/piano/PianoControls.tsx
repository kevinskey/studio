import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Square } from 'lucide-react';
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
  onPanic?: () => void;
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
  onPanic,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Top row - Instrument and Volume */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-medium whitespace-nowrap">Instrument:</span>
            <Select value={selectedInstrument} onValueChange={(value) => setSelectedInstrument(value as InstrumentType)}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(instruments).map(([key, instrument]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 p-0"
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
            {onPanic && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onPanic}
                className="h-8 w-8 p-0"
                title="Stop all notes"
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom row - Octave controls */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-medium">Octave:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOctave(Math.max(1, currentOctave - 1))}
              disabled={currentOctave <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs font-mono min-w-[40px] text-center">
              {currentOctave}-{currentOctave + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOctave(Math.min(6, currentOctave + 1))}
              disabled={currentOctave >= 6}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout - unchanged
  const controlsClass = "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg";

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
            <span className="w-16 text-center font-mono">C{currentOctave}-C{currentOctave + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentOctave(Math.min(6, currentOctave + 1))}
              disabled={currentOctave >= 6}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onPanic && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onPanic}
            className="flex items-center gap-2"
            title="Stop all playing notes (Panic)"
          >
            <Square className="h-4 w-4" />
            Panic
          </Button>
        )}
        
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
