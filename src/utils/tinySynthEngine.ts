
// TinySynth - a WebAssembly-based synthesizer for higher quality piano sounds
// Based on TinySynth WebAssembly implementation

interface TinySynthNote {
  note: number;
  velocity: number;
}

class TinySynthEngine {
  private static instance: TinySynthEngine;
  private audioContext: AudioContext | null = null;
  private wasmModule: WebAssembly.Instance | null = null;
  private wasmMemory: WebAssembly.Memory | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private ready = false;
  private loadingPromise: Promise<void> | null = null;
  private soundfontLoaded = false;
  private currentProgram = 0; // Default to Piano

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
        
        // Load the audio worklet processor
        await this.audioContext.audioWorklet.addModule('/tinysynth-processor.js');
        
        // Create WebAssembly memory
        this.wasmMemory = new WebAssembly.Memory({ initial: 2 });
        
        // Fetch and compile the WebAssembly module
        const response = await fetch('/tinysynth.wasm');
        const buffer = await response.arrayBuffer();
        const wasmModule = await WebAssembly.compile(buffer);
        
        // Instantiate the module
        this.wasmModule = await WebAssembly.instantiate(wasmModule, {
          env: {
            memory: this.wasmMemory,
          },
        });
        
        // Create AudioWorkletNode
        this.audioWorklet = new AudioWorkletNode(this.audioContext, 'tinysynth-processor', {
          processorOptions: {
            wasmMemory: this.wasmMemory,
          },
        });
        
        // Connect to audio output
        this.audioWorklet.connect(this.audioContext.destination);
        
        // Load soundfont (basic piano)
        await this.loadSoundfont();
        
        this.ready = true;
        resolve();
      } catch (error) {
        console.error('Failed to initialize TinySynth engine:', error);
        
        // Fallback to standard Web Audio API
        this.ready = false;
        
        // We resolve instead of reject to allow the app to continue with fallback
        resolve();
      }
    });

    return this.loadingPromise;
  }

  private async loadSoundfont(): Promise<void> {
    if (!this.wasmModule || this.soundfontLoaded) return;
    
    try {
      // Fetch the piano soundfont
      const response = await fetch('/piano-soundfont.bin');
      const buffer = await response.arrayBuffer();
      
      // Load into WASM memory
      const loadSoundfont = (this.wasmModule.exports as any).loadSoundfont;
      
      if (loadSoundfont && typeof loadSoundfont === 'function') {
        // Convert buffer to format expected by WASM
        const view = new Uint8Array(buffer);
        const heapAddr = (this.wasmModule.exports as any).allocate(view.length);
        
        // Copy data to WASM memory
        const heap = new Uint8Array((this.wasmMemory as WebAssembly.Memory).buffer);
        heap.set(view, heapAddr);
        
        // Call the loadSoundfont function
        loadSoundfont(heapAddr, view.length);
        this.soundfontLoaded = true;
      }
    } catch (error) {
      console.error('Error loading soundfont:', error);
    }
  }

  public async playNote(midiNote: number, velocity = 100): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.ready || !this.wasmModule) {
      console.warn('TinySynth not ready, cannot play note');
      return;
    }
    
    try {
      // Resume audio context if it's suspended
      if (this.audioContext && this.audioContext.state !== "running") {
        await this.audioContext.resume();
      }
      
      // Call the WASM function to play a note
      const playNote = (this.wasmModule.exports as any).playNote;
      if (playNote && typeof playNote === 'function') {
        playNote(midiNote, velocity, this.currentProgram);
      }
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }

  public async stopNote(midiNote: number): Promise<void> {
    if (!this.ready || !this.wasmModule) return;
    
    try {
      // Call the WASM function to release a note
      const stopNote = (this.wasmModule.exports as any).stopNote;
      if (stopNote && typeof stopNote === 'function') {
        stopNote(midiNote, this.currentProgram);
      }
    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }

  public async setProgram(program: number): Promise<void> {
    await this.ensureInitialized();
    this.currentProgram = program; // Store program for later use
    
    if (!this.ready || !this.wasmModule) return;
    
    try {
      // Call the WASM function to change instrument
      const setProgram = (this.wasmModule.exports as any).setProgram;
      if (setProgram && typeof setProgram === 'function') {
        setProgram(program);
      }
    } catch (error) {
      console.error('Error setting program:', error);
    }
  }

  public async setVolume(volume: number): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.ready || !this.wasmModule) return;
    
    try {
      // Call the WASM function to change master volume
      const setVolume = (this.wasmModule.exports as any).setVolume;
      if (setVolume && typeof setVolume === 'function') {
        // Map 0-1 to 0-127 MIDI volume range
        const midiVolume = Math.floor(volume * 127);
        setVolume(midiVolume);
      }
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
    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }
    
    this.wasmModule = null;
    this.wasmMemory = null;
    this.ready = false;
    this.loadingPromise = null;
    this.soundfontLoaded = false;
  }
}

export default TinySynthEngine;
