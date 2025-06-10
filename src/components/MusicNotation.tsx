
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, RotateCcw } from 'lucide-react';

interface Note {
  name: string;
  position: number; // position on staff (1-9, where 5 is middle line)
  duration: 'whole' | 'half' | 'quarter' | 'eighth';
}

export const MusicNotation = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<Note['duration']>('quarter');

  const staffLines = [1, 2, 3, 4, 5]; // 5 staff lines
  const noteNames = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'G', 'F']; // treble clef positions

  const addNote = (position: number) => {
    const newNote: Note = {
      name: noteNames[position - 1],
      position,
      duration: selectedDuration,
    };
    setNotes([...notes, newNote]);
  };

  const clearStaff = () => {
    setNotes([]);
  };

  const getNoteSymbol = (duration: Note['duration']) => {
    switch (duration) {
      case 'whole': return '●';
      case 'half': return '♩';
      case 'quarter': return '♪';
      case 'eighth': return '♫';
      default: return '♪';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Interactive Music Staff</h3>
        <p className="text-sm text-gray-600">Click on the staff to add notes</p>
      </div>

      {/* Duration selector */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {(['whole', 'half', 'quarter', 'eighth'] as const).map((duration) => (
          <Button
            key={duration}
            variant={selectedDuration === duration ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDuration(duration)}
            className="flex items-center gap-2"
          >
            <span className="text-lg">{getNoteSymbol(duration)}</span>
            <span className="capitalize">{duration}</span>
          </Button>
        ))}
      </div>

      {/* Staff */}
      <div className="relative bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
        {/* Treble clef */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-4xl text-purple-600">
          𝄞
        </div>

        {/* Staff lines */}
        <div className="ml-16 relative" style={{ height: '200px' }}>
          {staffLines.map((line) => (
            <div key={line} className="relative">
              <div
                className="absolute w-full border-t border-gray-400"
                style={{
                  top: `${(line - 1) * 40 + 20}px`,
                }}
              />
              
              {/* Clickable areas for notes */}
              {Array.from({ length: 9 }, (_, i) => i + 1).map((position) => (
                <button
                  key={position}
                  onClick={() => addNote(position)}
                  className="absolute w-8 h-6 hover:bg-blue-100 rounded border border-transparent hover:border-blue-300 transition-colors"
                  style={{
                    top: `${(position - 1) * 20 + 8}px`,
                    left: `${notes.length * 60 + 20}px`,
                  }}
                  title={`Add ${noteNames[position - 1]} note`}
                />
              ))}
            </div>
          ))}

          {/* Rendered notes */}
          {notes.map((note, index) => (
            <div
              key={index}
              className="absolute flex flex-col items-center text-2xl text-purple-600"
              style={{
                top: `${(note.position - 1) * 20}px`,
                left: `${index * 60 + 20}px`,
              }}
            >
              <span className="font-bold">{getNoteSymbol(note.duration)}</span>
              <span className="text-xs text-gray-600 mt-1">{note.name}</span>
            </div>
          ))}
        </div>

        {/* Ledger lines for high/low notes */}
        <div className="ml-16 relative">
          {notes.map((note, index) => {
            if (note.position < 1 || note.position > 9) {
              return (
                <div
                  key={`ledger-${index}`}
                  className="absolute border-t border-gray-400"
                  style={{
                    top: `${(note.position - 1) * 20 + 20}px`,
                    left: `${index * 60 + 10}px`,
                    width: '40px',
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button onClick={clearStaff} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear Staff
        </Button>
      </div>

      {/* Note legend */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Note Values:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">●</span>
            <span>Whole note (4 beats)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">♩</span>
            <span>Half note (2 beats)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">♪</span>
            <span>Quarter note (1 beat)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">♫</span>
            <span>Eighth note (1/2 beat)</span>
          </div>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          <p>Notes added: {notes.map(n => n.name).join(' - ')}</p>
        </div>
      )}
    </div>
  );
};
