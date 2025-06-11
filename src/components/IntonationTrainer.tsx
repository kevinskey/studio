
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Mic, MicOff, RotateCcw } from 'lucide-react';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { usePianoSynth } from '@/hooks/usePianoSynth';
import { PitchGauge } from './intonation/PitchGauge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const IntonationTrainer = () => {
  const [selectedNote, setSelectedNote] = useState('C2');
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'single' | 'sequence'>('single');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const currentNoteRef = useRef<string | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);

  const {
    isListening,
    pitchData,
    error: pitchError,
    startListening,
    stopListening
  } = usePitchDetection();

  const {
    playNote,
    stopNote,
    isInitialized: synthReady
  } = usePianoSynth();

  // Generate notes from C2 to C6 (4 octaves)
  const generateNotes = useCallback(() => {
    const notes = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    for (let octave = 2; octave <= 6; octave++) {
      for (const noteName of noteNames) {
        notes.push(`${noteName}${octave}`);
      }
    }
    
    return notes;
  }, []);

  const notes = generateNotes();

  // Cleanup function with loop prevention
  const cleanupAudio = useCallback(async () => {
    if (isCleaningUpRef.current) {
      return; // Prevent cleanup loop
    }
    
    isCleaningUpRef.current = true;
    console.log('IntonationTrainer: Cleaning up audio...');
    
    try {
      // Clear any pending timeouts
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      
      // Stop currently playing note
      if (currentNoteRef.current) {
        try {
          await stopNote(currentNoteRef.current);
        } catch (error) {
          console.error('Error stopping note during cleanup:', error);
        }
        currentNoteRef.current = null;
      }
      
      setIsPlayingReference(false);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, [stopNote]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const playReferenceNote = async () => {
    if (!synthReady || isCleaningUpRef.current) return;
    
    // Stop any currently playing note first
    await cleanupAudio();
    
    try {
      setIsPlayingReference(true);
      currentNoteRef.current = selectedNote;
      
      console.log('Playing reference note:', selectedNote);
      await playNote(selectedNote, 80);
      
      // Stop the note after 2 seconds
      playbackTimeoutRef.current = setTimeout(async () => {
        if (isCleaningUpRef.current) return;
        
        try {
          if (currentNoteRef.current) {
            await stopNote(currentNoteRef.current);
            currentNoteRef.current = null;
          }
          setIsPlayingReference(false);
          console.log('Reference note stopped automatically');
        } catch (error) {
          console.error('Error auto-stopping reference note:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error playing reference note:', error);
      setIsPlayingReference(false);
      currentNoteRef.current = null;
    }
  };

  const stopReferenceNote = async () => {
    if (!synthReady || isCleaningUpRef.current) return;
    
    console.log('Manually stopping reference note');
    await cleanupAudio();
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const resetScore = () => {
    setScore(0);
    setAttempts(0);
  };

  const handleNoteSelection = async (note: string) => {
    if (note === selectedNote) return; // Don't cleanup if same note
    
    // Clean up before changing notes
    await cleanupAudio();
    setSelectedNote(note);
  };

  // Check if current pitch matches selected note
  const isInTune = pitchData && pitchData.note === selectedNote && Math.abs(pitchData.cents) <= 10;
  const currentCents = pitchData?.note === selectedNote ? pitchData.cents : 0;

  // Update score when in tune
  useEffect(() => {
    if (isInTune && pitchData && isListening) {
      setScore(prev => prev + 1);
      setAttempts(prev => prev + 1);
    } else if (pitchData && pitchData.note === selectedNote && isListening) {
      setAttempts(prev => prev + 1);
    }
  }, [isInTune, pitchData, selectedNote, isListening]);

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Mic className="h-6 w-6" />
            Intonation Trainer
          </CardTitle>
          <CardDescription>
            Train your pitch accuracy with real-time visual feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Note Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Target Note</label>
              <Button variant="outline" size="sm" onClick={resetScore}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Score
              </Button>
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-2 pb-2">
                {notes.map((note) => (
                  <Button
                    key={note}
                    variant={selectedNote === note ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 min-w-[60px]"
                    onClick={() => handleNoteSelection(note)}
                  >
                    {note}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            <div className="text-xs text-muted-foreground text-center">
              Swipe or scroll to see more notes • Currently showing C2 to C6
            </div>
          </div>

          {/* Reference Note Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={playReferenceNote}
              disabled={isPlayingReference || !synthReady}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Play Reference
            </Button>
            
            {isPlayingReference && (
              <Button
                onClick={stopReferenceNote}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>

          {/* Microphone Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={handleToggleListening}
              variant={isListening ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Listening
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {pitchError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
              {pitchError}
            </div>
          )}

          {/* Pitch Gauge */}
          <PitchGauge
            cents={currentCents}
            isActive={isListening && pitchData?.note === selectedNote}
            targetNote={selectedNote}
          />

          {/* Current Pitch Info */}
          {isListening && pitchData && (
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                Detected: <span className="font-mono">{pitchData.note}</span>
              </div>
              {pitchData.note === selectedNote && (
                <Badge variant={isInTune ? "default" : "destructive"}>
                  {isInTune ? "Perfect!" : `${Math.abs(currentCents)} cents ${currentCents > 0 ? 'sharp' : 'flat'}`}
                </Badge>
              )}
            </div>
          )}

          {/* Score Display */}
          <div className="flex items-center justify-center gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{score}</div>
              <div className="text-sm text-muted-foreground">Perfect Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{attempts}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
            <h4 className="font-medium">How to use:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Select a target note by scrolling through the note picker</li>
              <li>Click "Play Reference" to hear the target pitch</li>
              <li>Click "Start Listening" to begin pitch detection</li>
              <li>Sing or play the note and watch the gauge for real-time feedback</li>
              <li>Stay in the green zone for perfect pitch!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
