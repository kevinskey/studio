
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Recording, KaraokeTrack } from '@/types/karaoke';
import { useAudioContext } from './useAudioContext';

export const useKaraokeRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  
  const chunksRef = useRef<Blob[]>([]);
  const { getAudioContext } = useAudioContext();

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
      
      const micGain = audioContext.createGain();
      micGain.gain.value = micVolume;
      
      micSource.connect(micGain);
      
      const destination = audioContext.createMediaStreamDestination();
      micGain.connect(destination);
      
      if (trackAudioRef.current && trackLoadedRef.current) {
        try {
          const trackSource = audioContext.createMediaElementSource(trackAudioRef.current);
          const trackGain = audioContext.createGain();
          trackGain.gain.value = trackVolume;
          
          trackSource.connect(trackGain);
          trackGain.connect(destination);
          trackGain.connect(audioContext.destination);
        } catch (error) {
          console.log('Could not mix track audio, recording voice only');
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
    
    setIsRecording(false);
    setMediaRecorder(null);
    
    if (trackAudioRef.current) {
      trackAudioRef.current.pause();
      setIsPlayingTrack(false);
    }
  };

  return {
    isRecording,
    recordings,
    micPermissionGranted,
    checkMicrophonePermissions,
    startRecording,
    stopRecording
  };
};
