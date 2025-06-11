
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square } from 'lucide-react';
import { KaraokeTrack } from '@/types/karaoke';

interface RecordingControlsProps {
  isRecording: boolean;
  selectedTrack: KaraokeTrack | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  selectedTrack,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={onStartRecording}
              disabled={!selectedTrack}
              size="lg"
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center disabled:bg-gray-300"
            >
              <Mic className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              onClick={onStopRecording}
              size="lg"
              className="w-20 h-20 rounded-full bg-gray-500 hover:bg-gray-600 flex items-center justify-center"
            >
              <Square className="h-8 w-8" />
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold">Recording karaoke...</span>
            </div>
            <p className="text-sm text-gray-600">Sing along to the track!</p>
          </div>
        )}

        {!isRecording && !selectedTrack && (
          <p className="text-gray-600">Upload and select a track to start your karaoke session</p>
        )}

        {!isRecording && selectedTrack && (
          <p className="text-gray-600">Tap the microphone to start recording while the track plays</p>
        )}
      </div>
    </Card>
  );
};
