
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Play, Pause } from 'lucide-react';
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
                {track.title} - {track.artist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedTrack && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{selectedTrack.title}</div>
              <div className="text-sm text-gray-600">
                {selectedTrack.artist}
                {selectedTrack.isCustom && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Custom
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
