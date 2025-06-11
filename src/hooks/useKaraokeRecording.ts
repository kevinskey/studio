
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Recording, KaraokeTrack } from '@/types/karaoke';
import { useAudioContext } from './useAudioContext';
import { useAutoLevel } from './useAutoLevel';

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
  const { getAudioContext } = useAudioContext();
  const { setupAutoLevel, stopAutoLevel, getCurrentLevel } = useAutoLevel();

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
        // Setup auto-leveling
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
          
          // Start level monitoring
          levelUpdateIntervalRef.current = setInterval(() => {
            const { rms, gain } = getCurrentLevel();
            setCurrentMicLevel(rms);
            setCurrentGain(gain);
          }, 100);
        } else {
          finalMicNode = micSource;
        }
      } else {
        // Manual gain control
        const micGain = audioContext.createGain();
        micGain.gain.value = micVolume;
        micSource.connect(micGain);
        finalMicNode = micGain;
      }
      
      // Connect microphone to destination
      finalMicNode.connect(destination);
      
      // Mix in track audio if available
      if (trackAudioRef.current && trackLoadedRef.current) {
        try {
          console.log('Setting up track audio mixing');
          const trackSource = audioContext.createMediaElementSource(trackAudioRef.current);
          const trackGain = audioContext.createGain();
          trackGain.gain.value = trackVolume;
          
          trackSource.connect(trackGain);
          // Connect track to both destination (for recording) and speakers (for monitoring)
          trackGain.connect(destination);
          trackGain.connect(audioContext.destination);
          
          console.log('Track audio mixed into recording');
        } catch (error) {
          console.log('Could not mix track audio, recording voice only:', error);
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
        toast.success('Karaoke recording saved!');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
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

    // Stop auto-level processing
    stopAutoLevel();
    
    // Clear level monitoring
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
    toggleAutoLevel
  };
};
