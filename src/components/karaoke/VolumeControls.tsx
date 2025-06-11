
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Mic, Zap } from 'lucide-react';

interface VolumeControlsProps {
  trackVolume: number;
  micVolume: number;
  onTrackVolumeChange: (volume: number) => void;
  onMicVolumeChange: (volume: number) => void;
  autoLevelEnabled: boolean;
  onAutoLevelToggle: (enabled: boolean) => void;
  currentMicLevel?: number;
  currentGain?: number;
}

export const VolumeControls: React.FC<VolumeControlsProps> = ({
  trackVolume,
  micVolume,
  onTrackVolumeChange,
  onMicVolumeChange,
  autoLevelEnabled,
  onAutoLevelToggle,
  currentMicLevel = 0,
  currentGain = 1.0
}) => {
  const [levelMeterValue, setLevelMeterValue] = useState(0);

  // Update level meter display
  useEffect(() => {
    setLevelMeterValue(currentMicLevel * 100);
  }, [currentMicLevel]);

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
            disabled={autoLevelEnabled}
          />
          <span className="w-8 text-sm">{Math.round(micVolume * 100)}%</span>
        </div>

        {/* Auto-Level Control */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Auto Level</span>
            </div>
            <Button
              size="sm"
              variant={autoLevelEnabled ? "default" : "outline"}
              onClick={() => onAutoLevelToggle(!autoLevelEnabled)}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              {autoLevelEnabled ? "ON" : "OFF"}
            </Button>
          </div>

          {/* Level Meter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Input Level:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    levelMeterValue > 80 ? 'bg-red-500' : 
                    levelMeterValue > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(levelMeterValue, 100)}%` }}
                />
              </div>
              <span className="w-8">{Math.round(levelMeterValue)}%</span>
            </div>

            {autoLevelEnabled && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Auto Gain:</span>
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${Math.min((currentGain - 0.1) / 2.9 * 100, 100)}%` }}
                  />
                </div>
                <span className="w-8">{currentGain.toFixed(1)}x</span>
              </div>
            )}
          </div>

          {autoLevelEnabled && (
            <p className="text-xs text-gray-500 mt-2">
              Microphone level is automatically adjusted for optimal recording quality
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
