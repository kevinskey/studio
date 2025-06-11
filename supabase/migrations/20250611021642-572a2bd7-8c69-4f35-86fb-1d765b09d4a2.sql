
-- Create a table for karaoke tracks
CREATE TABLE public.karaoke_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Custom Upload',
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_url TEXT NOT NULL
);

-- Make the table accessible to all users (no authentication required)
ALTER TABLE public.karaoke_tracks ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to view tracks
CREATE POLICY "Allow public read access to karaoke tracks" 
  ON public.karaoke_tracks 
  FOR SELECT 
  USING (true);

-- Create a storage bucket for karaoke audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('karaoke-tracks', 'karaoke-tracks', true);

-- Policy to allow anyone to upload to the bucket
CREATE POLICY "Allow public uploads to karaoke tracks" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'karaoke-tracks');

-- Policy to allow anyone to read from the bucket
CREATE POLICY "Allow public read access to karaoke tracks"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'karaoke-tracks');
