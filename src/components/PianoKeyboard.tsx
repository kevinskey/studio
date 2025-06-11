
import React from 'react';
import { RotateCcw } from 'lucide-react';
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePianoKeyboard();

  // Mobile horizontal layout
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        {/* iOS Audio Warning */}
        {isIOS && !audioContextInitialized && (
          <div className="flex items-center justify-center gap-2 p-4 bg-orange-50 rounded-lg border-2 border-orange-200 animate-pulse">
            <span className="text-sm text-orange-800 font-bold">
              🎹 Tap any piano key to enable sound on iPhone/iPad
            </span>
          </div>
        )}

        {/* Audio Status for iOS */}
        {isIOS && audioContextInitialized && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-800 font-medium">
              ✅ Audio enabled and ready to play!
            </span>
          </div>
        )}

        {/* Rotate instruction for mobile */}
        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <RotateCcw className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800 font-medium">
            Rotate your device horizontally for better piano experience
          </span>
        </div>

        {/* Mobile Controls */}
        <PianoControls
          selectedInstrument={selectedInstrument}
          setSelectedInstrument={setSelectedInstrument}
          currentOctave={currentOctave}
          setCurrentOctave={setCurrentOctave}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isMobile={true}
        />

        {/* Swipe instruction */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Swipe left/right to change octaves • Current: C{currentOctave} to C{currentOctave + 2}</p>
        </div>

        {/* Mobile Piano Keyboard */}
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

        <div className="text-center text-sm text-muted-foreground">
          <p>Tap the keys to play notes</p>
          <p className="mt-1">Current instrument: {instruments[selectedInstrument].name}</p>
          <p className="mt-1">Showing 3 octaves: C{currentOctave} to C{currentOctave + 2}</p>
          {isIOS && audioContextInitialized && <p className="mt-1 text-green-600">✓ Audio enabled for iOS</p>}
          {isIOS && !audioContextInitialized && <p className="mt-1 text-orange-600">⚠️ Tap a key to enable audio</p>}
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
        <p className="mt-1">Showing 3 octaves: C{currentOctave} to C{currentOctave + 2}</p>
        {isIOS && audioContextInitialized && <p className="mt-1 text-green-600">✓ Audio enabled for iOS</p>}
        {isIOS && !audioContextInitialized && <p className="mt-1 text-orange-600">⚠️ Tap a key to enable audio</p>}
      </div>
    </div>
  );
};
