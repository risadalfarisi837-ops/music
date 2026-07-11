'use client';

import { usePlayerStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Mic2 } from 'lucide-react';

export default function LyricsPage() {
  const { currentTrack, progress, duration } = usePlayerStore();
  const [lyrics, setLyrics] = useState<any[] | null>(null);
  const [lyricsType, setLyricsType] = useState<string | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null);
      setLyricsType(null);
      return;
    }

    setLyrics(null);
    setLyricsType(null);

    const artistName = Array.isArray(currentTrack.artist)
      ? currentTrack.artist.map(a => a.name).join(', ')
      : currentTrack.artist?.name || '';
    
    const queryParams = new URLSearchParams({
      id: currentTrack.videoId,
      title: currentTrack.name,
      artist: artistName
    });

    fetch(`/api/lyrics?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.lyrics && data.lyrics.lines) {
          setLyricsType(data.lyrics.type);
          setLyrics(data.lyrics.lines);
        } else {
          setLyrics([{ text: "Lyrics not available for this song. 😔" }]);
          setLyricsType('plain');
        }
      })
      .catch(() => {
        setLyrics([{ text: "Lyrics not available for this song. 😔" }]);
        setLyricsType('plain');
      });
  }, [currentTrack?.videoId]);

  // Smooth scroll lyrics
  useEffect(() => {
    if (lyricsContainerRef.current && duration > 0 && lyrics && lyrics.length > 0 && lyricsType === 'synced') {
      const container = lyricsContainerRef.current;
      
      const LYRICS_OFFSET = 0.25; // Highlight lyrics slightly early for better rhythm feel
      const index = lyrics.findIndex(line => line.time !== undefined && line.time > (progress + LYRICS_OFFSET));
      const activeIndex = index === -1 ? lyrics.length - 1 : Math.max(0, index - 1);
      
      const lineElements = container.querySelectorAll('.lyric-line');
      if (lineElements[activeIndex]) {
        const targetLine = lineElements[activeIndex] as HTMLElement;
        targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progress, duration, lyrics, lyricsType]);

  if (!currentTrack) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
        <Mic2 className="w-16 h-16 opacity-50" />
        <p>Putar lagu untuk melihat lirik</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative pt-8">
      <div 
        className="relative flex-1 overflow-y-auto no-scrollbar pb-[10vh] px-4 md:px-12 lg:px-24"
        ref={lyricsContainerRef}
        style={{ 
          maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)", 
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" 
        }}
      >
        {lyrics ? (
          <div className="flex flex-col gap-6 md:gap-10 items-start max-w-4xl mx-auto w-full pt-[30vh] pb-[30vh]">
            {lyrics.map((line, i) => {
              let isActive = false;
              if (lyricsType === 'synced') {
                const LYRICS_OFFSET = 0.25;
                const index = lyrics.findIndex(l => l.time !== undefined && l.time > (progress + LYRICS_OFFSET));
                const activeIndex = index === -1 ? lyrics.length - 1 : Math.max(0, index - 1);
                isActive = i === activeIndex;
              }
              
              return (
                <p 
                  key={i} 
                  className={cn(
                    "lyric-line text-2xl md:text-3xl lg:text-4xl font-bold transition-all duration-300 ease-out break-words", 
                    lyricsType === 'synced' 
                      ? (isActive ? "text-white origin-left" : "text-white/30 hover:text-white/50 blur-[0.5px]")
                      : "text-white"
                  )}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}
