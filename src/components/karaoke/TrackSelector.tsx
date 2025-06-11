
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Play, Pause, Music, Clock } from 'lucide-react';
import { KaraokeTrack } from '@/types/karaoke';

interface TrackSelectorProps {
  allTracks: KaraokeTrack[];
  selectedTrack: KaraokeTrack | null;
  isPlayingTrack: boolean;
  onSelectTrack: (trackId: string) => void;
  onTogglePlayback: () => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  allTracks,
  selectedTrack,
  isPlayingTrack,
  onSelectTrack,
  onTogglePlayback
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Choose Your Karaoke Track</h3>
      {allTracks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tracks available. Please upload an audio file to get started.</p>
        </div>
      ) : (
        <Select onValueChange={onSelectTrack} value={selectedTrack?.id || ""}>
          <SelectTrigger>
            <SelectValue placeholder="Select a song to sing along with" />
          </SelectTrigger>
          <SelectContent>
            {allTracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>
                <div className="flex items-center gap-2">
                  {track.isCustom ? (
                    <Clock className="h-3 w-3 text-orange-500" />
                  ) : (
                    <Music className="h-3 w-3 text-green-500" />
                  )}
                  <span>{track.title} - {track.artist}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedTrack && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-2">
                {selectedTrack.isCustom ? (
                  <Clock className="h-4 w-4 text-orange-500" />
                ) : (
                  <Music className="h-4 w-4 text-green-500" />
                )}
                {selectedTrack.title}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                <span>{selectedTrack.artist}</span>
                <span>•</span>
                <span>{formatDuration(selectedTrack.duration)}</span>
                {selectedTrack.isCustom ? (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Session
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Library
                  </span>
                )}
              </div>
            </div>
            <Button onClick={onTogglePlayback} variant="outline">
              {isPlayingTrack ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlayingTrack ? 'Pause' : 'Preview'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
