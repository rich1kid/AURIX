
// Helper function to decode base64 string to Uint8Array safely
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer with proper buffer view handling
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays base64 encoded audio string.
 * Returns both a promise that resolves when finished and the source node itself for manual stopping.
 */
export async function playAudio(base64Audio: string, existingContext?: AudioContext): Promise<{ 
  source: AudioBufferSourceNode, 
  finished: Promise<void> 
}> {
    const audioContext = existingContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    const finished = new Promise<void>(resolve => {
        source.onended = () => {
            resolve();
        };
    });

    return { source, finished };
}
