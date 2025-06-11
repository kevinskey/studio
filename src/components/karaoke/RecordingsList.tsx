
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Download, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Recording } from '@/types/karaoke';

interface RecordingsListProps {
  recordings: Recording[];
  onDeleteRecording: (recordingId: string) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({ 
  recordings, 
  onDeleteRecording 
}) => {
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

  if (!recordingAudioRef.current) {
    recordingAudioRef.current = new Audio();
    recordingAudioRef.current.preload = "metadata";
    
    recordingAudioRef.current.onended = () => {
      setPlayingRecordingId(null);
    };
  }

  const playRecording = (recording: Recording) => {
    if (recordingAudioRef.current) {
      recordingAudioRef.current.src = recording.url;
      recordingAudioRef.current.play().then(() => {
        setPlayingRecordingId(recording.id);
      }).catch(error => {
        console.error('Error playing recording:', error);
        toast.error('Failed to play recording');
      });
    }
  };

  const stopRecording = () => {
    if (recordingAudioRef.current) {
      recordingAudioRef.current.pause();
      recordingAudioRef.current.currentTime = 0;
      setPlayingRecordingId(null);
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

  const handleDeleteRecording = (recording: Recording) => {
    if (!confirm(`Are you sure you want to delete "${recording.name}"? This action cannot be undone.`)) {
      return;
    }

    // Stop playback if this recording is currently playing
    if (playingRecordingId === recording.id) {
      stopRecording();
    }

    // Clean up the blob URL
    if (recording.url.startsWith('blob:')) {
      URL.revokeObjectURL(recording.url);
    }

    onDeleteRecording(recording.id);
    toast.success('Recording deleted');
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
                {playingRecordingId === recording.id ? (
                  <Button size="sm" variant="outline" onClick={stopRecording}>
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => playRecording(recording)}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadRecording(recording)}
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteRecording(recording)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};
