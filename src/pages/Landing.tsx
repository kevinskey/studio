
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Mic, Piano, Clock, Download, User, Home, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
    return null;
  }

  const features = [
    {
      id: 'piano',
      title: 'Virtual Piano',
      description: 'Play beautiful piano sounds with multiple instruments and realistic key response',
      icon: Piano,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'metronome',
      title: 'Metronome',
      description: 'Keep perfect time with our precision metronome for practice sessions',
      icon: Clock,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pitch',
      title: 'Pitch Pipe',
      description: 'Reference tones for tuning instruments and vocal warm-ups',
      icon: Music,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'intonation',
      title: 'Intonation Trainer',
      description: 'Train your pitch accuracy with real-time visual feedback and exercises',
      icon: Target,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'record',
      title: 'Recording Studio',
      description: 'Record high-quality audio with professional recording tools',
      icon: Mic,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'karaoke',
      title: 'Karaoke Studio',
      description: 'Sing along to your favorite tracks with karaoke features',
      icon: Download,
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'profile',
      title: 'User Profile',
      description: 'Manage your preferences and customize your music experience',
      icon: User,
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    navigate(`/studio?tab=${featureId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Music className="h-12 w-12 text-purple-600" />
            Music Studio
          </h1>
          <p className="text-xl text-gray-600 mb-2">Your complete mobile music creation suite</p>
          <p className="text-gray-500">Choose a feature below to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.id}
                className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm"
                onClick={() => handleFeatureClick(feature.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="mt-4 group-hover:bg-purple-50 group-hover:border-purple-300 transition-colors"
                  >
                    Open {feature.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Welcome back, {user?.email}! Ready to make some music?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
