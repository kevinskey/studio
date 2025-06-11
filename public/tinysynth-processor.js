// TinySynth WebAssembly Audio Worklet Processor

class TinySynthProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.wasmMemory = options.processorOptions.wasmMemory;
    this.sampleRate = sampleRate;
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { action, data } = event.data;
    
    switch(action) {
      case 'render':
        // Handle rendering request
        break;
      default:
        console.warn('Unknown message action:', action);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    // Check if we have valid WebAssembly memory and render function
    if (!this.wasmMemory) {
      // Fill output with silence if we're not ready
      for (let channel = 0; channel < output.length; ++channel) {
        const outputChannel = output[channel];
        for (let i = 0; i < outputChannel.length; ++i) {
          outputChannel[i] = 0;
        }
      }
      return true;
    }

    try {
      // This code assumes the WebAssembly module has a render function
      // that fills an output buffer with audio samples
      const renderFunction = this.wasmInstance?.exports.render;
      
      if (renderFunction && typeof renderFunction === 'function') {
        // Get pointer to output buffer in WASM memory
        const bufferPtr = this.wasmInstance.exports.getOutputBuffer();
        
        // Call WASM render function to fill the buffer
        const numFrames = output[0].length;
        renderFunction(numFrames, this.sampleRate);
        
        // Copy from WASM memory to output buffer
        const buffer = new Float32Array(this.wasmMemory.buffer, bufferPtr, numFrames);
        
        // Write to all output channels (usually stereo)
        for (let channel = 0; channel < output.length; ++channel) {
          const outputChannel = output[channel];
          
          // Copy samples from the WASM buffer to the output
          for (let i = 0; i < outputChannel.length; ++i) {
            outputChannel[i] = buffer[i];
          }
        }
      }
    } catch (err) {
      console.error('Error in TinySynth audio processing:', err);
    }
    
    // Keep processor alive
    return true;
  }
}

registerProcessor('tinysynth-processor', TinySynthProcessor);
