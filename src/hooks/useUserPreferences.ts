
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SynthInstrumentType } from './usePianoSynth';

interface UserPreferences {
  id: string;
  user_id: string;
  preferred_instrument: SynthInstrumentType;
  default_tempo: number;
  default_volume: number;
  metronome_sound: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          const { data: newPrefs, error: createError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              preferred_instrument: 'grand-piano' as SynthInstrumentType,
              default_tempo: 120,
              default_volume: 0.7,
              metronome_sound: true,
            })
            .select()
            .single();

          if (createError) throw createError;
          return newPrefs;
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user?.id || !preferences?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences', user?.id], data);
    },
  });

  const updatePreferences = (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    updatePreferencesMutation.mutate(updates);
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    isUpdating: updatePreferencesMutation.isPending,
  };
};
