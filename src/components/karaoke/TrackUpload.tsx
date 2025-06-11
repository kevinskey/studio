import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Music, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { KaraokeTrack } from '@/types/karaoke';
import { uploadKaraokeTrack, loadSavedTracks, deleteKaraokeTrack } from '@/services/karaokeService';

interface TrackUploadProps {
  customTracks: KaraokeTrack[];
  setCustomTracks: (tracks: KaraokeTrack[]) => void;
  savedTracks: KaraokeTrack[];
  setSavedTracks: (tracks: KaraokeTrack[]) => void;
  selectedTrack: KaraokeTrack | null;
  setSelectedTrack: (track: KaraokeTrack | null) => void;
  setIsPlayingTrack: (playing: boolean) => void;
  trackLoadedRef: React.MutableRefObject<boolean>;
}

export const TrackUpload: React.FC<TrackUploadProps> = ({
  customTracks,
  setCustomTracks,
  savedTracks,
  setSavedTracks,
  selectedTrack,
  setSelectedTrack,
  setIsPlayingTrack,
  trackLoadedRef
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');

  // Load saved tracks when component mounts
  useEffect(() => {
    loadSavedTracksFromDB();
  }, []);

  const loadSavedTracksFromDB = async () => {
    try {
      const tracks = await loadSavedTracks();
      setSavedTracks(tracks);
    } catch (error) {
      console.error('Error loading saved tracks:', error);
      toast.error('Failed to load saved tracks');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!uploadTitle.trim()) {
      toast.error('Please enter a title for the track');
      return;
    }

    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    setIsUploading(true);

    try {
      // Create temporary local track first for immediate use
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          const duration = Math.floor(audio.duration);
          
          const tempTrack: KaraokeTrack = {
            id: `temp-${Date.now()}`,
            title: uploadTitle.trim(),
            artist: uploadArtist.trim() || 'Custom Upload',
            duration: duration,
            url: audioUrl,
            isCustom: true
          };
          
          setCustomTracks([...customTracks, tempTrack]);
          setSelectedTrack(tempTrack);
          setIsPlayingTrack(false);
          trackLoadedRef.current = false;
          
          toast.success('Track added for this session!');
          resolve(duration);
        };
        audio.onerror = () => reject(new Error('Invalid audio file'));
      });

      // Upload to permanent storage in background
      const uploadAudio = new Audio(URL.createObjectURL(file));
      await new Promise((resolve, reject) => {
        uploadAudio.onloadedmetadata = () => resolve(Math.floor(uploadAudio.duration));
        uploadAudio.onerror = () => reject(new Error('Invalid audio file'));
      });

      const duration = Math.floor(uploadAudio.duration);
      const savedTrack = await uploadKaraokeTrack(file, uploadTitle.trim(), uploadArtist.trim() || 'Custom Upload', duration);
      
      if (savedTrack) {
        setSavedTracks([savedTrack, ...savedTracks]);
        toast.success('Track saved to library permanently!');
      }

    } catch (error) {
      console.error('Error uploading track:', error);
      toast.error('Failed to process audio file. Please try a different format.');
    } finally {
      setIsUploading(false);
      setUploadTitle('');
      setUploadArtist('');
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDeleteSavedTrack = async (trackId: string) => {
    const track = savedTracks.find(t => t.id === trackId);
    if (!track) return;

    if (!confirm(`Are you sure you want to delete "${track.title}" from the library? This will affect all users.`)) {
      return;
    }

    try {
      const success = await deleteKaraokeTrack(trackId);
      if (success) {
        setSavedTracks(savedTracks.filter(t => t.id !== trackId));
        
        // If the deleted track was selected, clear selection
        if (selectedTrack?.id === trackId) {
          setSelectedTrack(null);
          setIsPlayingTrack(false);
          trackLoadedRef.current = false;
        }
        
        toast.success('Track deleted from library');
      } else {
        toast.error('Failed to delete track');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
    }
  };

  const handleDeleteCustomTrack = (trackId: string) => {
    const track = customTracks.find(t => t.id === trackId);
    if (!track) return;

    if (!confirm(`Are you sure you want to remove "${track.title}" from this session?`)) {
      return;
    }

    // Clean up the blob URL
    if (track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }

    setCustomTracks(customTracks.filter(t => t.id !== trackId));
    
    // If the deleted track was selected, clear selection
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
      setIsPlayingTrack(false);
      trackLoadedRef.current = false;
    }
    
    toast.success('Track removed from session');
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Audio Track</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Song Title *</Label>
            <Input
              id="title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Enter song title"
              required
            />
          </div>
          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={uploadArtist}
              onChange={(e) => setUploadArtist(e.target.value)}
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="audio-upload">Audio File</Label>
          <Input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-600 mt-1">
            Supports MP3, WAV, OGG, and other audio formats
          </p>
        </div>

        {isUploading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Upload className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Processing and uploading track...</span>
          </div>
        )}
      </div>

      {/* Saved Library Tracks */}
      {savedTracks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Music className="h-4 w-4" />
            Library Tracks ({savedTracks.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{track.title}</div>
                  <div className="text-xs text-gray-600 truncate">{track.artist}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteSavedTrack(track.id)}
                  className="text-destructive hover:text-destructive ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Session Tracks */}
      {customTracks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3">Session Tracks ({customTracks.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {customTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{track.title}</div>
                  <div className="text-xs text-gray-600 truncate">{track.artist}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteCustomTrack(track.id)}
                  className="text-destructive hover:text-destructive ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Session tracks are temporary and will be lost when you reload the page
          </p>
        </div>
      )}
    </Card>
  );
};
