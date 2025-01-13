// processors.js
class MyWorkletProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (input) {
        for (let channel = 0; channel < input.length; channel++) {
          const inputChannel = input[channel];
          const outputChannel = output[channel];
          for (let i = 0; i < inputChannel.length; i++) {
            outputChannel[i] = inputChannel[i];  // Simple pass-through
          }
        }
      }
      return true;  // Keep the processor alive
    }
  }
  
  registerProcessor('my-worklet-processor', MyWorkletProcessor);