
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { KaraokeTrack } from '@/types/karaoke';

interface TrackUploadProps {
  customTracks: KaraokeTrack[];
  setCustomTracks: React.Dispatch<React.SetStateAction<KaraokeTrack[]>>;
  setSelectedTrack: React.Dispatch<React.SetStateAction<KaraokeTrack | null>>;
  selectedTrack: KaraokeTrack | null;
  setIsPlayingTrack: (playing: boolean) => void;
  trackLoadedRef: React.MutableRefObject<boolean>;
}

export const TrackUpload: React.FC<TrackUploadProps> = ({
  customTracks,
  setCustomTracks,
  setSelectedTrack,
  selectedTrack,
  setIsPlayingTrack,
  trackLoadedRef
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.onloadedmetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      const newTrack: KaraokeTrack = {
        id: `custom-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Custom Upload',
        duration: Math.round(audio.duration),
        url,
        isCustom: true
      };

      setCustomTracks(prev => [...prev, newTrack]);
      setSelectedTrack(newTrack);
      trackLoadedRef.current = false;
      toast.success('Track uploaded successfully!');
    };

    audio.onerror = (e) => {
      console.error('Error loading audio file:', e);
      URL.revokeObjectURL(url);
      toast.error('Failed to load audio file. Please try a different format.');
    };

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeCustomTrack = (trackId: string) => {
    const trackToRemove = customTracks.find(t => t.id === trackId);
    if (trackToRemove && trackToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(trackToRemove.url);
    }
    
    setCustomTracks(prev => prev.filter(t => t.id !== trackId));
    
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
      setIsPlayingTrack(false);
      trackLoadedRef.current = false;
    }
    
    toast.success('Track removed');
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Your Own Track</h3>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          variant="outline"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Audio File
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: MP3, WAV, OGG, M4A (Max: 50MB)
        </p>
      </Card>

      {customTracks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Uploaded Tracks</h3>
          <div className="space-y-2">
            {customTracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCustomTrack(track.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
};
