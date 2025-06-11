
import { useRef, useEffect, useState, useCallback } from 'react';

interface PitchDetectionResult {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
}

export const usePitchDetection = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitchData, setPitchData] = useState<PitchDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);

  // Note names for frequency to note conversion
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Convert frequency to note name and cents deviation
  const frequencyToNote = useCallback((frequency: number) => {
    const A4 = 440;
    const noteNumber = 12 * Math.log2(frequency / A4) + 69;
    const roundedNoteNumber = Math.round(noteNumber);
    const cents = Math.round((noteNumber - roundedNoteNumber) * 100);
    
    const octave = Math.floor(roundedNoteNumber / 12) - 1;
    const noteIndex = roundedNoteNumber % 12;
    const noteName = `${noteNames[noteIndex]}${octave}`;
    
    return { note: noteName, cents };
  }, []);

  // Autocorrelation algorithm for pitch detection
  const autocorrelate = useCallback((buffer: Float32Array, sampleRate: number) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    
    // Calculate RMS to determine if there's enough signal
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Minimum threshold for signal detection
    if (rms < 0.01) return -1;
    
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      
      // Look for the peak
      if (correlation > 0.9 && correlation > lastCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      } else if (bestCorrelation > 0.9) {
        break;
      }
      lastCorrelation = correlation;
    }
    
    if (bestCorrelation > 0.9) {
      return sampleRate / bestOffset;
    }
    return -1;
  }, []);

  // Start pitch detection
  const startListening = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          sampleRate: 44100
        } 
      });
      
      mediaStreamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Create buffer for audio data
      const bufferLength = analyserRef.current.fftSize;
      bufferRef.current = new Float32Array(bufferLength);
      
      setIsListening(true);
      
      // Start pitch detection loop
      const detectPitch = () => {
        if (!analyserRef.current || !bufferRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(bufferRef.current);
        const frequency = autocorrelate(bufferRef.current, audioContext.sampleRate);
        
        if (frequency > 80 && frequency < 2000) {
          const { note, cents } = frequencyToNote(frequency);
          const confidence = Math.min(1, Math.max(0, (frequency - 80) / 1920));
          
          setPitchData({
            frequency,
            note,
            cents,
            confidence
          });
        } else {
          setPitchData(null);
        }
        
        animationFrameRef.current = requestAnimationFrame(detectPitch);
      };
      
      detectPitch();
      
    } catch (err) {
      console.error('Error starting pitch detection:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [autocorrelate, frequencyToNote]);

  // Stop pitch detection
  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    bufferRef.current = null;
    setIsListening(false);
    setPitchData(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    pitchData,
    error,
    startListening,
    stopListening
  };
};
