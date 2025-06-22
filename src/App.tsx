
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Music, Mic, Piano, Clock } from "lucide-react";
import { KaraokeStudio } from "@/components/KaraokeStudio";
import { RecordingStudio } from "@/components/RecordingStudio";
import { Metronome } from "@/components/Metronome";
import { PitchPipe } from "@/components/PitchPipe";
import { PianoKeyboard } from "@/components/PianoKeyboard";

function App() {
  const [activeTab, setActiveTab] = React.useState("karaoke");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Music className="h-8 w-8 text-purple-600" />
            Karaoke Studio
          </h1>
          <p className="text-gray-600">Sing and record with built-in tools</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 gap-2 mb-6">
            <TabsTrigger value="karaoke" className="flex items-center gap-2">
              <Mic className="h-4 w-4" /> Karaoke
            </TabsTrigger>
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="h-4 w-4" /> Record
            </TabsTrigger>
            <TabsTrigger value="metronome" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Metro
            </TabsTrigger>
            <TabsTrigger value="pitch" className="flex items-center gap-2">
              <Music className="h-4 w-4" /> Pitch
            </TabsTrigger>
            <TabsTrigger value="piano" className="flex items-center gap-2">
              <Piano className="h-4 w-4" /> Piano
            </TabsTrigger>
          </TabsList>
          <TabsContent value="karaoke">
            <KaraokeStudio />
          </TabsContent>
          <TabsContent value="record">
            <RecordingStudio />
          </TabsContent>
          <TabsContent value="metronome">
            <Metronome />
          </TabsContent>
          <TabsContent value="pitch">
            <PitchPipe />
          </TabsContent>
          <TabsContent value="piano">
            <PianoKeyboard />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
