
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Play, Pause, Square, Download, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
}

interface Recording {
  id: string;
  trackId: string;
  name: string;
  url: string;
  timestamp: Date;
}

export const KaraokeStudio = () => {
  const [selectedTrack, setSelectedTrack] = useState<KaraokeTrack | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingTrack, setIsPlayingTrack] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [trackVolume, setTrackVolume] = useState(0.7);
  const [micVolume, setMicVolume] = useState(1.0);
  
  const trackAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  // Sample karaoke tracks (in a real app, these would be loaded from a server)
  const karaoketracks: KaraokeTrack[] = [
    {
      id: '1',
      title: 'Happy Birthday',
      artist: 'Traditional',
      duration: 30,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCFOh1+/TfSUFKqjQ7N2QO'
    },
    {
      id: '2',
      title: 'Twinkle Twinkle Little Star',
      artist: 'Traditional',
      duration: 45,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCFOh1+/TfSUFKqjQ7N2QO'
    },
    {
      id: '3',
      title: 'Row Row Row Your Boat',
      artist: 'Traditional',
      duration: 40,
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCFOh1+/TfSUFKqjQ7N2QO'
    }
  ];

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream]);

  const selectTrack = (trackId: string) => {
    const track = karaoketracks.find(t => t.id === trackId);
    setSelectedTrack(track || null);
    setIsPlayingTrack(false);
  };

  const toggleTrackPlayback = () => {
    if (!selectedTrack || !trackAudioRef.current) return;

    if (isPlayingTrack) {
      trackAudioRef.current.pause();
      setIsPlayingTrack(false);
    } else {
      trackAudioRef.current.play();
      setIsPlayingTrack(true);
    }
  };

  const startRecording = async () => {
    if (!selectedTrack) {
      toast.error('Please select a track first');
      return;
    }

    try {
      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // Keep natural vocal quality
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      
      setAudioStream(micStream);

      // Create audio context for mixing
      const audioContext = audioContextRef.current!;
      const micSource = audioContext.createMediaStreamSource(micStream);
      
      // Create gain nodes for volume control
      const micGain = audioContext.createGain();
      const trackGain = audioContext.createGain();
      
      micGain.gain.value = micVolume;
      trackGain.gain.value = trackVolume;
      
      // Connect microphone
      micSource.connect(micGain);
      
      // Create destination for mixed audio
      const destination = audioContext.createMediaStreamDestination();
      micGain.connect(destination);
      
      // If track is playing, mix it in
      if (trackAudioRef.current && isPlayingTrack) {
        const trackSource = audioContext.createMediaElementSource(trackAudioRef.current);
        trackSource.connect(trackGain);
        trackGain.connect(destination);
      }
      
      mixedStreamRef.current = destination.stream;
      
      // Create recorder for mixed stream
      const recorder = new MediaRecorder(destination.stream, {
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
          trackId: selectedTrack.id,
          name: `${selectedTrack.title} - Karaoke`,
          url,
          timestamp: new Date(),
        };
        
        setRecordings(prev => [...prev, newRecording]);
        toast.success('Karaoke recording saved!');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Start track playback if not already playing
      if (!isPlayingTrack && trackAudioRef.current) {
        trackAudioRef.current.currentTime = 0;
        trackAudioRef.current.play();
        setIsPlayingTrack(true);
      }
      
      toast.success('Recording started! Sing along to the track');
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
    
    setIsRecording(false);
    setMediaRecorder(null);
    
    // Stop track playback
    if (trackAudioRef.current) {
      trackAudioRef.current.pause();
      setIsPlayingTrack(false);
    }
  };

  const playRecording = (recording: Recording) => {
    if (recordingAudioRef.current) {
      recordingAudioRef.current.src = recording.url;
      recordingAudioRef.current.play();
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <audio
        ref={trackAudioRef}
        onEnded={() => setIsPlayingTrack(false)}
        className="hidden"
      />
      <audio
        ref={recordingAudioRef}
        className="hidden"
      />

      {/* Track Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Your Karaoke Track</h3>
        <Select onValueChange={selectTrack}>
          <SelectTrigger>
            <SelectValue placeholder="Select a song to sing along with" />
          </SelectTrigger>
          <SelectContent>
            {karaoketracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>
                {track.title} - {track.artist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTrack && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selectedTrack.title}</div>
                <div className="text-sm text-gray-600">{selectedTrack.artist}</div>
              </div>
              <Button onClick={toggleTrackPlayback} variant="outline">
                {isPlayingTrack ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlayingTrack ? 'Pause' : 'Preview'}
              </Button>
            </div>
            
            {/* Set the track URL when selected */}
            {trackAudioRef.current && (trackAudioRef.current.src = selectedTrack.url)}
          </div>
        )}
      </Card>

      {/* Volume Controls */}
      {selectedTrack && (
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
                onChange={(e) => setTrackVolume(parseFloat(e.target.value))}
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
                onChange={(e) => setMicVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-sm">{Math.round(micVolume * 100)}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Recording Controls */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={!selectedTrack}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center disabled:bg-gray-300"
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
                <span className="text-lg font-semibold">Recording karaoke...</span>
              </div>
              <p className="text-sm text-gray-600">Sing along to the track!</p>
            </div>
          )}

          {!isRecording && !selectedTrack && (
            <p className="text-gray-600">Select a track to start your karaoke session</p>
          )}

          {!isRecording && selectedTrack && (
            <p className="text-gray-600">Tap the microphone to start recording while the track plays</p>
          )}
        </div>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
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
      )}

      <div className="text-center text-sm text-gray-600">
        <p>Professional karaoke recording with track mixing</p>
        <p className="mt-1">Your voice and the backing track are combined into one audio file</p>
      </div>
    </div>
  );
};
