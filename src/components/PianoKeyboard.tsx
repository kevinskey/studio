import React from 'react';
import { RotateCcw, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePianoKeyboard } from './piano/usePianoKeyboard';
import { PianoControls } from './piano/PianoControls';
import { PianoKeyboard as PianoKeyboardLayout } from './piano/PianoKeyboard';
import { instruments } from './piano/types';

export const PianoKeyboard = () => {
  const isMobile = useIsMobile();
  const {
    isPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    selectedInstrument,
    setSelectedInstrument,
    currentOctave,
    setCurrentOctave,
    audioContextInitialized,
    isIOS,
    notes,
    isLoading,
    handlePlayNote,
    handleStopNote,
    handlePanic,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePianoKeyboard();

  // Mobile layout
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Compact mobile header */}
        <div className="flex-shrink-0 p-3 bg-white border-b shadow-sm">
          {/* iOS Audio Warning */}
          {isIOS && !audioContextInitialized && (
            <div className="flex items-center justify-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200 mb-3">
              <span className="text-xs text-orange-800 font-medium">
                🎹 Tap any key to enable audio
              </span>
            </div>
          )}

          {/* Mobile Controls - Compact */}
          <PianoControls
            selectedInstrument={selectedInstrument}
            setSelectedInstrument={setSelectedInstrument}
            currentOctave={currentOctave}
            setCurrentOctave={setCurrentOctave}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onPanic={handlePanic}
            isMobile={true}
          />

          {/* Current octave indicator */}
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Octaves: C{currentOctave} - C{currentOctave + 1}
            </span>
          </div>
        </div>

        {/* Piano takes remaining space */}
        <div className="flex-1 relative">
          <PianoKeyboardLayout
            notes={notes}
            isPlaying={isPlaying}
            onPlayNote={handlePlayNote}
            onStopNote={handleStopNote}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="w-full space-y-6">
      {/* iOS Audio Warning for desktop view */}
      {isIOS && !audioContextInitialized && (
        <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-center text-sm font-medium border-2 border-orange-200">
          🎹 Tap any piano key to enable audio on iPhone/iPad devices
        </div>
      )}

      {/* Audio Status for iOS Desktop */}
      {isIOS && audioContextInitialized && (
        <div className="bg-green-50 text-green-800 p-3 rounded-md text-center text-sm">
          ✅ Audio enabled and ready to play!
        </div>
      )}

      {/* Desktop Controls */}
      <PianoControls
        selectedInstrument={selectedInstrument}
        setSelectedInstrument={setSelectedInstrument}
        currentOctave={currentOctave}
        setCurrentOctave={setCurrentOctave}
        volume={volume}
        setVolume={setVolume}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onPanic={handlePanic}
        isMobile={false}
      />

      {/* Status indicator for WebAssembly synth */}
      {isLoading && (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-center text-sm">
          Loading advanced piano synthesizer...
        </div>
      )}

      {/* Desktop Piano Keyboard */}
      <PianoKeyboardLayout
        notes={notes}
        isPlaying={isPlaying}
        onPlayNote={handlePlayNote}
        onStopNote={handleStopNote}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        isMobile={false}
      />

      <div className="text-center text-sm text-muted-foreground">
        <p>Tap or click the keys to play notes</p>
        <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
        <p className="mt-1">Showing 2 octaves: C{currentOctave} to C{currentOctave + 1}</p>
        {isIOS && audioContextInitialized && <p className="mt-1 text-green-600">✓ Audio enabled for iOS</p>}
        {isIOS && !audioContextInitialized && <p className="mt-1 text-orange-600">⚠️ Tap a key to enable audio</p>}
      </div>
    </div>
  );
};
