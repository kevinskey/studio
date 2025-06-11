
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itmjzhlonmdtyekmxjqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bWp6aGxvbm1kdHlla214anFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MzY0NDAsImV4cCI6MjA2MjExMjQ0MH0.8rdfnsratWSA5B9rF8HY_EAD1eroxIdjLEfFot3LEjQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
