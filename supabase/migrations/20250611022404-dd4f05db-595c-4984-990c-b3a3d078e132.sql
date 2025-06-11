
-- Add RLS policy to allow anyone to insert tracks to the karaoke_tracks table
CREATE POLICY "Allow public insert access to karaoke tracks" 
  ON public.karaoke_tracks 
  FOR INSERT 
  WITH CHECK (true);
