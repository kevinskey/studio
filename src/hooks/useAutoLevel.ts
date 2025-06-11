
import { useRef, useCallback } from 'react';

interface AutoLevelConfig {
  targetLevel: number;
  attackTime: number;
  releaseTime: number;
  maxGain: number;
  minGain: number;
}

export const useAutoLevel = () => {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentGainRef = useRef(1.0);

  const defaultConfig: AutoLevelConfig = {
    targetLevel: 0.7, // Target RMS level (0-1)
    attackTime: 0.1,  // How quickly to reduce gain when too loud
    releaseTime: 0.3, // How quickly to increase gain when too quiet
    maxGain: 3.0,     // Maximum gain boost
    minGain: 0.1      // Minimum gain to prevent complete silence
  };

  const setupAutoLevel = useCallback(async (
    audioContext: AudioContext,
    sourceNode: AudioNode,
    config: Partial<AutoLevelConfig> = {}
  ) => {
    const finalConfig = { ...defaultConfig, ...config };

    // Create analyser for level detection
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Create gain node for level adjustment
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Connect nodes
    sourceNode.connect(analyser);
    analyser.connect(gainNode);

    // Setup data array for analysis
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current = analyser;
    gainNodeRef.current = gainNode;
    dataArrayRef.current = dataArray;
    currentGainRef.current = 1.0;

    const processAudio = () => {
      if (!analyserRef.current || !dataArrayRef.current || !gainNodeRef.current) {
        return;
      }

      // Get current audio level
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      
      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const sample = (dataArrayRef.current[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArrayRef.current.length);

      // Calculate target gain adjustment
      const targetGain = rms > 0 ? finalConfig.targetLevel / rms : finalConfig.maxGain;
      const clampedTargetGain = Math.max(finalConfig.minGain, Math.min(finalConfig.maxGain, targetGain));

      // Smooth gain changes
      const currentGain = currentGainRef.current;
      let newGain;

      if (clampedTargetGain < currentGain) {
        // Attack: reduce gain quickly when too loud
        const attackRate = 1 - Math.exp(-1 / (finalConfig.attackTime * 60)); // 60fps assumption
        newGain = currentGain + (clampedTargetGain - currentGain) * attackRate;
      } else {
        // Release: increase gain slowly when too quiet
        const releaseRate = 1 - Math.exp(-1 / (finalConfig.releaseTime * 60));
        newGain = currentGain + (clampedTargetGain - currentGain) * releaseRate;
      }

      // Apply gain with smooth ramping
      const now = audioContext.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.setValueAtTime(currentGain, now);
      gainNodeRef.current.gain.exponentialRampToValueAtTime(Math.max(0.001, newGain), now + 0.05);

      currentGainRef.current = newGain;

      // Continue processing
      animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    // Start processing
    processAudio();

    return gainNode;
  }, []);

  const stopAutoLevel = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    analyserRef.current = null;
    gainNodeRef.current = null;
    dataArrayRef.current = null;
    currentGainRef.current = 1.0;
  }, []);

  const getCurrentLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { rms: 0, gain: 1.0 };
    }

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const sample = (dataArrayRef.current[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);

    return {
      rms,
      gain: currentGainRef.current
    };
  }, []);

  return {
    setupAutoLevel,
    stopAutoLevel,
    getCurrentLevel
  };
};
