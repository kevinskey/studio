
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Volume2 } from 'lucide-react';
import { useAudioContext } from '@/hooks/useAudioContext';

export const AudioResetButton = () => {
  const { isAudioEnabled, initializeAudio, resetAudio } = useAudioContext();

  return (
    <div className="flex items-center gap-2">
      {!isAudioEnabled ? (
        <Button
          onClick={initializeAudio}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Volume2 className="h-4 w-4" />
          Enable Audio
        </Button>
      ) : (
        <Button
          onClick={resetAudio}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Audio
        </Button>
      )}
    </div>
  );
};
