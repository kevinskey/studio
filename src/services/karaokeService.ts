import { supabase } from "@/integrations/supabase/client";
import { KaraokeTrack } from "@/types/karaoke";

const BUCKET_NAME = 'karaoke-tracks';

export async function uploadKaraokeTrack(
  file: File,
  title: string,
  artist: string = 'Custom Upload',
  duration: number
): Promise<KaraokeTrack | null> {
  try {
    // Generate a unique file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}.${fileExt}`;
    
    console.log(`Uploading file to ${BUCKET_NAME}/${filePath}`);
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
      
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    const fileUrl = publicUrlData.publicUrl;
    
    // Save track info to database
    const { data: trackData, error: dbError } = await supabase
      .from('karaoke_tracks')
      .insert({
        title: title,
        artist: artist,
        duration: duration,
        file_url: fileUrl
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Error saving track to database:', dbError);
      
      // Try to clean up the storage file if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      
      throw new Error(`Database save failed: ${dbError.message}`);
    }
    
    // Return the track data in KaraokeTrack format
    return {
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      duration: trackData.duration,
      url: fileUrl,
      isCustom: false // Since it's now saved permanently, we don't consider it as a temporary custom track
    };
  } catch (error) {
    console.error('Upload karaoke track failed:', error);
    return null;
  }
}

export async function loadSavedTracks(): Promise<KaraokeTrack[]> {
  try {
    const { data, error } = await supabase
      .from('karaoke_tracks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading saved tracks:', error);
      return [];
    }
    
    // Map database records to KaraokeTrack type
    return data.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      url: track.file_url,
      isCustom: false
    }));
  } catch (error) {
    console.error('Failed to load saved tracks:', error);
    return [];
  }
}

export async function deleteKaraokeTrack(trackId: string): Promise<boolean> {
  try {
    // First, get the track info to find the file URL
    const { data: track, error: fetchError } = await supabase
      .from('karaoke_tracks')
      .select('file_url')
      .eq('id', trackId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching track for deletion:', fetchError);
      return false;
    }
    
    // Extract file path from URL for storage deletion
    const url = new URL(track.file_url);
    const filePath = url.pathname.split('/').pop(); // Get the filename from the URL
    
    // Delete from database first
    const { error: dbError } = await supabase
      .from('karaoke_tracks')
      .delete()
      .eq('id', trackId);
    
    if (dbError) {
      console.error('Error deleting track from database:', dbError);
      return false;
    }
    
    // Delete file from storage
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Don't return false here since the database record is already deleted
      }
    }
    
    return true;
  } catch (error) {
    console.error('Delete karaoke track failed:', error);
    return false;
  }
}
