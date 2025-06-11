
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Mic, Piano, Clock, Download, User, Home, ArrowLeft, Target } from 'lucide-react';
import { PianoKeyboard } from '@/components/PianoKeyboard';
import { Metronome } from '@/components/Metronome';
import { PitchPipe } from '@/components/PitchPipe';
import { RecordingStudio } from '@/components/RecordingStudio';
import { KaraokeStudio } from '@/components/KaraokeStudio';
import { UserProfile } from '@/components/UserProfile';
import { IntonationTrainer } from '@/components/IntonationTrainer';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Studio = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'piano';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleHomeClick = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading Music Studio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <Music className="h-10 w-10 text-purple-600" />
              Music Studio
            </h1>
            <p className="text-gray-600">Your complete mobile music creation suite</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="piano" className="flex items-center gap-2">
              <Piano className="h-4 w-4" />
              <span className="hidden sm:inline">Piano</span>
            </TabsTrigger>
            <TabsTrigger value="metronome" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Metro</span>
            </TabsTrigger>
            <TabsTrigger value="pitch" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Pitch</span>
            </TabsTrigger>
            <TabsTrigger value="intonation" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Tune</span>
            </TabsTrigger>
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Record</span>
            </TabsTrigger>
            <TabsTrigger value="karaoke" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Karaoke</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="piano" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Virtual Piano</h2>
              <PianoKeyboard />
            </Card>
          </TabsContent>

          <TabsContent value="metronome" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Metronome</h2>
              <Metronome />
            </Card>
          </TabsContent>

          <TabsContent value="pitch" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Pitch Pipe</h2>
              <PitchPipe />
            </Card>
          </TabsContent>

          <TabsContent value="intonation" className="space-y-6">
            <IntonationTrainer />
          </TabsContent>

          <TabsContent value="record" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Recording Studio</h2>
              <RecordingStudio />
            </Card>
          </TabsContent>

          <TabsContent value="karaoke" className="space-y-6">
            <KaraokeStudio />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Studio;
