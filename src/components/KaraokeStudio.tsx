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
    toggleAutoLevel,
    removeRecording
  } = useKaraokeRecording();

  const allTracks = [...customTracks];

  // Initialize audio element and check permissions - only once
  useEffect(() => {
    if (!trackAudioRef.current) {
      trackAudioRef.current = new Audio();
      trackAudioRef.current.crossOrigin = "anonymous";
      trackAudioRef.current.preload = "metadata";
    }

    checkMicrophonePermissions();
    
    return () => {
      customTracks.forEach(track => {
        if (track.url.startsWith('blob:')) {
          URL.revokeObjectURL(track.url);
        }
      });
    };
  }, []); // Empty dependency array - only run once

  // Handle track loading separately
  useEffect(() => {
    if (trackAudioRef.current && selectedTrack) {
      console.log('Loading track:', selectedTrack.title);
      trackAudioRef.current.src = selectedTrack.url;
      trackAudioRef.current.volume = trackVolume;
      trackLoadedRef.current = false;
      
      const handleLoadedData = () => {
        console.log('Track loaded successfully');
        trackLoadedRef.current = true;
      };
      
      const handleError = (e: Event) => {
        console.error('Error loading track:', e);
        toast.error('Failed to load the selected track');
        trackLoadedRef.current = false;
      };
      
      const handleEnded = () => {
        setIsPlayingTrack(false);
      };

      trackAudioRef.current.addEventListener('loadeddata', handleLoadedData);
      trackAudioRef.current.addEventListener('error', handleError);
      trackAudioRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        if (trackAudioRef.current) {
          trackAudioRef.current.removeEventListener('loadeddata', handleLoadedData);
          trackAudioRef.current.removeEventListener('error', handleError);
          trackAudioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [selectedTrack]);

  // Handle volume changes separately
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

  const handleDeleteRecording = (recordingId: string) => {
    removeRecording(recordingId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
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

      <RecordingsList 
        recordings={recordings} 
        onDeleteRecording={handleDeleteRecording}
      />

      <div className="text-center text-sm text-gray-600">
        <p>Professional karaoke recording with automatic level control</p>
        <p className="mt-1">Upload your own MP3, WAV, or other audio files</p>
      </div>
    </div>
  );
};

export default KaraokeStudio;
