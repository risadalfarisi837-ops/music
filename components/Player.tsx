'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore, useSettingsStore, usePartyStore } from '@/lib/store';
import { db } from '@/lib/db';
import YouTube from 'react-youtube';
import { Capacitor } from '@capacitor/core';
import { PiPPlugin } from '@/lib/pip';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Heart, ChevronDown, ListMusic, Mic2, Shuffle, Repeat, Repeat1, Maximize2, MoreVertical, ListPlus, User, Minimize2, MoreHorizontal, Volume2, Timer, PictureInPicture2, PanelRight } from 'lucide-react';
import { cn, getHighResImage } from '@/lib/utils';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { QueueList } from './QueueList';

import { MarqueeText } from './MarqueeText';
import { usePartySync } from '@/hooks/usePartySync';

export function Player() {
  const router = useRouter();
  const pathname = usePathname();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isExpanded = usePlayerStore((state) => state.isExpanded);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setExpanded = usePlayerStore((state) => state.setExpanded);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrev = usePlayerStore((state) => state.playPrev);
  const setTrackToAdd = usePlayerStore((state) => state.setTrackToAdd);
  const setActiveMenuTrack = usePlayerStore((state) => state.setActiveMenuTrack);
  const dominantColor = usePlayerStore((state) => state.dominantColor);
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleRepeat = usePlayerStore((state) => state.toggleRepeat);
  const sleepTimer = usePlayerStore((state) => state.sleepTimer);
  const setSleepTimer = usePlayerStore((state) => state.setSleepTimer);
  const isRightSidebarOpen = usePlayerStore((state) => state.isRightSidebarOpen);
  const toggleRightSidebar = usePlayerStore((state) => state.toggleRightSidebar);
  const rightSidebarMode = usePlayerStore((state) => state.rightSidebarMode);
  const setRightSidebarMode = usePlayerStore((state) => state.setRightSidebarMode);
  const dataSaver = useSettingsStore((state) => state.dataSaver);

  const [isLiked, setIsLiked] = useState(false);
  const [lyrics, setLyrics] = useState<{ text: string; time?: number }[] | null>(null);
  const [lyricsType, setLyricsType] = useState<'synced' | 'plain' | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isAlternativeTrying, setIsAlternativeTrying] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);
  const [isPipMode, setIsPipMode] = useState(false);
  
  const { roomId: partyRoomId, isHost: isPartyHost } = usePartyStore();
  const isGuest = Boolean(partyRoomId && !isPartyHost);
  
  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  usePartySync(playerRef);
  
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      BackgroundMode.enable({
        title: 'MusikKuzyy',
        text: 'Memutar musik di latar belakang',
        hidden: false,
        silent: false,
        disableWebViewOptimization: true,
      }).then(() => {
        BackgroundMode.disableWebViewOptimizations();
        
        // Only ask battery permission ONCE (first time ever)
        const alreadyAsked = localStorage.getItem('batteryOptAsked');
        if (!alreadyAsked) {
          BackgroundMode.checkBatteryOptimizations().then(result => {
            if (result.enabled) {
              BackgroundMode.requestDisableBatteryOptimizations();
            }
            localStorage.setItem('batteryOptAsked', 'true');
          }).catch(console.error);
        }
      }).catch(console.error);

      // Sync PiP setting from localStorage to native
      const savedPip = localStorage.getItem('autoPipEnabled');
      const pipEnabled = savedPip !== null ? savedPip === 'true' : true;
      PiPPlugin.setAutoPipEnabled({ enabled: pipEnabled }).catch(console.error);

      // Force music to keep playing when app goes to background
      // Use aggressive burst: retry playVideo every 100ms for the first second
      BackgroundMode.addListener('appInBackground', () => {
        const forcePlay = () => {
          if (usePlayerStore.getState().isPlaying && playerRef.current) {
            playerRef.current.playVideo();
          }
        };
        // Immediate + burst retries at 100, 200, 300, 500, 800ms
        forcePlay();
        setTimeout(forcePlay, 100);
        setTimeout(forcePlay, 200);
        setTimeout(forcePlay, 300);
        setTimeout(forcePlay, 500);
        setTimeout(forcePlay, 800);
      });

      BackgroundMode.addListener('appInForeground', () => {
        if (usePlayerStore.getState().isPlaying && playerRef.current) {
          playerRef.current.playVideo();
        }
      });
    }
  }, []);

  // Sync play state to PiP controls (updates play/pause icon in PiP window)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      PiPPlugin.setPlayState({ playing: isPlaying }).catch(console.error);
    }
  }, [isPlaying]);

  // Listen for PiP control button events from native Android
  useEffect(() => {
    const handlePipPrev = () => playPrev();
    const handlePipToggle = () => togglePlay();
    const handlePipNext = () => playNext();

    window.addEventListener('pip-prev', handlePipPrev);
    window.addEventListener('pip-toggle', handlePipToggle);
    window.addEventListener('pip-next', handlePipNext);

    return () => {
      window.removeEventListener('pip-prev', handlePipPrev);
      window.removeEventListener('pip-toggle', handlePipToggle);
      window.removeEventListener('pip-next', handlePipNext);
    };
  }, [playPrev, togglePlay, playNext]);

  // Listen for PiP mode enter/exit and suppress YouTube API errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.filename?.includes('www-widgetapi.js') ||
        event.message?.includes('www-widgetapi.js') ||
        event.message?.includes('postMessage') ||
        event.message?.includes("Cannot read properties of null (reading 'src')")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason);
      if (msg.includes('www-widgetapi') || msg.includes('postMessage') || msg.includes("reading 'src'")) {
        event.preventDefault();
      }
    };
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const handlePipEnter = () => {
      setIsPipMode(true);
      document.body.classList.add('pip-active');
    };
    const handlePipExit = () => {
      setIsPipMode(false);
      document.body.classList.remove('pip-active');
    };
    
    const handleOpenQueue = () => {
      setExpanded(true);
      setShowQueue(true);
    };
    
    const handleOpenSleepTimer = () => {
      setExpanded(true);
      setShowSleepTimer(true);
    };

    window.addEventListener('pip-enter', handlePipEnter);
    window.addEventListener('pip-exit', handlePipExit);
    window.addEventListener('open-queue', handleOpenQueue);
    window.addEventListener('open-sleep-timer', handleOpenSleepTimer);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('pip-enter', handlePipEnter);
      window.removeEventListener('pip-exit', handlePipExit);
      window.removeEventListener('open-queue', handleOpenQueue);
      window.removeEventListener('open-sleep-timer', handleOpenSleepTimer);
      document.body.classList.remove('pip-active');
    };
  }, []);

  useEffect(() => {
    // Immediately destroy old player reference to prevent stale calls
    playerRef.current = null;
    
    const timeoutId = setTimeout(() => {
      setActiveVideoId(currentTrack?.videoId || null);
      setIsAlternativeTrying(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentTrack?.videoId]);

  // Smooth scroll lyrics
  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current && duration > 0 && lyrics && lyrics.length > 0 && lyricsType === 'synced') {
      const container = lyricsContainerRef.current;
      
      const LYRICS_OFFSET = 0.25; // Highlight lyrics slightly early for better rhythm feel
      const index = lyrics.findIndex(line => line.time !== undefined && line.time > (progress + LYRICS_OFFSET));
      const activeIndex = index === -1 ? lyrics.length - 1 : Math.max(0, index - 1);
      
      const lineElements = container.querySelectorAll('.lyric-line');
      if (lineElements[activeIndex]) {
        const targetLine = lineElements[activeIndex] as HTMLElement;
        const targetScroll = targetLine.offsetTop - container.clientHeight / 2 + targetLine.clientHeight / 2;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  }, [progress, duration, showLyrics, lyrics, lyricsType]);

  // Reset lyrics when track changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLyrics(null);
    setLyricsType(null);
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (currentTrack) {
      db.isLiked(currentTrack.videoId).then(setIsLiked);
      db.addToHistory(currentTrack);
      
      if (Capacitor.isNativePlatform()) {
        const artist = Array.isArray(currentTrack.artist) ? currentTrack.artist.map(a => a.name).join(', ') : currentTrack.artist?.name || 'Unknown Artist';
        BackgroundMode.updateNotification({
          title: currentTrack.name,
          text: artist,
        }).catch(console.error);
      }
    }
  }, [currentTrack]);

  // Sleep Timer countdown
  useEffect(() => {
    if (!sleepTimer) {
      setSleepRemaining(null);
      return;
    }
    const tick = () => {
      const diff = sleepTimer - Date.now();
      if (diff <= 0) {
        setSleepTimer(null);
        setPlaying(false);
        setSleepRemaining(null);
        if (playerRef.current) playerRef.current.pauseVideo();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setSleepRemaining(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer]);

  useEffect(() => {
    if (currentTrack && showLyrics && !lyrics) {
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
    }
  }, [currentTrack, showLyrics, lyrics]);

  const handleLike = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentTrack) return;
    if (isLiked) {
      await db.removeLikedSong(currentTrack.videoId);
      setIsLiked(false);
    } else {
      await db.addLikedSong(currentTrack);
      setIsLiked(true);
    }
  }, [currentTrack, isLiked]);

  const onReady = useCallback(async (event: any) => {
    playerRef.current = event.target;
    const duration = await event.target.getDuration();
    setDuration(duration || 0);
  }, [setDuration]);

  const onStateChange = useCallback(async (event: any) => {
    if (event.data === YouTube.PlayerState.PLAYING) {
      setPlaying(true);
      const duration = await event.target.getDuration();
      setDuration(duration || 0);
    } else if (event.data === YouTube.PlayerState.PAUSED) {
      if (usePlayerStore.getState().isPlaying) {
        // Browser likely paused it automatically (e.g., app went to background)
        // Force it to play again to maintain background playback
        event.target.playVideo();
      } else {
        setPlaying(false);
      }
    } else if (event.data === YouTube.PlayerState.ENDED) {
      const { repeatMode } = usePlayerStore.getState();
      if (repeatMode === 'one') {
        event.target.seekTo(0);
        event.target.playVideo();
      } else {
        playNext();
      }
    }
  }, [setPlaying, setDuration, playNext]);

  const onError = useCallback(async (event: any) => {
    const error = event.data;
    console.error("YouTube Player Error:", error);
    
    // Error 101 or 150: embed disabled. 100: not found.
    if ((error === 101 || error === 150 || error === 100) && currentTrack && !isAlternativeTrying) {

      setIsAlternativeTrying(true);
      
      try {
        const artistName = Array.isArray(currentTrack.artist) ? currentTrack.artist.map(a => a.name).join(' ') : currentTrack.artist?.name || '';
        const query = `${currentTrack.name} ${artistName} audio`;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=video`);
        if (res.ok) {
          const videos = await res.json();
          // Find first video that is not the same as the current track
          const alternativeVideo = videos.find((v: any) => v.videoId && v.videoId !== currentTrack.videoId);
          if (alternativeVideo) {
            setActiveVideoId(alternativeVideo.videoId);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to find alternative video", err);
      }
    }
    
    // Fallback if alternative also fails or not found
    playNext();
  }, [currentTrack, isAlternativeTrying, playNext]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = await playerRef.current.getCurrentTime();
          setProgress(time || 0);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setProgress]);

  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      const thumbnail = getHighResImage(currentTrack.thumbnails?.[currentTrack.thumbnails.length - 1]?.url, 800);
      const artistName = Array.isArray(currentTrack.artist) ? currentTrack.artist.map(a => a.name).join(', ') : currentTrack.artist?.name || 'Unknown Artist';
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: artistName,
        album: 'Music App',
        artwork: [
          { src: thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        setPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });
    }
  }, [currentTrack, setPlaying, playNext, playPrev]);

  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      } else {
        playerRef.current.pauseVideo();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume, currentTrack]);

  useEffect(() => {
    let keepAliveInterval: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App went to background - immediately force play + fast keepalive
        const forcePlay = () => {
          if (usePlayerStore.getState().isPlaying && playerRef.current) {
            playerRef.current.playVideo();
          }
        };
        forcePlay();
        // Fast keepalive every 200ms to catch YouTube auto-pause quickly
        keepAliveInterval = setInterval(forcePlay, 200);
      } else {
        // App came back to foreground - stop keepalive
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        if (usePlayerStore.getState().isPlaying && playerRef.current) {
          playerRef.current.playVideo();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
          const osc = audioCtxRef.current.createOscillator();
          const gainNode = audioCtxRef.current.createGain();
          gainNode.gain.value = 0.0001; // Almost silent
          osc.connect(gainNode);
          gainNode.connect(audioCtxRef.current.destination);
          osc.start();
          oscillatorRef.current = osc;

          if (!usePlayerStore.getState().isPlaying) {
            audioCtxRef.current.suspend();
          }
        }
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioCtxRef.current) {
      if (isPlaying) {
        audioCtxRef.current.resume().catch(() => {});
      } else {
        audioCtxRef.current.suspend().catch(() => {});
      }
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setProgress(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  if (!currentTrack || pathname.startsWith('/auth')) return null;

  // Jika dataSaver aktif, load resolusi gambar rendah (200px), jika tidak high-res (800px)
  const thumbnail = getHighResImage(currentTrack.thumbnails?.[currentTrack.thumbnails.length - 1]?.url, dataSaver ? 200 : 800);
  const artistName = Array.isArray(currentTrack.artist) ? currentTrack.artist.map(a => a.name).join(', ') : currentTrack.artist?.name || 'Unknown Artist';

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="fixed top-[-1000px] left-[-1000px] w-[1px] h-[1px] opacity-0 pointer-events-none">
        {activeVideoId && (
          <YouTube
            videoId={activeVideoId}
            opts={{
              height: '1',
              width: '1',
              playerVars: {
                autoplay: 1,
                controls: 0,
                playsinline: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : 'https://www.youtube.com',
              },
            }}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={onError}
          />
        )}
      </div>

      {/* Mini Player */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[80px] left-4 right-4 z-50 bg-[#1C1C1E]/95 backdrop-blur-md rounded-full flex items-center p-2 pr-4 cursor-pointer shadow-2xl border border-white/10 lg:hidden"
            onClick={() => setExpanded(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTrack.videoId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center flex-1 min-w-0"
              >
                {/* Circular Album Art with Progress */}
                <div className="relative w-12 h-12 shrink-0 mr-3">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                    <circle 
                      cx="50" cy="50" r="46" fill="none" stroke="#A78BFA" strokeWidth="4" 
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${2 * Math.PI * 46 * (1 - (duration > 0 ? progress / duration : 0))}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-1 rounded-full overflow-hidden">
                    <Image src={thumbnail} alt={currentTrack.name} fill sizes="(max-width: 640px) 100vw, 500px" className="object-cover" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <MarqueeText text={currentTrack.name} className="text-white text-sm font-semibold" />
                  <MarqueeText 
                    text={
                      <>
                        {currentTrack.isExplicit && <span className="bg-white/20 text-[8px] px-1 rounded-sm text-white">E</span>}
                        {artistName}
                      </>
                    } 
                    className="text-white/60 text-xs" 
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isGuest) togglePlay();
                }}
                disabled={isGuest}
                className={cn("w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white transition-colors", isGuest ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10")}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                onClick={handleLike}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#FA243C] text-[#FA243C]' : ''}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-8"
            style={{
              background: dominantColor 
                ? `radial-gradient(circle at 50% -20%, color-mix(in srgb, ${dominantColor} 80%, #0A0A0A) 0%, #0A0A0A 80%)`
                : '#0A0A0A'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8 shrink-0 relative z-10">
              <button onClick={() => setExpanded(false)} className="p-2 -ml-2 text-white">
                <ChevronDown className="w-8 h-8" />
              </button>
              <div className="flex gap-4">
                <button 
                  className="p-2 -mr-2 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack) setActiveMenuTrack(currentTrack);
                  }}
                >
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col justify-center min-h-0 relative z-10 pt-4">
              <AnimatePresence mode="wait">
                {showQueue ? (
                  <motion.div
                    key="queue-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <QueueList />
                  </motion.div>
                ) : showLyrics ? (
                  <motion.div
                    key="lyrics-scroll"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {/* Lyrics scrolling container */}
                    <div 
                      className="flex-1 overflow-y-auto no-scrollbar pb-[10vh] px-2"
                      ref={lyricsContainerRef}
                      style={{ 
                        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)", 
                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)" 
                      }}
                    >
                      {lyrics ? (
                        <div className="flex flex-col gap-6 md:gap-8 items-center text-center max-w-2xl mx-auto w-full pt-[30vh] pb-[30vh]">
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
                                  "lyric-line text-2xl md:text-3xl font-bold transition-opacity duration-300 ease-out break-words px-4 w-full", 
                                  lyricsType === 'synced' 
                                    ? (isActive ? "text-white opacity-100" : "text-white opacity-30 cursor-pointer hover:opacity-60")
                                    : "text-white opacity-90"
                                )}
                                onClick={() => {
                                  if (lyricsType === 'synced' && duration > 0 && line.time !== undefined) {
                                    setProgress(line.time);
                                    if (playerRef.current) playerRef.current.seekTo(line.time, true);
                                  }
                                }}
                              >
                                {line.text}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 h-full">
                          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="text-white/50 text-xl font-medium tracking-wide">Memuat lirik...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cover-image"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: isPlaying ? 1 : 0.95 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl mx-auto max-w-[360px]"
                  >
                    <Image src={thumbnail} alt={currentTrack.name} width={500} height={500} className="w-full h-full object-cover" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

                  {/* Controls Area */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={currentTrack.videoId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="min-w-0 flex-1 pr-4"
                        >
                          <MarqueeText text={currentTrack.name} className="text-2xl font-bold text-white mb-1" />
                          <MarqueeText text={artistName} className="text-lg text-white/60" />
                        </motion.div>
                      </AnimatePresence>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setTrackToAdd(currentTrack)} className="p-2 text-white/80 hover:text-white transition">
                          <ListPlus className="w-7 h-7" />
                        </button>
                        <button onClick={handleLike} className="p-2 text-white transition">
                          <Heart className={cn("w-7 h-7", isLiked && "fill-white")} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={progress || 0}
                        onChange={(e) => {
                          if (!isGuest) handleSeek(e);
                        }}
                        className={cn("w-full h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer", isGuest && "pointer-events-none opacity-50")}
                      />
                      <div className="flex justify-between text-xs text-white/50 mt-2 font-mono">
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex justify-between items-center mb-8 px-2">
                      <button 
                        onClick={toggleShuffle}
                        disabled={isGuest}
                        className={cn("transition", isShuffle ? "text-[#A78BFA]" : "text-white/80 hover:text-white", isGuest && "opacity-30 cursor-not-allowed")}
                      >
                        <Shuffle className="w-6 h-6" />
                      </button>
                      <button onClick={playPrev} disabled={isGuest} className={cn("text-white transition", isGuest ? "opacity-30 cursor-not-allowed" : "hover:text-white")}>
                        <SkipBack className="w-10 h-10 fill-current" />
                      </button>
                      <button
                        onClick={togglePlay}
                        disabled={isGuest}
                        className={cn("w-20 h-20 flex items-center justify-center bg-white text-black rounded-full transition-transform", isGuest ? "opacity-30 cursor-not-allowed" : "hover:scale-105")}
                      >
                        {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                      </button>
                      <button onClick={playNext} disabled={isGuest} className={cn("text-white transition", isGuest ? "opacity-30 cursor-not-allowed" : "hover:text-white")}>
                        <SkipForward className="w-10 h-10 fill-current" />
                      </button>
                      <button 
                        onClick={toggleRepeat}
                        className={cn("transition relative", repeatMode !== 'off' ? "text-[#A78BFA]" : "text-white/80 hover:text-white")}
                      >
                        {repeatMode === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                      </button>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex justify-between items-center px-6 py-4 bg-white/5 rounded-2xl relative">
                      <button 
                        onClick={() => {
                          setShowQueue(!showQueue);
                          if (!showQueue) setShowLyrics(false);
                        }}
                        className={cn("transition flex flex-col items-center gap-1", showQueue ? "text-white" : "text-white/80 hover:text-white")}
                      >
                        <ListMusic className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">Up Next</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowLyrics(!showLyrics);
                          if (!showLyrics) setShowQueue(false);
                        }}
                        className={cn("transition flex flex-col items-center gap-1", showLyrics ? "text-white" : "text-white/80 hover:text-white")}
                      >
                        <Mic2 className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">Lyrics</span>
                      </button>
                      <button
                        onClick={() => setShowSleepTimer(!showSleepTimer)}
                        className={cn("transition flex flex-col items-center gap-1 relative", sleepTimer ? "text-[#A78BFA]" : "text-white/80 hover:text-white")}
                      >
                        <Timer className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">
                          {sleepRemaining || 'Timer'}
                        </span>
                      </button>
                      <button 
                        onClick={() => {
                          const artistId = Array.isArray(currentTrack.artist) 
                            ? currentTrack.artist[0]?.artistId 
                            : currentTrack.artist?.artistId;
                          if (artistId) {
                            setExpanded(false);
                            router.push(`/artist/${artistId}`);
                          }
                        }}
                        className="text-white/80 hover:text-white transition flex flex-col items-center gap-1"
                      >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] uppercase tracking-wider">Artis</span>
                      </button>
                      <div className="hidden md:flex items-center gap-3 text-white/80 w-32 ml-4">
                        <Volume2 className="w-5 h-5 shrink-0" />
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          value={volume} 
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="w-full h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                        />
                      </div>

                      {/* Sleep Timer Popup */}
                      <AnimatePresence>
                        {showSleepTimer && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1C1C1E] border border-white/10 rounded-2xl p-3 shadow-2xl w-56 z-50"
                          >
                            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 text-center">Sleep Timer</p>
                            <div className="space-y-1">
                              {[
                                { label: '15 Menit', mins: 15 },
                                { label: '30 Menit', mins: 30 },
                                { label: '45 Menit', mins: 45 },
                                { label: '1 Jam', mins: 60 },
                                { label: '2 Jam', mins: 120 },
                              ].map(opt => (
                                <button
                                  key={opt.mins}
                                  onClick={() => {
                                    setSleepTimer(opt.mins);
                                    setShowSleepTimer(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-colors"
                                >
                                  {opt.label}
                                </button>
                              ))}
                              {sleepTimer && (
                                <button
                                  onClick={() => {
                                    setSleepTimer(null);
                                    setShowSleepTimer(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                                >
                                  Matikan Timer
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PiP Overlay - Matches exactly the mini player design (Picture 1) */}
      {isPipMode && Capacitor.isNativePlatform() && (
        <div className="fixed inset-0 z-[999999] bg-[#1A1A1A] overflow-hidden flex items-center justify-between w-screen h-screen px-10">
          {currentTrack && (
            <>
              <img 
                src={getHighResImage(currentTrack.thumbnails?.[0]?.url)} 
                alt="Art" 
                className="w-28 h-28 rounded-full object-cover shadow-2xl"
              />
              
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 flex items-center justify-center bg-white/10 rounded-full shadow-lg">
                  {isPlaying ? (
                    <Pause className="w-10 h-10 fill-white text-white" />
                  ) : (
                    <Play className="w-10 h-10 fill-white text-white ml-1.5" />
                  )}
                </div>
                <Heart 
                  className={cn("w-10 h-10", isLiked ? "fill-white text-white" : "text-white opacity-80")} 
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Desktop Player (Spotify style) */}
      <div className="hidden lg:flex fixed bottom-0 left-0 right-0 h-[90px] bg-black border-t border-zinc-800 z-50 items-center justify-between px-4">
        {/* Left: Track Info */}
        <div className="flex items-center w-[30%] min-w-[180px]">
          <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 group">
            <Image src={thumbnail} alt={currentTrack.name} fill className="object-cover" />
            <button 
              onClick={() => setExpanded(true)} // Or link to expand RightSidebar
              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3 h-3 text-white" />
            </button>
          </div>
          <div className="ml-3 flex flex-col justify-center min-w-0">
            <span className="text-white text-sm font-medium hover:underline cursor-pointer truncate">
              {currentTrack.name}
            </span>
            <span className="text-zinc-400 text-xs hover:underline cursor-pointer truncate">
              {artistName}
            </span>
          </div>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="ml-4 text-zinc-400 hover:text-white transition-colors"
          >
            <Heart className={cn("w-4 h-4", isLiked ? "fill-green-500 text-green-500" : "")} />
          </button>
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex flex-col items-center justify-center max-w-[40%] w-full gap-1">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleShuffle}
              className={cn("text-zinc-400 hover:text-white transition", isShuffle && "text-green-500 hover:text-green-400")}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={playPrev} className="text-zinc-400 hover:text-white transition">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-zinc-400 hover:text-white transition">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={toggleRepeat}
              className={cn("text-zinc-400 hover:text-white transition relative", repeatMode !== 'off' && "text-green-500 hover:text-green-400")}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center w-full gap-2 text-[11px] text-zinc-400 font-medium">
            <span>{Math.floor(progress / 60)}:{(Math.floor(progress) % 60).toString().padStart(2, '0')}</span>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={progress} 
              onChange={handleSeek}
              className="w-full h-1 bg-zinc-600 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:block group-hover:bg-green-500"
            />
            <span>{Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Right: Controls & Volume */}
        <div className="flex items-center justify-end w-[30%] min-w-[180px] gap-4">
          <button 
            onClick={() => {
              if (pathname === '/lyrics') {
                router.back();
              } else {
                router.push('/lyrics');
              }
            }}
            className={`transition ${pathname === '/lyrics' ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
            title="Lirik"
          >
            <Mic2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              if (isRightSidebarOpen && rightSidebarMode === 'info') {
                toggleRightSidebar();
              } else {
                if (!isRightSidebarOpen) toggleRightSidebar();
                setRightSidebarMode('info');
              }
            }}
            className={`transition ${isRightSidebarOpen && rightSidebarMode === 'info' ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
            title="Now Playing View"
          >
            <PanelRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              if (isRightSidebarOpen && rightSidebarMode === 'queue') {
                toggleRightSidebar();
              } else {
                if (!isRightSidebarOpen) toggleRightSidebar();
                setRightSidebarMode('queue');
              }
            }}
            className={`transition ${isRightSidebarOpen && rightSidebarMode === 'queue' ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
            title="Antrean"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 w-24 group mr-2">
            <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <input 
              type="range" 
              min={0} 
              max={100} 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-zinc-600 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer group-hover:[&::-webkit-slider-thumb]:block"
            />
          </div>

          <button 
            onClick={() => {
              try {
                if (document.pictureInPictureElement) {
                  document.exitPictureInPicture();
                } else {
                  const video = document.querySelector('video');
                  if (video) video.requestPictureInPicture().catch(() => alert('PiP diblokir oleh browser'));
                }
              } catch (err) {
                alert('PiP tidak didukung di browser ini');
              }
            }}
            className="text-zinc-400 hover:text-white transition"
            title="Mini Player"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          <button 
            onClick={() => {
              try {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => alert('Fullscreen diblokir oleh browser'));
                } else {
                  document.exitFullscreen();
                }
              } catch (err) {
                alert('Fullscreen tidak didukung di browser ini');
              }
            }}
            className="text-zinc-400 hover:text-white transition"
            title="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </>
  );
}
