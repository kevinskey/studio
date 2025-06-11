
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, Music2, RefreshCw, Info } from 'lucide-react';

export const SightReadingTool = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  const handleRefresh = () => {
    setIsLoaded(false);
    // Force iframe reload
    const iframe = document.getElementById('sight-reading-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    window.open('https://www.sightreadingfactory.com', '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            Sight Reading Practice
          </CardTitle>
          <CardDescription>
            Practice reading musical notation with SightReadingFactory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleOpenExternal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button
              onClick={() => setShowInfo(!showInfo)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              {showInfo ? 'Hide' : 'Show'} Info
            </Button>
          </div>

          {/* Information Panel */}
          {showInfo && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-primary" />
                <h4 className="font-medium">About Sight Reading Practice</h4>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  SightReadingFactory is a powerful tool for developing your ability to read musical notation at sight. 
                  It generates unlimited exercises tailored to your skill level.
                </p>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Features include:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Customizable difficulty levels</li>
                    <li>Multiple clefs (treble, bass, alto, tenor)</li>
                    <li>Rhythm and pitch exercises</li>
                    <li>Interval training</li>
                    <li>Progress tracking</li>
                  </ul>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Free Exercises Available</Badge>
                  <Badge variant="outline">Web-based</Badge>
                  <Badge variant="outline">All Instruments</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Embedded SightReadingFactory */}
          <div className="relative">
            <div className="w-full h-[700px] border rounded-lg overflow-hidden bg-white">
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center space-y-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
                    <p className="text-muted-foreground">Loading SightReadingFactory...</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      If the content doesn't load, try clicking "Open in New Tab" above
                    </p>
                  </div>
                </div>
              )}
              <iframe
                id="sight-reading-iframe"
                src="https://www.sightreadingfactory.com"
                className="w-full h-full"
                title="SightReadingFactory - Music Sight Reading Practice"
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
                style={{ 
                  border: 'none',
                  display: isLoaded ? 'block' : 'none'
                }}
              />
            </div>
            
            {/* Overlay message */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-3 text-sm">
                <p className="text-center text-muted-foreground">
                  <span className="font-medium">Tip:</span> For the best experience, consider creating a free account on SightReadingFactory
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to get started:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>The site will load above - you can start practicing immediately with free exercises</li>
              <li>Click on "Treble Clef" or "Bass Clef" to begin sight reading practice</li>
              <li>Adjust the difficulty settings to match your current level</li>
              <li>Practice regularly to improve your sight reading skills</li>
              <li>Consider creating a free account to track your progress</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
