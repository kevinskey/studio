
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { INSTRUMENT_MAP, SynthInstrumentType } from '@/hooks/usePianoSynth';

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading preferences...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-purple-600" />
            <div>
              <CardTitle className="text-lg">Welcome back!</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="font-semibold">Music Preferences</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="instrument">Preferred Instrument</Label>
              <Select
                value={preferences?.preferred_instrument || 'grand-piano'}
                onValueChange={(value: SynthInstrumentType) => 
                  updatePreferences({ preferred_instrument: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSTRUMENT_MAP).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {key.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Tempo: {preferences?.default_tempo || 120} BPM</Label>
              <Slider
                value={[preferences?.default_tempo || 120]}
                onValueChange={([value]) => updatePreferences({ default_tempo: value })}
                min={60}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Volume: {Math.round((preferences?.default_volume || 0.7) * 100)}%</Label>
              <Slider
                value={[preferences?.default_volume || 0.7]}
                onValueChange={([value]) => updatePreferences({ default_volume: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="metronome-sound">Metronome Sound</Label>
              <Switch
                id="metronome-sound"
                checked={preferences?.metronome_sound ?? true}
                onCheckedChange={(checked) => 
                  updatePreferences({ metronome_sound: checked })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
