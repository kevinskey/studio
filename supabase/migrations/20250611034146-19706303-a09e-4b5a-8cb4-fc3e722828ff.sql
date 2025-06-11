
-- Make karaoke_tracks table publicly readable for all users
-- This allows any user to access the saved library tracks

-- Enable RLS on the table first
ALTER TABLE public.karaoke_tracks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to read all tracks
CREATE POLICY "All users can view karaoke tracks" 
  ON public.karaoke_tracks 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create a policy that allows all authenticated users to insert tracks
CREATE POLICY "All users can upload karaoke tracks" 
  ON public.karaoke_tracks 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create a policy that allows all authenticated users to delete tracks
CREATE POLICY "All users can delete karaoke tracks" 
  ON public.karaoke_tracks 
  FOR DELETE 
  TO authenticated
  USING (true);
