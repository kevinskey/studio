
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Mic, Piano, Clock, Download } from 'lucide-react';
import { PianoKeyboard } from '@/components/PianoKeyboard';
import { Metronome } from '@/components/Metronome';
import { PitchPipe } from '@/components/PitchPipe';
import { RecordingStudio } from '@/components/RecordingStudio';
import { KaraokeStudio } from '@/components/KaraokeStudio';

const Index = () => {
  const [activeTab, setActiveTab] = useState('piano');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Music className="h-10 w-10 text-purple-600" />
            Music Studio
          </h1>
          <p className="text-gray-600">Your complete mobile music creation suite</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
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
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Record</span>
            </TabsTrigger>
            <TabsTrigger value="karaoke" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Karaoke</span>
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

          <TabsContent value="record" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Recording Studio</h2>
              <RecordingStudio />
            </Card>
          </TabsContent>

          <TabsContent value="karaoke" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center">Karaoke Studio</h2>
              <KaraokeStudio />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
