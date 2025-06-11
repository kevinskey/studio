
import React from 'react';
import { Card } from '@/components/ui/card';
import { Volume2, Mic } from 'lucide-react';

interface VolumeControlsProps {
  trackVolume: number;
  micVolume: number;
  onTrackVolumeChange: (volume: number) => void;
  onMicVolumeChange: (volume: number) => void;
}

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  trackVolume,
  micVolume,
  onTrackVolumeChange,
  onMicVolumeChange
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Volume Mixer</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Volume2 className="h-4 w-4" />
          <span className="w-16 text-sm">Track:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={trackVolume}
            onChange={(e) => onTrackVolumeChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-8 text-sm">{Math.round(trackVolume * 100)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <Mic className="h-4 w-4" />
          <span className="w-16 text-sm">Voice:</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={micVolume}
            onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-8 text-sm">{Math.round(micVolume * 100)}%</span>
        </div>
      </div>
    </Card>
  );
};
