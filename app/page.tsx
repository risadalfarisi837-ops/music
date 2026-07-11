'use client';

import { useEffect, useState, useMemo } from 'react';
import { Track, usePlayerStore, useAuthStore } from '@/lib/store';
import { History, Play, MoreVertical, ChevronRight, Sparkles, TrendingUp, Radio, Disc3, Bell, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { MixedScroll } from '@/components/MixedScroll';
import { CommunityPlaylistCard } from '@/components/CommunityPlaylistCard';
import { MarqueeText } from '@/components/MarqueeText';
import { getHighResImage } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

import { Sidebar } from '@/components/Sidebar';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { db } from '@/lib/db';
import { NotificationsModal } from '@/components/SocialModals';

const pills = ['Chill', 'Focus', 'Commute', 'Gaming', 'Energize', 'Party', 'Feel good', 'Romance', 'Workout', 'Sleep', 'Sad', 'Happy', 'Nostalgia', 'Acoustic', 'Pop', 'Rock'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 17) return 'Selamat Siang';
  if (h < 21) return 'Selamat Sore';
  return 'Selamat Malam';
}

const greetEmoji: Record<string, string> = {
  'Selamat Pagi': '☀️',
  'Selamat Siang': '🌤',
  'Selamat Sore': '🌅',
  'Selamat Malam': '🌙',
};

export default function Home() {
  const [heroTracks, setHeroTracks] = useState<Track[]>([]);
  const [speedDialTracks, setSpeedDialTracks] = useState<Track[]>([]);
  const [quickPicksTracks, setQuickPicksTracks] = useState<Track[]>([]);
  const [communityPlaylists, setCommunityPlaylists] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ key: string; title: string; type: 'song' | 'mixed'; items: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<{ title: string; tracks: Track[] }[]>([]);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const setTrackToAdd = usePlayerStore((state) => state.setTrackToAdd);
  const setActiveMenuTrack = usePlayerStore((state) => state.setActiveMenuTrack);
  const { user, isAuthenticated } = useAuthStore();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dbHistory, setDbHistory] = useState<any[]>([]);

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Fetch DB history
  useEffect(() => {
    if (isAuthenticated) {
      db.getHistory().then(setDbHistory);
    }
  }, [isAuthenticated]);

  // Recently played (from DB history, deduplicated, max 6)
  const recentlyPlayed = useMemo(() => {
    return dbHistory
      .slice(0, 6)
      .map(h => h.track);
  }, [dbHistory]);

  // Auto-cycle hero
  useEffect(() => {
    if (heroTracks.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroTracks.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroTracks.length]);

  useEffect(() => {
    if (!activeFilter) return;
    const fetchFilterData = async () => {
      setLoadingFilter(true);
      try {
        const queries = [
          { title: `Feeling ${activeFilter.toLowerCase()}`, q: `${activeFilter} mood songs` },
          { title: `${activeFilter} hits`, q: `top ${activeFilter} songs` },
          { title: `More like ${activeFilter}`, q: `best ${activeFilter} tracks` },
        ];
        
        const results = [];
        for (const { title, q } of queries) {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=song`);
          const data = await res.json();
          results.push({ title, tracks: data.slice(0, 10) });
        }
        
        setFilterData(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingFilter(false);
      }
    };
    fetchFilterData();
  }, [activeFilter]);

  useEffect(() => {
    const CACHE_KEY = 'homeDataCache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const applyCache = (cached: any) => {
      if (cached.heroTracks) setHeroTracks(cached.heroTracks);
      if (cached.speedDialTracks) setSpeedDialTracks(cached.speedDialTracks);
      if (cached.quickPicksTracks) setQuickPicksTracks(cached.quickPicksTracks);
      if (cached.communityPlaylists) setCommunityPlaylists(cached.communityPlaylists);
      if (cached.artists) setArtists(cached.artists);
      if (cached.categories) setCategories(cached.categories);
      setLoading(false);
    };

    // Try to load from cache first for instant display
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          applyCache(cached);
          return; // Cache is fresh, no need to re-fetch
        }
        // Cache is stale but show it immediately while refreshing
        applyCache(cached);
      }
    } catch (e) { /* ignore parse errors */ }

    const fetchHomeData = async () => {
      try {
        const queries: { key: string; title?: string; q: string; type?: string }[] = [
          { key: 'hero', q: 'dave how i met my ex', type: 'song' },
          { key: 'speedDial', q: 'top hits 2024', type: 'song' },
          { key: 'quickPicks', q: 'viral hits indonesia', type: 'song' },
          { key: 'community', q: 'chill playlists', type: 'playlist' },
          { key: 'artists', q: 'artis indonesia populer', type: 'artist' },
        ];

        // Add default categories
        const defaultCategories = [
          { key: 'cat0', title: 'Trending Now', q: 'lagu indonesia hits terbaru', type: 'song' },
          { key: 'cat1', title: 'New Releases', q: 'lagu pop indonesia rilis terbaru', type: 'song' },
          { key: 'similar0', title: 'Serupa dengan Ryuuuchiee', q: 'Ryuuuchiee', type: 'all' },
          { key: 'similar1', title: 'Serupa dengan Tems', q: 'Tems', type: 'all' },
          { key: 'similar2', title: 'Serupa dengan Hindia', q: 'Hindia', type: 'all' },
          { key: 'similar3', title: 'Serupa dengan Nadin Amizah', q: 'Nadin Amizah', type: 'all' },
          { key: 'similar4', title: 'Serupa dengan Pamungkas', q: 'Pamungkas', type: 'all' },
          { key: 'cat2', title: 'Top 50 Indonesia', q: 'top 50 indonesia playlist update', type: 'song' },
          { key: 'cat3', title: 'Viral on TikTok', q: 'lagu fyp tiktok viral', type: 'song' },
          { key: 'cat4', title: 'For Eid Getaways', q: 'lagu lebaran idul fitri', type: 'song' },
          { key: 'cat5', title: 'Surrender to the Beat', q: 'lagu edm jedag jedug', type: 'song' },
          { key: 'cat6', title: 'Fun throwbacks', q: 'lagu nostalgia 2000an indonesia', type: 'song' },
          { key: 'cat7', title: 'Feel-good rock', q: 'lagu rock indonesia terbaik', type: 'song' },
          { key: 'cat8', title: 'Acoustic Chill', q: 'lagu akustik cafe santai', type: 'song' },
        ];
        
        queries.push(...defaultCategories);

        // Process in chunks of 3 to avoid 403 errors from too many parallel requests
        const results = [];
        for (let i = 0; i < queries.length; i += 3) {
          const chunk = queries.slice(i, i + 3);
          const chunkResults = await Promise.all(
            chunk.map(async ({ key, title, q, type }) => {
              try {
                const url = type 
                  ? `/api/search?q=${encodeURIComponent(q)}&type=${type}`
                  : `/api/search?q=${encodeURIComponent(q)}`;
                const res = await fetch(url);
                if (!res.ok) return { key, title, data: [] };
                const data = await res.json();
                return { key, title, data };
              } catch (e) {
                return { key, title, data: [] };
              }
            })
          );
          results.push(...chunkResults);
        }

        const cats: { key: string; title: string; type: 'song' | 'mixed'; items: any[] }[] = [];
        const cacheData: any = {};

        results.forEach(({ key, title, data }) => {
          if (!data || data.length === 0) return;
          if (key === 'hero') { const d = data.slice(0, 3); setHeroTracks(d); cacheData.heroTracks = d; }
          else if (key === 'speedDial') { const d = data.slice(0, 45); setSpeedDialTracks(d); cacheData.speedDialTracks = d; }
          else if (key === 'quickPicks') { const d = data.slice(0, 20); setQuickPicksTracks(d); cacheData.quickPicksTracks = d; }
          else if (key === 'community') { const d = data.slice(0, 10); setCommunityPlaylists(d); cacheData.communityPlaylists = d; }
          else if (key === 'artists') { const d = data.slice(0, 10); setArtists(d); cacheData.artists = d; }
          else if (key.startsWith('cat') && title) cats.push({ key, title, type: 'song', items: data.slice(0, 10) });
          else if (key.startsWith('similar') && title) cats.push({ key, title, type: 'mixed', items: data.slice(0, 10) });
        });

        // Sort categories to maintain the order defined in defaultCategories
        const orderMap = new Map(defaultCategories.map((c, i) => [c.key, i]));
        cats.sort((a, b) => (orderMap.get(a.key) ?? 999) - (orderMap.get(b.key) ?? 999));

        setCategories(cats);
        cacheData.categories = cats;

        // Save to sessionStorage cache
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...cacheData, timestamp: Date.now() }));
        } catch (e) { /* ignore quota errors */ }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [dbHistory[0]?.track?.videoId]);

  return (
    <main className="min-h-screen pb-24">
      {/* ═══════ HEADER (Mobile Only) ═══════ */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(true)}
              className="w-9 h-9 rounded-full overflow-hidden relative ring-2 ring-white/10 hover:ring-white/30 transition-all bg-gradient-to-br from-[#FA243C] to-[#FF6B6B] flex items-center justify-center shrink-0"
            >
              {isAuthenticated && user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Profile" fill sizes="36px" className="object-cover" />
              ) : isAuthenticated ? (
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              ) : (
                <Image src="/icon.png" alt="Profile" fill sizes="36px" className="object-cover" />
              )}
            </button>
            <div>
              <p className="text-white/50 text-xs font-medium tracking-wide">{greeting}</p>
              <h1 className="text-lg font-bold text-white leading-tight">
                {isAuthenticated && user?.name ? user.name : 'Beranda'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/messages" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <MessageCircle className="w-[22px] h-[22px]" />
            </Link>
            <button onClick={() => setShowNotifications(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white relative">
              <Bell className="w-[22px] h-[22px]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FA243C] rounded-full" />
            </button>
            <Link href="/history" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <History className="w-[22px] h-[22px]" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 px-5 pb-3 snap-x snap-mandatory scroll-smooth">
          {pills.map((pill) => (
            <button 
              key={pill} 
              onClick={() => setActiveFilter(activeFilter === pill ? null : pill)}
              className={`whitespace-nowrap px-4 py-[7px] rounded-full text-[13px] font-semibold transition-all duration-200 snap-center ${
                activeFilter === pill 
                  ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                  : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/80 border border-white/[0.06]'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {loading || (activeFilter && loadingFilter) ? (
        <HomeSkeleton />
      ) : activeFilter ? (
        <div className="space-y-10 mt-2">
          {filterData.map((cat, i) => (
            <HorizontalScroll key={i} title={cat.title} tracks={cat.tracks} />
          ))}
          
          <div className="px-4 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Suasana Hati dan Genre</h2>
            <div className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
              {pills.map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveFilter(p)}
                  className="bg-[#1C1C1E] hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg text-left transition-colors border border-white/5 min-w-[160px] snap-center"
                >
                  <span className="text-sm">{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 mt-1">

          {/* ═══════ RECENTLY PLAYED GRID ═══════ */}
          {recentlyPlayed.length > 0 && (
            <div className="px-5">
              <div className="grid grid-cols-2 gap-2.5">
                {recentlyPlayed.map((track, i) => (
                  <motion.div
                    key={`recent-${track.videoId}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => playTrack(track, recentlyPlayed, 'similar')}
                    className="flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.12] rounded-lg overflow-hidden cursor-pointer group active:scale-[0.97] transition-all h-14"
                  >
                    <div className="relative w-14 h-14 shrink-0">
                      <Image 
                        src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 100)} 
                        alt={track.name} 
                        fill 
                        sizes="56px" 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-white text-[13px] font-semibold truncate">{track.name}</p>
                    </div>
                    <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ HERO SPOTLIGHT ═══════ */}
          {heroTracks.length > 0 && (
            <div className="px-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#FA243C]" />
                <h2 className="text-lg font-bold text-white">Spotlight</h2>
              </div>
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={heroTracks[heroIndex]?.videoId}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => playTrack(heroTracks[heroIndex], heroTracks, 'similar')}
                  >
                    <Image 
                      src={getHighResImage(heroTracks[heroIndex]?.thumbnails?.[heroTracks[heroIndex]?.thumbnails.length - 1]?.url, 800)} 
                      alt={heroTracks[heroIndex]?.name} 
                      fill 
                      sizes="(max-width: 640px) 90vw, 500px"
                      className="object-cover" 
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-2xl font-extrabold leading-tight drop-shadow-lg line-clamp-2">{heroTracks[heroIndex]?.name}</p>
                        <p className="text-white/70 text-sm font-medium mt-1 drop-shadow-md">
                          {Array.isArray(heroTracks[heroIndex]?.artist) 
                            ? heroTracks[heroIndex]?.artist.map((a: any) => a.name).join(', ') 
                            : heroTracks[heroIndex]?.artist?.name
                          }
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#FA243C] rounded-full flex items-center justify-center shadow-lg shadow-[#FA243C]/40 shrink-0 ml-4 hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Dots indicator */}
                {heroTracks.length > 1 && (
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    {heroTracks.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ SPEED DIAL ═══════ */}
          {speedDialTracks.length > 0 && (
            <div className="px-5">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Speed Dial</h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-3 snap-x snap-mandatory scroll-smooth pb-2">
                {Array.from({ length: Math.ceil(speedDialTracks.length / 9) }).map((_, i) => {
                  const chunk = speedDialTracks.slice(i * 9, i * 9 + 9);
                  return (
                    <motion.div 
                      key={`speeddial-chunk-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-[85vw] sm:w-[400px] shrink-0 snap-center grid grid-cols-3 gap-2"
                    >
                      {chunk.map((track, j) => (
                        <div 
                          key={`speeddial-${track.videoId}-${j}`}
                          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                          onClick={() => playTrack(track, speedDialTracks, 'similar')}
                        >
                          <Image src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 200)} alt={track.name} fill sizes="64px" className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <p className="text-white text-[11px] font-semibold drop-shadow-md line-clamp-2 leading-tight">{track.name}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ QUICK PICKS ═══════ */}
          {quickPicksTracks.length > 0 && (
            <div className="px-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Pilihan Cepat</h2>
                </div>
                <button 
                  className="text-xs font-semibold text-[#FA243C] hover:text-[#FF6B6B] transition-colors flex items-center gap-1"
                  onClick={() => playTrack(quickPicksTracks[0], quickPicksTracks, 'similar')}
                >
                  Putar semua <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x snap-mandatory scroll-smooth pb-2">
                {Array.from({ length: Math.ceil(quickPicksTracks.length / 4) }).map((_, i) => {
                  const chunk = quickPicksTracks.slice(i * 4, i * 4 + 4);
                  return (
                    <motion.div 
                      key={`quickpicks-chunk-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-[85vw] sm:w-[400px] shrink-0 snap-center flex flex-col gap-1"
                    >
                      {chunk.map((track, j) => {
                        const artistName = Array.isArray(track.artist) ? track.artist.map(a => a.name).join(', ') : track.artist?.name;
                        return (
                          <div 
                            key={`quickpicks-${track.videoId}-${j}`}
                            className="flex items-center gap-3 cursor-pointer group hover:bg-white/[0.06] p-2 -mx-2 rounded-xl active:scale-[0.98] transition-all duration-200"
                            onClick={() => playTrack(track, quickPicksTracks, 'similar')}
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-md">
                              <Image src={getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 100)} alt={track.name} fill sizes="48px" className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 text-white fill-current" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{track.name}</p>
                              <p className="text-white/50 text-xs truncate">{artistName}</p>
                            </div>
                            <button 
                              className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTrack(track);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ COMMUNITY PLAYLISTS ═══════ */}
          {communityPlaylists.length > 0 && (
            <div className="px-5">
              <div className="flex items-center gap-2 mb-3">
                <Disc3 className="w-5 h-5 text-[#81B29A]" />
                <h2 className="text-lg font-bold text-[#81B29A]">From the Community</h2>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x snap-mandatory scroll-smooth pb-4">
                {communityPlaylists.map((playlist, i) => {
                  const id = playlist.playlistId;
                  if (!id) return null;
                  return <CommunityPlaylistCard key={`community-playlist-${id}-${i}`} playlistId={id} />;
                })}
              </div>
            </div>
          )}

          {/* ═══════ ARTISTS ═══════ */}
          {artists.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="text-lg font-bold text-white">Tetap Mendengarkan</h2>
                <Link href="/search" className="text-xs font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                  Semua <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-5 px-5 pb-4 snap-x snap-mandatory scroll-smooth">
                {artists.map((artist, i) => {
                  const artistName = artist.name || 'Artist';
                  return (
                    <Link href={`/artist/${artist.artistId}`} key={`artist-${artist.artistId}-${i}`}>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 snap-center hover:scale-105 active:scale-95 transition-transform duration-200"
                      >
                        <div className="relative w-[88px] h-[88px] rounded-full overflow-hidden shadow-lg ring-2 ring-white/[0.06] group-hover:ring-white/20 transition-all">
                          <Image src={getHighResImage(artist.thumbnails?.[artist.thumbnails.length - 1]?.url, 400)} alt={artistName} fill sizes="88px" className="object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-7 h-7 text-white fill-current" />
                          </div>
                        </div>
                        <div className="text-center w-20">
                          <p className="text-[13px] font-semibold text-white truncate">{artistName}</p>
                          <p className="text-[11px] text-white/40">Artis</p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ CATEGORY SECTIONS ═══════ */}
          {categories.map((cat, i) => (
            cat.type === 'mixed' ? (
              <MixedScroll key={i} title={cat.title} items={cat.items} />
            ) : (
              <HorizontalScroll key={i} title={cat.title} tracks={cat.items} />
            )
          ))}
        </div>
      )}
      
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </main>
  );
}
