
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { KaraokeTrack } from '@/types/karaoke';
import { uploadKaraokeTrack, loadSavedTracks, deleteKaraokeTrack } from '@/services/karaokeService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [uploadingTrack, setUploadingTrack] = useState<string | null>(null);
  const [isSaveToLibrary, setIsSaveToLibrary] = useState(true);
  const [savedTracks, setSavedTracks] = useState<KaraokeTrack[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

  // Load saved tracks from database on component mount
  useEffect(() => {
    const fetchSavedTracks = async () => {
      setIsLoadingSaved(true);
      try {
        const tracks = await loadSavedTracks();
        setSavedTracks(tracks);
      } catch (error) {
        console.error('Error loading saved tracks:', error);
      } finally {
        setIsLoadingSaved(false);
      }
    };
    
    fetchSavedTracks();
  }, []);

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
    
    audio.onloadedmetadata = async () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      const trackTitle = file.name.replace(/\.[^/.]+$/, "");
      
      if (isSaveToLibrary) {
        // Save to permanent storage
        setUploadingTrack(trackTitle);
        
        const savedTrack = await uploadKaraokeTrack(
          file,
          trackTitle,
          'Custom Upload',
          Math.round(audio.duration)
        );
        
        setUploadingTrack(null);
        
        if (savedTrack) {
          // Add to saved tracks list
          setSavedTracks(prev => [savedTrack, ...prev]);
          setSelectedTrack(savedTrack);
          trackLoadedRef.current = false;
          URL.revokeObjectURL(url); // Clean up the blob URL since we don't need it
          toast.success('Track saved to library successfully!');
        } else {
          // If permanent save fails, fall back to temporary custom track
          handleTemporaryUpload(url, trackTitle, audio.duration);
          toast.error('Failed to save to library. Track is available temporarily.');
        }
      } else {
        // Just use as temporary custom track
        handleTemporaryUpload(url, trackTitle, audio.duration);
      }
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

  const handleTemporaryUpload = (url: string, title: string, duration: number) => {
    const newTrack: KaraokeTrack = {
      id: `custom-${Date.now()}`,
      title: title,
      artist: 'Custom Upload',
      duration: Math.round(duration),
      url,
      isCustom: true
    };

    setCustomTracks(prev => [...prev, newTrack]);
    setSelectedTrack(newTrack);
    trackLoadedRef.current = false;
    toast.success('Track uploaded successfully!');
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

  const selectSavedTrack = (track: KaraokeTrack) => {
    setSelectedTrack(track);
    trackLoadedRef.current = false;
    setIsPlayingTrack(false);
  };

  const handleDeleteSavedTrack = async (trackId: string, trackTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${trackTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingTrackId(trackId);
    
    try {
      const success = await deleteKaraokeTrack(trackId);
      
      if (success) {
        // Remove from local state
        setSavedTracks(prev => prev.filter(t => t.id !== trackId));
        
        // If this was the selected track, clear selection
        if (selectedTrack?.id === trackId) {
          setSelectedTrack(null);
          setIsPlayingTrack(false);
          trackLoadedRef.current = false;
        }
        
        toast.success('Track deleted successfully');
      } else {
        toast.error('Failed to delete track');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
    } finally {
      setDeletingTrackId(null);
    }
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
        <h3 className="text-lg font-semibold mb-4">Upload Karaoke Track</h3>
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="saveToLibrary" 
            checked={isSaveToLibrary}
            onCheckedChange={(checked) => setIsSaveToLibrary(checked as boolean)}
          />
          <Label htmlFor="saveToLibrary">
            Save to permanent library (accessible to all users)
          </Label>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          variant="outline"
          disabled={!!uploadingTrack}
        >
          {uploadingTrack ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving "{uploadingTrack}"...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Choose Audio File
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Supported formats: MP3, WAV, OGG, M4A (Max: 50MB)
        </p>
      </Card>

      {isLoadingSaved ? (
        <Card className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p>Loading saved tracks...</p>
        </Card>
      ) : savedTracks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Saved Library Tracks</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {savedTracks.map((track) => (
              <div 
                key={track.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  selectedTrack?.id === track.id ? 'bg-primary/10 border border-primary/50' : 'bg-muted'
                }`}
                onClick={() => selectSavedTrack(track)}
              >
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {track.artist} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSavedTrack(track.id, track.title);
                  }}
                  disabled={deletingTrackId === track.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingTrackId === track.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {customTracks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Temporary Uploads</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {customTracks.map((track) => (
              <div 
                key={track.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  selectedTrack?.id === track.id ? 'bg-primary/10 border border-primary/50' : 'bg-muted'
                }`}
                onClick={() => selectSavedTrack(track)}
              >
                <div className="flex-1">
                  <div className="font-medium">{track.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {track.artist} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomTrack(track.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Temporary uploads will be lost when you close the browser.
          </p>
        </Card>
      )}
    </>
  );
};
