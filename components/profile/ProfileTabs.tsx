'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore, usePlayerStore, Track } from '@/lib/store';
import { LogOut, Play, Music, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { TrackItem } from '@/components/TrackItem';
import Link from 'next/link';
import Image from 'next/image';
import { getHighResImage } from '@/lib/utils';

const tabs = ['Playlist', 'Riwayat', 'Disukai', 'Pengaturan'];

export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const { user, isAuthenticated, logout, removeSavedAccount } = useAuthStore();
  const supabase = createClient();
  
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [pData, lData, hData] = await Promise.all([
        db.getPlaylists(),
        db.getLikedSongs(),
        db.getHistory(),
      ]);
      setPlaylists(pData);
      setLikedSongs(lData);
      setDbHistory(hData);
      setLoading(false);
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const handleLogout = async () => {
    if (user?.id) removeSavedAccount(user.id);
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full pb-20">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 mb-6 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="profileTabIndicator"
                className="absolute bottom-[-8px] left-0 right-0 h-[2px] bg-[#FA243C] rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Playlist' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#FA243C]/20 border-t-[#FA243C] rounded-full animate-spin" /></div>
                ) : playlists.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Playlist</h3>
                    <p className="text-white/60 text-sm mb-4">Simpan lagu favoritmu dalam satu tempat.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {playlists.map((playlist) => (
                      <Link href={`/playlist/${playlist.id}`} key={playlist.id} className="group cursor-pointer block">
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
                          {playlist.img ? (
                            <Image src={playlist.img} alt={playlist.name} fill className="object-cover transition duration-300 group-hover:scale-110" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Music className="w-10 h-10 text-white/20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#FA243C] flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                              <Play className="w-6 h-6 text-white fill-current ml-1" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-white font-medium truncate group-hover:text-[#FA243C] transition-colors text-sm">{playlist.name}</h3>
                        <p className="text-white/50 text-xs truncate mt-0.5">{playlist.tracks?.length || 0} lagu</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Riwayat' && (
              <div className="space-y-1">
                {dbHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-white/50">Belum ada riwayat mendengarkan.</p>
                  </div>
                ) : (
                  dbHistory.map((item, index) => (
                    <TrackItem 
                      key={`history-${item.track.videoId}-${index}`} 
                      track={item.track} 
                      queue={dbHistory.map(h => h.track)} 
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'Disukai' && (
              <div className="space-y-1">
                {loading ? (
                  <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#FA243C]/20 border-t-[#FA243C] rounded-full animate-spin" /></div>
                ) : likedSongs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-white/50">Belum ada lagu yang disukai.</p>
                  </div>
                ) : (
                  likedSongs.map((track, index) => (
                    <TrackItem 
                      key={`liked-${track.videoId}-${index}`} 
                      track={track} 
                      queue={likedSongs} 
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'Pengaturan' && (
              <div className="space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                  <h3 className="font-semibold text-white mb-4">Status Langganan</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-[#111111] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.isPremium ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                          <Crown className={`w-5 h-5 ${user?.isPremium ? 'text-yellow-500' : 'text-white/40'}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{user?.isPremium ? 'Premium Aktif' : 'Paket Basic'}</p>
                          <p className="text-white/50 text-xs">
                            {user?.isPremium && user?.premiumExpiresAt
                              ? `Berakhir pada ${new Date(user.premiumExpiresAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`
                              : 'Fitur terbatas. Upgrade sekarang.'}
                          </p>
                        </div>
                      </div>
                      {!user?.isPremium && (
                        <Link href="/premium" className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform">
                          Upgrade
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="font-semibold text-white mb-4">Akun</h3>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between text-red-500 hover:bg-white/5 p-3 rounded-xl transition-colors"
                  >
                    <span className="font-medium">Keluar (Logout)</span>
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
