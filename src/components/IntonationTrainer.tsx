
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Mic, MicOff, RotateCcw } from 'lucide-react';
import { PitchGauge } from '@/components/intonation/PitchGauge';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { usePianoSynth } from '@/hooks/usePianoSynth';

const PRACTICE_NOTES = [
  { note: 'C4', frequency: 261.63 },
  { note: 'D4', frequency: 293.66 },
  { note: 'E4', frequency: 329.63 },
  { note: 'F4', frequency: 349.23 },
  { note: 'G4', frequency: 392.00 },
  { note: 'A4', frequency: 440.00 },
  { note: 'B4', frequency: 493.88 },
  { note: 'C5', frequency: 523.25 }
];

export const IntonationTrainer = () => {
  const [selectedNote, setSelectedNote] = useState(PRACTICE_NOTES[5]); // A4 default
  const [isPlaying, setIsPlaying] = useState(false);
  const [exerciseMode, setExerciseMode] = useState<'single' | 'sequence'>('single');
  const [score, setScore] = useState<number[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  const { 
    isListening, 
    pitchData, 
    error, 
    startListening, 
    stopListening 
  } = usePitchDetection();
  
  const { 
    playNote, 
    stopNote, 
    isInitialized: synthReady 
  } = usePianoSynth();

  // Play the target note
  const playTargetNote = useCallback(async () => {
    if (!synthReady) return;
    
    setIsPlaying(true);
    await playNote(selectedNote.note, 100);
    
    // Stop after 2 seconds
    setTimeout(async () => {
      await stopNote(selectedNote.note);
      setIsPlaying(false);
    }, 2000);
  }, [selectedNote.note, synthReady, playNote, stopNote]);

  // Calculate accuracy score based on cents deviation
  const calculateAccuracy = useCallback((cents: number) => {
    const maxDeviation = 50; // ±50 cents
    const accuracy = Math.max(0, 100 - (Math.abs(cents) / maxDeviation) * 100);
    return Math.round(accuracy);
  }, []);

  // Handle pitch data updates for scoring
  useEffect(() => {
    if (pitchData && pitchData.confidence > 0.7) {
      const accuracy = calculateAccuracy(pitchData.cents);
      
      // Update score if accuracy is good enough and we're targeting the right note
      if (accuracy > 70 && pitchData.note === selectedNote.note) {
        setScore(prev => [...prev.slice(-9), accuracy]); // Keep last 10 scores
      }
    }
  }, [pitchData, selectedNote.note, calculateAccuracy]);

  // Auto-advance in sequence mode
  useEffect(() => {
    if (exerciseMode === 'sequence' && score.length > 0) {
      const recentScores = score.slice(-5);
      const averageScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      // Auto-advance if recent average score is above 80
      if (recentScores.length >= 3 && averageScore > 80) {
        setTimeout(() => {
          const nextIndex = (currentExerciseIndex + 1) % PRACTICE_NOTES.length;
          setCurrentExerciseIndex(nextIndex);
          setSelectedNote(PRACTICE_NOTES[nextIndex]);
          setScore([]);
        }, 1000);
      }
    }
  }, [score, exerciseMode, currentExerciseIndex]);

  const handleStartStop = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    setScore([]);
    setCurrentExerciseIndex(0);
    setSelectedNote(PRACTICE_NOTES[0]);
  };

  const averageScore = score.length > 0 ? 
    Math.round(score.reduce((a, b) => a + b, 0) / score.length) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            Intonation Trainer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mode:</span>
                <Select 
                  value={exerciseMode} 
                  onValueChange={(value) => setExerciseMode(value as 'single' | 'sequence')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Note</SelectItem>
                    <SelectItem value="sequence">Sequence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {exerciseMode === 'single' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Note:</span>
                  <Select 
                    value={selectedNote.note} 
                    onValueChange={(value) => {
                      const note = PRACTICE_NOTES.find(n => n.note === value);
                      if (note) setSelectedNote(note);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRACTICE_NOTES.map(note => (
                        <SelectItem key={note.note} value={note.note}>
                          {note.note}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={playTargetNote}
                disabled={!synthReady || isPlaying}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Playing...' : 'Play Note'}
              </Button>
              
              <Button
                variant={isListening ? "destructive" : "default"}
                onClick={handleStartStop}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? 'Stop' : 'Start'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* Pitch Gauge */}
          <div className="flex justify-center">
            <PitchGauge
              cents={pitchData?.cents || 0}
              isActive={isListening && !!pitchData}
              targetNote={selectedNote.note}
            />
          </div>
          
          {/* Score and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground">Current Note</div>
              <div className="text-lg font-bold">
                {pitchData?.note || '--'}
              </div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground">Average Score</div>
              <div className="text-lg font-bold text-primary">
                {averageScore > 0 ? `${averageScore}%` : '--'}
              </div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground">
                {exerciseMode === 'sequence' ? 'Progress' : 'Attempts'}
              </div>
              <div className="text-lg font-bold">
                {exerciseMode === 'sequence' 
                  ? `${currentExerciseIndex + 1}/${PRACTICE_NOTES.length}`
                  : score.length
                }
              </div>
            </Card>
          </div>
          
          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p>
              1. Click "Play Note" to hear the target pitch
            </p>
            <p>
              2. Click "Start" and sing the note into your microphone
            </p>
            <p>
              3. Watch the gauge to see if you're flat, sharp, or in tune
            </p>
            <p>
              Stay within ±10 cents of the target for best accuracy!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
