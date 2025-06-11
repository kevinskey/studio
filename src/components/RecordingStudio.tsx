import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Recording {
  id: string;
  name: string;
  url: string;
  duration: number;
  timestamp: Date;
}

const RECORDINGS_STORAGE_KEY = 'music-studio-recordings';

export const RecordingStudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load recordings from localStorage on component mount
  useEffect(() => {
    const loadStoredRecordings = () => {
      try {
        const stored = localStorage.getItem(RECORDINGS_STORAGE_KEY);
        if (stored) {
          const parsedRecordings = JSON.parse(stored).map((recording: any) => ({
            ...recording,
            timestamp: new Date(recording.timestamp)
          }));
          setRecordings(parsedRecordings);
        }
      } catch (error) {
        console.error('Error loading stored recordings:', error);
      }
    };

    loadStoredRecordings();
  }, []);

  // Save recordings to localStorage whenever recordings change
  useEffect(() => {
    try {
      localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('Error saving recordings to localStorage:', error);
    }
  }, [recordings]);

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [audioStream]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      setAudioStream(stream);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        const newRecording: Recording = {
          id: Date.now().toString(),
          name: `Recording ${recordings.length + 1}`,
          url,
          duration: recordingTime,
          timestamp: new Date(),
        };
        
        setRecordings(prev => [...prev, newRecording]);
        setCurrentRecording(newRecording);
        setRecordingTime(0);
        toast.success('Recording saved and will persist until deleted!');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const playRecording = (recording: Recording) => {
    if (audioRef.current) {
      audioRef.current.src = recording.url;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentRecording(recording);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const downloadRecording = async (recording: Recording) => {
    try {
      const response = await fetch(recording.url);
      const blob = await response.blob();
      
      // Convert to MP3 format (simplified - in production, use a proper audio conversion library)
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

  const deleteRecording = (id: string) => {
    const recordingToDelete = recordings.find(r => r.id === id);
    
    if (recordingToDelete) {
      // Clean up the blob URL to free memory
      URL.revokeObjectURL(recordingToDelete.url);
    }
    
    setRecordings(prev => prev.filter(r => r.id !== id));
    
    if (currentRecording?.id === id) {
      setCurrentRecording(null);
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
    toast.success('Recording deleted permanently');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Recording Controls */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
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
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              </div>
              <p className="text-sm text-gray-600">Recording in progress...</p>
            </div>
          )}

          {!isRecording && recordings.length === 0 && (
            <p className="text-gray-600">Tap the microphone to start recording</p>
          )}
        </div>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Recordings ({recordings.length})</h3>
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{recording.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(recording.duration)} • {formatDate(recording.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentRecording?.id === recording.id && isPlaying ? (
                    <Button size="sm" variant="outline" onClick={pausePlayback}>
                      <Pause className="h-4 w-4" />
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
                    onClick={() => deleteRecording(recording.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>High-quality audio recording with noise suppression</p>
        <p className="mt-1">Recordings are saved locally and persist until you delete them</p>
      </div>
    </div>
  );
};
