import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Play, Pause, Square, Download, Volume2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  isCustom?: boolean;
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
  const [customTracks, setCustomTracks] = useState<KaraokeTrack[]>([]);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  
  const trackAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const trackLoadedRef = useRef(false);

  const allTracks = [...customTracks];

  useEffect(() => {
    // Initialize audio elements only once
    if (!trackAudioRef.current) {
      trackAudioRef.current = new Audio();
      trackAudioRef.current.crossOrigin = "anonymous";
      trackAudioRef.current.preload = "metadata";
    }

    if (!recordingAudioRef.current) {
      recordingAudioRef.current = new Audio();
      recordingAudioRef.current.preload = "metadata";
    }

    // Check microphone permissions on component mount
    checkMicrophonePermissions();
    
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // Clean up custom track URLs
      customTracks.forEach(track => {
        if (track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url);
        }
      });
    };
  }, []);

  // Separate effect for track loading to prevent multiple reloads
  useEffect(() => {
    if (trackAudioRef.current && selectedTrack && !trackLoadedRef.current) {
      console.log('Loading track:', selectedTrack.title);
      trackAudioRef.current.src = selectedTrack.url;
      trackAudioRef.current.volume = trackVolume;
      
      trackAudioRef.current.onloadeddata = () => {
        console.log('Track loaded successfully');
        trackLoadedRef.current = true;
      };
      
      trackAudioRef.current.onerror = (e) => {
        console.error('Error loading track:', e);
        toast.error('Failed to load the selected track');
        trackLoadedRef.current = false;
      };
      
      trackAudioRef.current.onended = () => {
        setIsPlayingTrack(false);
      };
    }
  }, [selectedTrack]);

  // Update volume without reloading track
  useEffect(() => {
    if (trackAudioRef.current) {
      trackAudioRef.current.volume = trackVolume;
    }
  }, [trackVolume]);

  const checkMicrophonePermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') {
        setMicPermissionGranted(true);
      } else if (result.state === 'prompt') {
        // Will be requested when user starts recording
        setMicPermissionGranted(false);
      } else {
        setMicPermissionGranted(false);
        toast.error('Microphone access denied. Please enable microphone permissions.');
      }
    } catch (error) {
      console.log('Permission API not supported, will request on recording');
      setMicPermissionGranted(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.onloadedmetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      const newTrack: KaraokeTrack = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Custom Upload',
        duration: Math.round(audio.duration),
        url,
        isCustom: true
      };

      setCustomTracks(prev => [...prev, newTrack]);
      setSelectedTrack(newTrack);
      trackLoadedRef.current = false; // Allow new track to load
      toast.success('Track uploaded successfully!');
    };

    audio.onerror = (e) => {
      console.error('Error loading audio file:', e);
      URL.revokeObjectURL(url);
      toast.error('Failed to load audio file. Please try a different format.');
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeCustomTrack = (trackId: string) => {
    const trackToRemove = customTracks.find(t => t.id === trackId);
    if (trackToRemove && trackToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToRemove.url);
    }
    
    setCustomTracks(prev => prev.filter(t => t.id !== trackId));
    
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
      setIsPlayingTrack(false);
      trackLoadedRef.current = false;
    }
    
    toast.success('Track removed');
  };

  const selectTrack = (trackId: string) => {
    const track = allTracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrack(track);
      setIsPlayingTrack(false);
      trackLoadedRef.current = false; // Allow new track to load
      console.log('Selected track:', track.title);
    }
  };

  const toggleTrackPlayback = async () => {
    if (!selectedTrack || !trackAudioRef.current) {
      toast.error('No track selected');
      return;
    }

    try {
      if (isPlayingTrack) {
        trackAudioRef.current.pause();
        setIsPlayingTrack(false);
        console.log('Track paused');
      } else {
        console.log('Attempting to play track...');
        await trackAudioRef.current.play();
        setIsPlayingTrack(true);
        console.log('Track playing');
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      toast.error('Failed to play track. The audio format might not be supported.');
      setIsPlayingTrack(false);
    }
  };

  const startRecording = async () => {
    if (!selectedTrack) {
      toast.error('Please select a track first');
      return;
    }

    try {
      console.log('Requesting microphone access...');
      
      // Get microphone stream with specific settings
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      console.log('Microphone access granted');
      setAudioStream(micStream);
      setMicPermissionGranted(true);

      // Initialize audio context if not already done
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioContext = audioContextRef.current;
      const micSource = audioContext.createMediaStreamSource(micStream);
      
      // Create gain nodes for volume control
      const micGain = audioContext.createGain();
      micGain.gain.value = micVolume;
      
      // Connect microphone
      micSource.connect(micGain);
      
      // Create destination for recording
      const destination = audioContext.createMediaStreamDestination();
      micGain.connect(destination);
      
      // If track is loaded and ready, mix it in
      if (trackAudioRef.current && trackLoadedRef.current) {
        try {
          const trackSource = audioContext.createMediaElementSource(trackAudioRef.current);
          const trackGain = audioContext.createGain();
          trackGain.gain.value = trackVolume;
          
          trackSource.connect(trackGain);
          trackGain.connect(destination);
          trackGain.connect(audioContext.destination); // Also play through speakers
        } catch (error) {
          console.log('Could not mix track audio, recording voice only');
        }
      }
      
      // Create recorder for the mixed stream
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
      
      // Start track playback if not already playing and track is loaded
      if (!isPlayingTrack && trackAudioRef.current && trackLoadedRef.current) {
        try {
          trackAudioRef.current.currentTime = 0;
          await trackAudioRef.current.play();
          setIsPlayingTrack(true);
          console.log('Started track playback with recording');
        } catch (error) {
          console.log('Could not start track playback, recording voice only');
        }
      }
      
      toast.success('Recording started! Sing along to the track');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone permissions and try again.');
        setMicPermissionGranted(false);
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please check your audio devices.');
      } else {
        toast.error('Could not start recording. Please check your microphone permissions.');
      }
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
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Microphone Permission Status */}
      {!micPermissionGranted && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <Mic className="h-4 w-4" />
            <span className="text-sm">
              Microphone access is required for karaoke recording. Permission will be requested when you start recording.
            </span>
          </div>
        </Card>
      )}

      {/* File Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Your Own Track</h3>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          variant="outline"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Audio File
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: MP3, WAV, OGG, M4A (Max: 50MB)
        </p>
      </Card>

      {/* Custom Tracks Management */}
      {customTracks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Uploaded Tracks</h3>
          <div className="space-y-2">
            {customTracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCustomTrack(track.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Track Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Your Karaoke Track</h3>
        {allTracks.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tracks available. Please upload an audio file to get started.</p>
          </div>
        ) : (
          <Select onValueChange={selectTrack} value={selectedTrack?.id || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select a song to sing along with" />
            </SelectTrigger>
            <SelectContent>
              {customTracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.title} - {track.artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedTrack && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selectedTrack.title}</div>
                <div className="text-sm text-gray-600">
                  {selectedTrack.artist}
                  {selectedTrack.isCustom && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Custom
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={toggleTrackPlayback} variant="outline">
                {isPlayingTrack ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlayingTrack ? 'Pause' : 'Preview'}
              </Button>
            </div>
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
            <p className="text-gray-600">Upload and select a track to start your karaoke session</p>
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
        <p className="mt-1">Upload your own MP3, WAV, or other audio files</p>
      </div>
    </div>
  );
};
