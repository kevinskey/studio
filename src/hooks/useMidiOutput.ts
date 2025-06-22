import { useState, useEffect } from 'react';

export const useMidiOutput = () => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [output, setOutput] = useState<MIDIOutput | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setError(new Error('Web MIDI API not supported'));
      return;
    }

    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        setMidiAccess(access);
        const firstOutput = access.outputs.values().next().value as MIDIOutput | undefined;
        if (firstOutput) {
          setOutput(firstOutput);
        }
        setIsInitialized(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to access MIDI'));
      });
  }, []);

  const sendNoteOn = (note: number, velocity = 127) => {
    if (output) {
      output.send([0x90, note & 0x7f, velocity & 0x7f]);
    }
  };

  const sendNoteOff = (note: number) => {
    if (output) {
      output.send([0x80, note & 0x7f, 0]);
    }
  };

  const sendProgramChange = (program: number) => {
    if (output) {
      output.send([0xc0, program & 0x7f]);
    }
  };

  const setVolume = (volume: number) => {
    if (output) {
      const vol = Math.floor(Math.max(0, Math.min(1, volume)) * 127);
      output.send([0xb0, 0x07, vol & 0x7f]);
    }
  };

  return {
    isInitialized,
    error,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    setVolume,
  };
};

export type UseMidiOutputReturn = ReturnType<typeof useMidiOutput>;
