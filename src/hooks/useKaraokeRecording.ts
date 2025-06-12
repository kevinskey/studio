
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Recording, KaraokeTrack } from '@/types/karaoke';
import { useAudioContext } from './useAudioContext';
import { useAutoLevel } from './useAutoLevel';

const KARAOKE_RECORDINGS_STORAGE_KEY = 'music-studio-karaoke-recordings';

export const useKaraokeRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [autoLevelEnabled, setAutoLevelEnabled] = useState(true);
  const [currentMicLevel, setCurrentMicLevel] = useState(0);
  const [currentGain, setCurrentGain] = useState(1.0);
  
  const chunksRef = useRef<Blob[]>([]);
  const levelUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentTrackElementRef = useRef<HTMLAudioElement | null>(null);
  const { getAudioContext } = useAudioContext();
  const { setupAutoLevel, stopAutoLevel, getCurrentLevel } = useAutoLevel();

  // Load recordings from localStorage on component mount
  useEffect(() => {
    const loadStoredRecordings = () => {
      try {
        const stored = localStorage.getItem(KARAOKE_RECORDINGS_STORAGE_KEY);
        if (stored) {
          const parsedRecordings = JSON.parse(stored).map((recording: any) => ({
            ...recording,
            timestamp: new Date(recording.timestamp)
          }));
          setRecordings(parsedRecordings);
        }
      } catch (error) {
        console.error('Error loading stored karaoke recordings:', error);
      }
    };

    loadStoredRecordings();
  }, []);

  // Save recordings to localStorage whenever recordings change
  useEffect(() => {
    try {
      localStorage.setItem(KARAOKE_RECORDINGS_STORAGE_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('Error saving karaoke recordings to localStorage:', error);
    }
  }, [recordings]);

  const checkMicrophonePermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'granted') {
        setMicPermissionGranted(true);
      } else if (result.state === 'prompt') {
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

  const startRecording = async (
    selectedTrack: KaraokeTrack,
    trackAudioRef: React.RefObject<HTMLAudioElement>,
    trackLoadedRef: React.MutableRefObject<boolean>,
    trackVolume: number,
    micVolume: number,
    isPlayingTrack: boolean,
    setIsPlayingTrack: (playing: boolean) => void
  ) => {
    try {
      console.log('Requesting microphone access...');
      
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

      const audioContext = await getAudioContext();
      const micSource = audioContext.createMediaStreamSource(micStream);
      const destination = audioContext.createMediaStreamDestination();
      
      let finalMicNode: AudioNode;

      if (autoLevelEnabled) {
        console.log('Setting up auto-level for microphone');
        const autoLevelNode = await setupAutoLevel(audioContext, micSource, {
          targetLevel: 0.7,
          attackTime: 0.1,
          releaseTime: 0.3,
          maxGain: 3.0,
          minGain: 0.1
        });
        
        if (autoLevelNode) {
          finalMicNode = autoLevelNode;
          
          levelUpdateIntervalRef.current = setInterval(() => {
            const { rms, gain } = getCurrentLevel();
            setCurrentMicLevel(rms);
            setCurrentGain(gain);
          }, 100);
        } else {
          finalMicNode = micSource;
        }
      } else {
        const micGain = audioContext.createGain();
        micGain.gain.value = micVolume;
        micSource.connect(micGain);
        finalMicNode = micGain;
      }
      
      finalMicNode.connect(destination);
      
      if (trackAudioRef.current && trackLoadedRef.current) {
        try {
          console.log('Setting up track audio mixing');
          
          const trackElement = trackAudioRef.current;
          
          if (!trackSourceRef.current || currentTrackElementRef.current !== trackElement) {
            if (trackSourceRef.current) {
              try {
                trackSourceRef.current.disconnect();
              } catch (e) {
                console.log('Could not disconnect old track source:', e);
              }
            }
            
            trackSourceRef.current = audioContext.createMediaElementSource(trackElement);
            currentTrackElementRef.current = trackElement;
            console.log('Created new track audio source');
          } else {
            console.log('Reusing existing track audio source');
          }
          
          const trackGain = audioContext.createGain();
          trackGain.gain.value = trackVolume;
          
          // Connect track to both recording destination AND audio output so user can hear it
          trackSourceRef.current.connect(trackGain);
          trackGain.connect(destination); // For recording
          trackGain.connect(audioContext.destination); // For user to hear
          
          console.log('Track audio mixed into recording and connected to speakers');
        } catch (error) {
          console.error('Could not mix track audio, recording voice only:', error);
          toast.warning('Recording voice only - track audio could not be mixed');
        }
      }
      
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
        toast.success('Karaoke recording saved and will persist until deleted!');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Always start track playback when recording starts
      if (trackAudioRef.current && trackLoadedRef.current) {
        try {
          console.log('Starting track playback for karaoke recording');
          trackAudioRef.current.currentTime = 0;
          await trackAudioRef.current.play();
          setIsPlayingTrack(true);
          console.log('Track playback started successfully');
        } catch (error) {
          console.error('Could not start track playback:', error);
          toast.warning('Recording started but track playback failed');
        }
      }
      
      toast.success(`Recording started! ${autoLevelEnabled ? 'Auto-level enabled' : 'Manual level control'}`);
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

  const stopRecording = (
    trackAudioRef: React.RefObject<HTMLAudioElement>,
    setIsPlayingTrack: (playing: boolean) => void
  ) => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }

    stopAutoLevel();
    
    if (levelUpdateIntervalRef.current) {
      clearInterval(levelUpdateIntervalRef.current);
      levelUpdateIntervalRef.current = null;
    }
    
    setIsRecording(false);
    setMediaRecorder(null);
    setCurrentMicLevel(0);
    setCurrentGain(1.0);
    
    if (trackAudioRef.current) {
      trackAudioRef.current.pause();
      setIsPlayingTrack(false);
    }
  };

  const toggleAutoLevel = (enabled: boolean) => {
    setAutoLevelEnabled(enabled);
    if (!enabled) {
      setCurrentMicLevel(0);
      setCurrentGain(1.0);
    }
  };

  const removeRecording = (recordingId: string) => {
    const recordingToDelete = recordings.find(r => r.id === recordingId);
    
    if (recordingToDelete) {
      // Clean up the blob URL to free memory
      URL.revokeObjectURL(recordingToDelete.url);
    }
    
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
  };

  return {
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
  };
};
