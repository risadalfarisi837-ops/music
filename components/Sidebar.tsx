'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/lib/store';
import { Plus, History, Settings, Bell, X, UserPlus, Share2, Edit, Check, Crown, Headphones, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NotificationsModal, ActivityModal, ShareModal, MessagesModal } from './SocialModals';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAuthenticated, savedAccounts } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  const [switching, setSwitching] = useState(false);

  // Social Modal States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const handleAddAccount = async () => {
    if (savedAccounts.length < 2) {
      onClose();
      // Navigate to auth page to login with a new account
      // Don't sign out - we want to preserve the current account's session in savedAccounts
      router.push('/auth');
    } else {
      alert('Batas maksimal akun gratis tercapai (Maksimal 2). Silakan berlangganan Premium untuk menambahkan akun ke-3 dan seterusnya!');
    }
  };

  const handleSwitchAccount = async (targetUser: User) => {
    if (targetUser.id === user?.id || switching) return;
    if (!targetUser.sessionInfo) {
      alert('Sesi akun ini telah kedaluwarsa. Silakan login kembali.');
      useAuthStore.getState().removeSavedAccount(targetUser.id);
      return;
    }
    
    setSwitching(true);
    onClose();
    
    try {
      const { error } = await supabase.auth.setSession({
        access_token: targetUser.sessionInfo.access_token,
        refresh_token: targetUser.sessionInfo.refresh_token,
      });
      
      if (error) {
        // Token expired, remove from saved accounts and prompt re-login
        useAuthStore.getState().removeSavedAccount(targetUser.id);
        alert('Sesi akun ini telah kedaluwarsa. Silakan login kembali.');
        setSwitching(false);
        return;
      }
      
      // Full page reload to get a clean state
      window.location.href = '/';
    } catch (e) {
      useAuthStore.getState().removeSavedAccount(targetUser.id);
      alert('Gagal berganti akun. Sesi telah kedaluwarsa, silakan login kembali.');
      setSwitching(false);
    }
  };

  return (
    <>
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      <ActivityModal isOpen={showActivity} onClose={() => setShowActivity(false)} />
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} />
      <MessagesModal isOpen={showMessages} onClose={() => setShowMessages(false)} />

      <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-[#121212] z-[101] overflow-y-auto no-scrollbar flex flex-col"
          >
            {/* Header / Profile Info */}
            <div className="p-5 border-b border-white/10">
              <div 
                className="flex items-center gap-4 cursor-pointer group mb-4"
                onClick={() => {
                  onClose();
                  router.push('/profile');
                }}
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#FA243C] to-[#FF6B6B] flex items-center justify-center shrink-0">
                  {isAuthenticated && user?.avatarUrl ? (
                    <Image src={user.avatarUrl} alt="Profile" fill className="object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {isAuthenticated ? user?.name?.charAt(0).toUpperCase() : 'B'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white text-lg font-bold truncate">
                    {isAuthenticated && user?.name ? user.name : 'Belum Login'}
                  </h2>
                  <p className="text-white/60 text-sm group-hover:text-white transition-colors">
                    Lihat profil
                  </p>
                </div>
              </div>

              {/* Saved Accounts List */}
              {savedAccounts.length > 1 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-bold mb-2">Akun Tersimpan</p>
                  {savedAccounts.map((acc) => (
                    <div 
                      key={acc.id}
                      onClick={() => handleSwitchAccount(acc)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${acc.id === user?.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#333]">
                          <Image src={acc.avatarUrl || '/icon.png'} alt={acc.name} fill className="object-cover" />
                        </div>
                        <span className={`text-sm font-medium ${acc.id === user?.id ? 'text-white' : 'text-white/70'}`}>
                          {acc.name}
                        </span>
                      </div>
                      {acc.id === user?.id && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Menu */}
            <div className="flex-1 py-4">
              <div className="flex flex-col space-y-1">
                <button 
                  onClick={() => { onClose(); router.push('/premium'); }}
                  className="flex items-center gap-4 px-5 py-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors text-left w-full"
                >
                  <Crown className="w-6 h-6" />
                  <span className="text-base font-bold flex-1">Beli Premium</span>
                </button>

                {user?.isPremium && (
                  <button 
                    onClick={() => { 
                      onClose(); 
                      import('@/lib/store').then(({ usePartyStore }) => {
                        const state = usePartyStore.getState();
                        if (state.roomId) {
                          // Jika sudah di dalam sesi, arahkan ke ruangan saat ini
                          router.push(`/party/${state.roomId}`);
                        } else {
                          // Jika belum ada sesi, buat baru
                          const newRoomId = Math.random().toString(36).substring(2, 9);
                          state.setParty(newRoomId, true);
                          router.push(`/party/${newRoomId}`);
                        }
                      });
                    }}
                    className="flex items-center gap-4 px-5 py-3 text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors text-left w-full"
                  >
                    <Headphones className="w-6 h-6" />
                    <span className="text-base font-bold flex-1">Mulai Dengar Bareng</span>
                  </button>
                )}

                <button onClick={handleAddAccount} className="flex items-center gap-4 px-5 py-3 text-white/90 hover:text-white hover:bg-white/5 transition-colors text-left w-full">
                  <Plus className="w-6 h-6 text-white/70" />
                  <span className="text-base font-medium">Tambah akun</span>
                </button>

                <button 
                  onClick={() => { onClose(); router.push('/history'); }}
                  className="flex items-center gap-4 px-5 py-3 text-white/90 hover:text-white hover:bg-white/5 transition-colors text-left w-full"
                >
                  <History className="w-6 h-6 text-white/70" />
                  <span className="text-base font-medium">Baru Diputar</span>
                </button>

                <button onClick={() => setShowNotifications(true)} className="flex items-center gap-4 px-5 py-3 text-white/90 hover:text-white hover:bg-white/5 transition-colors text-left w-full">
                  <Bell className="w-6 h-6 text-white/70" />
                  <span className="text-base font-medium flex-1">Info Terkini</span>
                  <span className="text-[#3B82F6] text-xs font-semibold">Baru</span>
                </button>

                <button 
                  onClick={() => { onClose(); router.push('/leaderboard'); }}
                  className="flex items-center gap-4 px-5 py-3 text-white/90 hover:text-white hover:bg-white/5 transition-colors text-left w-full"
                >
                  <Trophy className="w-6 h-6 text-white/70" />
                  <span className="text-base font-medium">Top Pendengar</span>
                </button>

                <button 
                  onClick={() => { onClose(); router.push('/settings'); }}
                  className="flex items-center gap-4 px-5 py-3 text-white/90 hover:text-white hover:bg-white/5 transition-colors text-left w-full"
                >
                  <Settings className="w-6 h-6 text-white/70" />
                  <span className="text-base font-medium">Pengaturan dan privasi</span>
                </button>
              </div>

              {/* Extras */}
              <div className="mt-6 px-5 flex items-start gap-4">
                <div onClick={() => setShowActivity(true)} className="flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                    <span className="text-white text-lg font-bold">
                      {isAuthenticated ? user?.name?.charAt(0).toUpperCase() : 'B'}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/70 text-center font-medium">Aktivitas<br/>Aktifkan</span>
                </div>
                <div onClick={() => setShowShare(true)} className="flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-white/70 text-center font-medium">Undang<br/>teman-teman</span>
                </div>
              </div>

              {/* Message Section */}
              <div className="mt-8 px-5">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => { onClose(); router.push('/messages'); }}>
                  <h3 className="text-white text-lg font-bold flex items-center gap-1 hover:underline">
                    Pesan <span className="text-white/50">&gt;</span>
                  </h3>
                  <Edit className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-white/60 text-sm mb-4 leading-relaxed">
                  Bagikan konten favoritmu ke teman, langsung di Aplikasi Musik.
                </p>
                <button onClick={() => { onClose(); router.push('/messages'); }} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-full py-2 px-4 w-fit">
                  <Edit className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">Pesan baru</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
