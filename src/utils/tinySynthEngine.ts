
// High-quality piano synthesizer using Web Audio API
// Implements additive synthesis with harmonics for realistic piano sounds

interface TinySynthNote {
  note: number;
  velocity: number;
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  startTime: number;
}

class TinySynthEngine {
  private static instance: TinySynthEngine;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ready = false;
  private loadingPromise: Promise<void> | null = null;
  private currentProgram = 0; // Default to Piano
  private activeNotes = new Map<number, TinySynthNote>();
  private masterVolume = 0.5;

  // Singleton pattern
  public static getInstance(): TinySynthEngine {
    if (!TinySynthEngine.instance) {
      TinySynthEngine.instance = new TinySynthEngine();
    }
    return TinySynthEngine.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  public async initialize(): Promise<void> {
    if (this.ready) return Promise.resolve();
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        
        this.ready = true;
        console.log('TinySynth engine initialized successfully');
        resolve();
      } catch (error) {
        console.error('Failed to initialize TinySynth engine:', error);
        reject(error);
      }
    });

    return this.loadingPromise;
  }

  private getInstrumentConfig(program: number) {
    // Different instrument configurations
    switch (program) {
      case 0: // Grand Piano
        return {
          harmonics: [1, 0.5, 0.25, 0.125, 0.0625],
          attack: 0.01,
          decay: 0.3,
          sustain: 0.7,
          release: 2.0,
          waveType: 'triangle' as OscillatorType
        };
      case 1: // Bright Piano
        return {
          harmonics: [1, 0.7, 0.4, 0.2, 0.1],
          attack: 0.005,
          decay: 0.2,
          sustain: 0.8,
          release: 1.5,
          waveType: 'triangle' as OscillatorType
        };
      case 4: // Electric Piano
        return {
          harmonics: [1, 0.3, 0.6, 0.1, 0.05],
          attack: 0.02,
          decay: 0.5,
          sustain: 0.6,
          release: 1.0,
          waveType: 'sine' as OscillatorType
        };
      case 16: // Organ
        return {
          harmonics: [1, 0.8, 0.6, 0.4, 0.2],
          attack: 0.1,
          decay: 0.1,
          sustain: 0.9,
          release: 0.5,
          waveType: 'sine' as OscillatorType
        };
      case 7: // Clavinet
        return {
          harmonics: [1, 0.4, 0.8, 0.2, 0.1],
          attack: 0.001,
          decay: 0.1,
          sustain: 0.3,
          release: 0.2,
          waveType: 'sawtooth' as OscillatorType
        };
      case 80: // Synth Lead
        return {
          harmonics: [1, 0.5, 0.7, 0.3, 0.15],
          attack: 0.05,
          decay: 0.2,
          sustain: 0.8,
          release: 1.0,
          waveType: 'square' as OscillatorType
        };
      default:
        return this.getInstrumentConfig(0); // Default to Grand Piano
    }
  }

  public async playNote(midiNote: number, velocity = 100): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.ready || !this.audioContext || !this.masterGain) {
      console.warn('TinySynth not ready, cannot play note');
      return;
    }
    
    try {
      // Resume audio context if it's suspended
      if (this.audioContext.state !== "running") {
        await this.audioContext.resume();
      }
      
      // Stop any existing note with the same MIDI number
      this.stopNote(midiNote);
      
      // Get instrument configuration
      const config = this.getInstrumentConfig(this.currentProgram);
      
      // Calculate frequency from MIDI note
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      
      // Create oscillators for harmonics
      const oscillators: OscillatorNode[] = [];
      const harmonicGains: GainNode[] = [];
      
      // Main gain node for this note
      const noteGain = this.audioContext.createGain();
      noteGain.connect(this.masterGain);
      
      // Create harmonics
      config.harmonics.forEach((harmonic, index) => {
        if (harmonic > 0) {
          const osc = this.audioContext!.createOscillator();
          const harmonicGain = this.audioContext!.createGain();
          
          osc.type = config.waveType;
          osc.frequency.setValueAtTime(frequency * (index + 1), this.audioContext!.currentTime);
          
          // Set harmonic amplitude
          const amplitude = harmonic * (velocity / 127) * 0.3; // Scale down overall volume
          harmonicGain.gain.setValueAtTime(amplitude, this.audioContext!.currentTime);
          
          osc.connect(harmonicGain);
          harmonicGain.connect(noteGain);
          
          oscillators.push(osc);
          harmonicGains.push(harmonicGain);
        }
      });
      
      // ADSR envelope
      const now = this.audioContext.currentTime;
      const attackTime = config.attack;
      const decayTime = config.decay;
      const sustainLevel = config.sustain * (velocity / 127);
      
      // Attack
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(velocity / 127, now + attackTime);
      
      // Decay to sustain
      noteGain.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.001), now + attackTime + decayTime);
      
      // Start all oscillators
      oscillators.forEach(osc => osc.start(now));
      
      // Store the note
      const note: TinySynthNote = {
        note: midiNote,
        velocity,
        oscillators,
        gainNode: noteGain,
        startTime: now
      };
      
      this.activeNotes.set(midiNote, note);
      
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  public async stopNote(midiNote: number): Promise<void> {
    if (!this.ready || !this.audioContext) return;
    
    const note = this.activeNotes.get(midiNote);
    if (!note) return;
    
    try {
      const config = this.getInstrumentConfig(this.currentProgram);
      const now = this.audioContext.currentTime;
      const releaseTime = config.release;
      
      // Release envelope
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
      
      // Stop oscillators after release
      note.oscillators.forEach(osc => {
        osc.stop(now + releaseTime);
      });
      
      // Clean up
      setTimeout(() => {
        this.activeNotes.delete(midiNote);
      }, releaseTime * 1000 + 100);
      
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }

  public async setProgram(program: number): Promise<void> {
    await this.ensureInitialized();
    this.currentProgram = program;
    console.log(`Switched to instrument program: ${program}`);
  }

  public async setVolume(volume: number): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.ready || !this.masterGain) return;
    
    try {
      this.masterVolume = Math.max(0, Math.min(1, volume));
      const now = this.audioContext!.currentTime;
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(this.masterVolume, 0.001), now + 0.1);
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.ready && !this.loadingPromise) {
      await this.initialize();
    } else if (this.loadingPromise) {
      await this.loadingPromise;
    }
  }

  // Utility function to convert note names to MIDI numbers
  public static noteNameToMidi(noteName: string): number {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = noteName.match(/^([A-G][#]?)(\d+)$/);
    
    if (!match) return -1;
    
    const note = match[1];
    const octave = parseInt(match[2]);
    
    const noteIndex = noteNames.indexOf(note);
    if (noteIndex === -1) return -1;
    
    return (octave + 1) * 12 + noteIndex;
  }
  
  public dispose(): void {
    // Stop all active notes
    this.activeNotes.forEach((note, midiNote) => {
      this.stopNote(midiNote);
    });
    this.activeNotes.clear();
    
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.ready = false;
    this.loadingPromise = null;
  }
}

export default TinySynthEngine;
