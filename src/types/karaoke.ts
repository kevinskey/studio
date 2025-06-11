
export interface KaraokeTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  isCustom?: boolean;
}

export interface Recording {
  id: string;
  trackId: string;
  name: string;
  url: string;
  timestamp: Date;
}
