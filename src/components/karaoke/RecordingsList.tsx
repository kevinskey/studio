
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Recording } from '@/types/karaoke';

interface RecordingsListProps {
  recordings: Recording[];
}

export const RecordingsList: React.FC<RecordingsListProps> = ({ recordings }) => {
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!recordingAudioRef.current) {
    recordingAudioRef.current = new Audio();
    recordingAudioRef.current.preload = "metadata";
  }

  const playRecording = (recording: Recording) => {
    if (recordingAudioRef.current) {
      recordingAudioRef.current.src = recording.url;
      recordingAudioRef.current.play().catch(error => {
        console.error('Error playing recording:', error);
        toast.error('Failed to play recording');
      });
    }
  };

  const downloadRecording = async (recording: Recording) => {
    try {
      const link = document.createElement('a');
      link.href = recording.url;
      link.download = `${recording.name}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Recording downloaded!');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (recordings.length === 0) {
    return null;
  }

  return (
    <>
      <audio ref={recordingAudioRef} className="hidden" />
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Karaoke Recordings</h3>
        <div className="space-y-3">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{recording.name}</div>
                <div className="text-sm text-gray-600">
                  {formatDate(recording.timestamp)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => playRecording(recording)}>
                  <Play className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadRecording(recording)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};
