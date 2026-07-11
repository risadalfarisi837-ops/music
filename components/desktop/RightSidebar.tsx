'use client';

import Image from 'next/image';
import { usePlayerStore } from '@/lib/store';
import { getHighResImage } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { BadgeCheck, PanelRightClose, MoreHorizontal, ChevronLeft, Play } from 'lucide-react';
import { QueueList } from '../QueueList';
import { useRouter } from 'next/navigation';
import { LeaderboardContent } from '../LeaderboardContent';

export function RightSidebar() {
  const router = useRouter();
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const toggleRightSidebar = usePlayerStore(state => state.toggleRightSidebar);
  const rightSidebarMode = usePlayerStore(state => state.rightSidebarMode);
  const setRightSidebarMode = usePlayerStore(state => state.setRightSidebarMode);
  const playTrack = usePlayerStore(state => state.playTrack);
  const setActiveMenuTrack = usePlayerStore(state => state.setActiveMenuTrack);

  const [artistDetails, setArtistDetails] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isCreditsExpanded, setIsCreditsExpanded] = useState(false);

  const artistName = currentTrack ? (Array.isArray(currentTrack.artist) ? currentTrack.artist.map(a => a.name).join(', ') : currentTrack.artist?.name || 'Unknown Artist') : '';
  const artistId = currentTrack ? (Array.isArray(currentTrack.artist) ? currentTrack.artist[0]?.artistId : currentTrack.artist?.artistId) : undefined;

  useEffect(() => {
    const fetchArtist = async () => {
      if (!artistId) return;
      try {
        const res = await fetch(`/api/artist?id=${artistId}`);
        if (res.ok) {
          const data = await res.json();
          setArtistDetails(data);
          const subscribed = await db.isSubscribed(artistId);
          setIsSubscribed(subscribed);
        }
      } catch (err) {
        console.error('Failed to fetch artist details for sidebar:', err);
      }
    };
    
    setArtistDetails(null);
    fetchArtist();
  }, [artistId]);

  const handleSubscribe = async () => {
    if (!artistDetails || !artistId) return;
    
    if (isSubscribed) {
      await db.removeSubscribedArtist(artistId);
      setIsSubscribed(false);
    } else {
      await db.addSubscribedArtist({
        artistId: artistId,
        name: artistDetails.name,
        thumbnails: artistDetails.thumbnails || [],
        subscribedAt: Date.now()
      });
      setIsSubscribed(true);
    }
  };

  if (!currentTrack && rightSidebarMode !== 'leaderboard') {
    return (
      <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center p-4">
        <p className="text-zinc-500 text-center">Putar lagu untuk melihat detailnya di sini</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-white/5">
        {rightSidebarMode === 'queue' ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRightSidebarMode('info')}
              className="text-zinc-400 hover:text-white transition p-1 hover:bg-zinc-800 rounded-full"
              title="Kembali ke Info Lagu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-white">Antrean</h2>
          </div>
        ) : rightSidebarMode === 'leaderboard' ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRightSidebarMode('info')}
              className="text-zinc-400 hover:text-white transition p-1 hover:bg-zinc-800 rounded-full"
              title="Kembali ke Info Lagu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-white">Top Pendengar</h2>
          </div>
        ) : (
          <h2 
            className="font-bold text-base truncate pr-4 text-white hover:underline cursor-pointer"
            onClick={() => setRightSidebarMode('queue')}
            title="Lihat Antrean"
          >
            {currentTrack?.name}
          </h2>
        )}
        <div className="flex items-center gap-3 text-zinc-400">
          <button 
            className="hover:text-white transition"
            onClick={() => currentTrack && setActiveMenuTrack(currentTrack)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleRightSidebar}
            className="hover:text-white transition bg-zinc-800 p-1.5 rounded-full hover:bg-zinc-700 hover:scale-105"
            title="Tutup sidebar"
          >
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {rightSidebarMode === 'queue' ? (
          <div className="p-4">
            <QueueList />
          </div>
        ) : rightSidebarMode === 'leaderboard' ? (
          <div className="pt-2">
            <LeaderboardContent compact={true} />
          </div>
        ) : (
          <div className="p-4 pt-0 flex flex-col gap-4">
            {/* Main Image */}
            {currentTrack && (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 group">
                <Image 
                  src={getHighResImage(currentTrack.thumbnails?.[currentTrack.thumbnails.length - 1]?.url)} 
                  alt={currentTrack.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}

            {/* Title and Artist */}
            {currentTrack && (
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-white leading-tight mb-1 hover:underline cursor-pointer line-clamp-2">
                    {currentTrack.name}
                  </h1>
                  <p className="text-zinc-400 text-base hover:underline cursor-pointer truncate">
                    {artistName}
                  </p>
                </div>
              </div>
            )}

            {/* About the artist card */}
            {artistDetails && (
              <div className="bg-zinc-800/50 rounded-xl overflow-hidden mb-4">
                {/* Artist Cover Image */}
                <div className="relative w-full h-48 cursor-pointer group">
                  <Image 
                    src={getHighResImage(artistDetails.thumbnails?.[artistDetails.thumbnails.length - 1]?.url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(artistName)}&background=random`}
                    alt={artistName}
                    fill
                    className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                </div>

                {/* Artist Info Content */}
                <div className="p-4 -mt-16 relative z-10">
                  <div className="flex items-center gap-1 text-white font-bold text-lg mb-1">
                    {artistDetails.name}
                    <BadgeCheck className="w-5 h-5 text-blue-400 fill-white" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-zinc-400 text-sm">
                      {artistDetails.subscribers || "Mendengarkan"}
                    </p>
                    <button 
                      onClick={handleSubscribe}
                      className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${
                        isSubscribed 
                          ? 'bg-transparent text-white border-white/50 hover:border-white' 
                          : 'bg-white text-black border-white hover:bg-zinc-200 hover:scale-105'
                      }`}
                    >
                      {isSubscribed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  
                  <div className="relative mt-4 group/desc cursor-pointer" onClick={() => setIsDescExpanded(!isDescExpanded)}>
                    <p className={`text-zinc-300 text-sm ${isDescExpanded ? '' : 'line-clamp-3'}`}>
                      {artistDetails.description || `Dengarkan karya-karya terbaik dari ${artistDetails.name} di platform ini. Jelajahi berbagai lagu populer, album terbaru, single, dan video musik yang telah dirilis.`}
                    </p>
                    {!isDescExpanded && (
                      <span className="text-white font-bold text-xs mt-1 hover:underline">Lihat semuanya</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Credits Section */}
            {currentTrack && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Credits</h3>
                  {Array.isArray(currentTrack.artist) && currentTrack.artist.length > 1 && (
                    <span 
                      onClick={() => setIsCreditsExpanded(!isCreditsExpanded)}
                      className="text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer transition-colors"
                    >
                      {isCreditsExpanded ? 'Show less' : 'Show all'}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  {(Array.isArray(currentTrack.artist) ? currentTrack.artist : [currentTrack.artist])
                    .filter(Boolean)
                    .slice(0, isCreditsExpanded ? undefined : 1)
                    .map((art: any, index) => (
                    <div key={art.artistId || art.name} className="flex items-center justify-between group/credit">
                      <div>
                        <p className="font-semibold text-white group-hover/credit:underline cursor-pointer">{art.name}</p>
                        <p className="text-sm text-zinc-400">{index === 0 ? 'Main Artist' : 'Featured Artist'}</p>
                      </div>
                      {index === 0 && artistDetails && (
                        <button 
                          onClick={handleSubscribe}
                          className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${
                            isSubscribed 
                              ? 'bg-transparent text-white border-white/50 hover:border-white' 
                              : 'bg-white text-black border-white hover:bg-zinc-200 hover:scale-105'
                          }`}
                        >
                          {isSubscribed ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Songs */}
            {artistDetails?.topSongs && artistDetails.topSongs.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-4">Top songs</h3>
                <div className="flex flex-col gap-3">
                  {artistDetails.topSongs.slice(0, 5).map((song: any) => (
                    <div 
                      key={song.videoId} 
                      className="flex items-center gap-3 group/song cursor-pointer rounded-lg hover:bg-white/5 p-1 -mx-1 transition-colors"
                      onClick={() => playTrack(song, artistDetails.topSongs, 'similar')}
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                        <Image src={getHighResImage(song.thumbnails?.[0]?.url, 100)} alt={song.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 hidden group-hover/song:flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{song.name}</p>
                        <p className="text-zinc-400 text-xs truncate">{song.artist?.name || artistName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Albums */}
            {artistDetails?.topAlbums && artistDetails.topAlbums.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-4">Albums</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x">
                  {artistDetails.topAlbums.map((album: any) => (
                    <div 
                      key={album.albumId || album.playlistId || album.browseId} 
                      className="w-28 shrink-0 flex flex-col gap-2 cursor-pointer group/album snap-start"
                      onClick={() => router.push(`/album/${album.albumId || album.playlistId || album.browseId}`)}
                    >
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden shadow-md">
                        <Image src={getHighResImage(album.thumbnails?.[0]?.url, 200)} alt={album.name || album.title} fill className="object-cover transition-transform duration-300 group-hover/album:scale-105" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">{album.name || album.title}</p>
                        <p className="text-zinc-400 text-xs">{album.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Singles & EPs */}
            {artistDetails?.topSingles && artistDetails.topSingles.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-4">Singles & EPs</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x">
                  {artistDetails.topSingles.map((single: any) => (
                    <div 
                      key={single.albumId || single.playlistId || single.browseId} 
                      className="w-28 shrink-0 flex flex-col gap-2 cursor-pointer group/single snap-start"
                      onClick={() => router.push(`/album/${single.albumId || single.playlistId || single.browseId}`)}
                    >
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden shadow-md">
                        <Image src={getHighResImage(single.thumbnails?.[0]?.url, 200)} alt={single.name || single.title} fill className="object-cover transition-transform duration-300 group-hover/single:scale-105" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-1">{single.name || single.title}</p>
                        <p className="text-zinc-400 text-xs">{single.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {artistDetails?.topVideos && artistDetails.topVideos.length > 0 && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <h3 className="font-bold text-white mb-4">Videos</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x">
                  {artistDetails.topVideos.map((video: any) => (
                    <div 
                      key={video.videoId} 
                      className="w-40 shrink-0 flex flex-col gap-2 cursor-pointer group/video snap-start"
                      onClick={() => playTrack(video, artistDetails.topVideos, 'similar')}
                    >
                      <div className="relative w-40 aspect-video rounded-lg overflow-hidden shadow-md">
                        <Image src={getHighResImage(video.thumbnails?.[0]?.url, 300)} alt={video.name || video.title} fill className="object-cover transition-transform duration-300 group-hover/video:scale-105" />
                        <div className="absolute inset-0 bg-black/20 hidden group-hover/video:flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{video.name || video.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
