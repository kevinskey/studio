import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { KaraokeTrack } from '@/types/karaoke';
import { useKaraokeRecording } from '@/hooks/useKaraokeRecording';
import { TrackUpload } from './karaoke/TrackUpload';
import { TrackSelector } from './karaoke/TrackSelector';
import { VolumeControls } from './karaoke/VolumeControls';
import { RecordingControls } from './karaoke/RecordingControls';
import { RecordingsList } from './karaoke/RecordingsList';

export const KaraokeStudio = () => {
  const [selectedTrack, setSelectedTrack] = useState<KaraokeTrack | null>(null);
  const [isPlayingTrack, setIsPlayingTrack] = useState(false);
  const [trackVolume, setTrackVolume] = useState(0.7);
  const [micVolume, setMicVolume] = useState(1.0);
  const [customTracks, setCustomTracks] = useState<KaraokeTrack[]>([]);
  
  const trackAudioRef = useRef<HTMLAudioElement | null>(null);
  const trackLoadedRef = useRef(false);

  const {
    isRecording,
    recordings,
    micPermissionGranted,
    autoLevelEnabled,
    currentMicLevel,
    currentGain,
    checkMicrophonePermissions,
    startRecording,
    stopRecording,
    toggleAutoLevel
  } = useKaraokeRecording();

  const allTracks = [...customTracks];

  useEffect(() => {
    // Initialize audio element only once
    if (!trackAudioRef.current) {
      trackAudioRef.current = new Audio();
      trackAudioRef.current.crossOrigin = "anonymous";
      trackAudioRef.current.preload = "metadata";
    }

    // Check microphone permissions on component mount
    checkMicrophonePermissions();
    
    return () => {
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

  const selectTrack = (trackId: string) => {
    const track = allTracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrack(track);
      setIsPlayingTrack(false);
      trackLoadedRef.current = false;
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

  const handleStartRecording = () => {
    if (!selectedTrack) {
      toast.error('Please select a track first');
      return;
    }

    startRecording(
      selectedTrack,
      trackAudioRef,
      trackLoadedRef,
      trackVolume,
      micVolume,
      isPlayingTrack,
      setIsPlayingTrack
    );
  };

  const handleStopRecording = () => {
    stopRecording(trackAudioRef, setIsPlayingTrack);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <audio
        ref={trackAudioRef}
        onEnded={() => setIsPlayingTrack(false)}
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

      <TrackUpload
        customTracks={customTracks}
        setCustomTracks={setCustomTracks}
        setSelectedTrack={setSelectedTrack}
        selectedTrack={selectedTrack}
        setIsPlayingTrack={setIsPlayingTrack}
        trackLoadedRef={trackLoadedRef}
      />

      <TrackSelector
        allTracks={allTracks}
        selectedTrack={selectedTrack}
        isPlayingTrack={isPlayingTrack}
        onSelectTrack={selectTrack}
        onTogglePlayback={toggleTrackPlayback}
      />

      {selectedTrack && (
        <VolumeControls
          trackVolume={trackVolume}
          micVolume={micVolume}
          onTrackVolumeChange={setTrackVolume}
          onMicVolumeChange={setMicVolume}
          autoLevelEnabled={autoLevelEnabled}
          onAutoLevelToggle={toggleAutoLevel}
          currentMicLevel={currentMicLevel}
          currentGain={currentGain}
        />
      )}

      <RecordingControls
        isRecording={isRecording}
        selectedTrack={selectedTrack}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />

      <RecordingsList recordings={recordings} />

      <div className="text-center text-sm text-gray-600">
        <p>Professional karaoke recording with automatic level control</p>
        <p className="mt-1">Upload your own MP3, WAV, or other audio files</p>
      </div>
    </div>
  );
};
