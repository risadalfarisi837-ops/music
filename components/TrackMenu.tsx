'use client';

import { usePlayerStore, useAuthStore } from '@/lib/store';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Share2, Heart, PlusCircle, ListPlus, ListVideo, Disc, 
  User, Users, XCircle, Timer, Radio, FileText, QrCode, Check
} from 'lucide-react';
import Image from 'next/image';
import { getHighResImage } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListenTogetherModal, ExcludeSongModal, SongCreditsModal, QRCodeModal } from './TrackMenuModals';

export function TrackMenu() {
  const activeMenuTrack = usePlayerStore(state => state.activeMenuTrack);
  const setActiveMenuTrack = usePlayerStore(state => state.setActiveMenuTrack);
  const addToQueue = usePlayerStore(state => state.addToQueue);
  const setTrackToAdd = usePlayerStore(state => state.setTrackToAdd);
  const setExpanded = usePlayerStore(state => state.setExpanded);
  const [isLiked, setIsLiked] = useState(false);
  const router = useRouter();

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Modal states
  const [showListenTogether, setShowListenTogether] = useState(false);
  const [showExclude, setShowExclude] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const [persistedTrack, setPersistedTrack] = useState<any>(null);

  useEffect(() => {
    if (activeMenuTrack) {
      db.isLiked(activeMenuTrack.videoId).then(setIsLiked);
      setPersistedTrack(activeMenuTrack);
    }
  }, [activeMenuTrack]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const closeMenu = () => setActiveMenuTrack(null);

  const currentTrack = activeMenuTrack || persistedTrack;

  const artistName = currentTrack 
    ? (Array.isArray(currentTrack.artist) 
      ? currentTrack.artist.map((a: any) => a.name).join(', ') 
      : currentTrack.artist?.name || 'Unknown Artist')
    : 'Unknown Artist';

  const thumbnailUrl = currentTrack ? getHighResImage(currentTrack.thumbnails?.[currentTrack.thumbnails.length - 1]?.url, 200) : '';

  const trackInfo = currentTrack ? {
    name: currentTrack.name,
    artist: artistName,
    videoId: currentTrack.videoId,
    thumbnailUrl,
  } : { name: '', artist: '', videoId: '', thumbnailUrl: '' };

  const showToast = (msg: string) => {
    setToast(msg);
  };

  const handleShare = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(`${window.location.origin}/track/${currentTrack.videoId}`);
    showToast('Link lagu berhasil disalin!');
    closeMenu();
  };

  const handleLike = async () => {
    if (!currentTrack) return;
    if (isLiked) {
      await db.removeLikedSong(currentTrack.videoId);
      setIsLiked(false);
    } else {
      await db.addLikedSong(currentTrack);
      setIsLiked(true);
    }
  };

  const handleAddToQueue = () => {
    if (!currentTrack) return;
    addToQueue(currentTrack);
    showToast('Lagu ditambahkan ke antrean');
    closeMenu();
  };

  const handleOpenQueue = () => {
    window.dispatchEvent(new Event('open-queue'));
    closeMenu();
  };

  const handleOpenAlbum = () => {
    if (!currentTrack) return;
    const track = currentTrack as any;
    const albumId = track.album?.albumId || track.album?.id;
    if (albumId) {
      router.push(`/album/${albumId}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(currentTrack.name + ' album')}`);
    }
    setExpanded(false);
    closeMenu();
  };

  const handleOpenArtist = () => {
    if (!currentTrack) return;
    const artistId = Array.isArray(currentTrack.artist) 
      ? currentTrack.artist[0]?.artistId 
      : currentTrack.artist?.artistId;
      
    if (artistId) {
      router.push(`/artist/${artistId}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(artistName)}`);
    }
    setExpanded(false);
    closeMenu();
  };

  const handleListenTogether = () => {
    const isPremium = useAuthStore.getState().user?.isPremium;
    if (!isPremium) {
      showToast('Fitur ini khusus Premium. Anda dialihkan...');
      router.push('/premium');
      closeMenu();
    } else {
      setShowListenTogether(true);
      closeMenu();
    }
  };

  const handleExclude = () => {
    setShowExclude(true);
    closeMenu();
  };

  const handleSleepTimer = () => {
    window.dispatchEvent(new Event('open-sleep-timer'));
    closeMenu();
  };

  const handleRadio = () => {
    if (currentTrack) {
      usePlayerStore.getState().playTrack(currentTrack, undefined, 'similar');
      showToast(`Memulai Radio Lagu: ${currentTrack.name}`);
    }
    closeMenu();
  };

  const handleCredits = () => {
    setShowCredits(true);
    closeMenu();
  };

  const handleQRCode = () => {
    setShowQRCode(true);
    closeMenu();
  };

  const MenuItem = ({ icon: Icon, label, onClick, rightText }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-4 md:px-6 hover:bg-white/10 transition-colors text-left group"
    >
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" strokeWidth={2} />
        <span className="text-white/90 group-hover:text-white font-medium text-[14px] md:text-[15px]">{label}</span>
      </div>
      {rightText && (
        <span className="text-green-400 font-semibold text-xs bg-green-500/10 px-2 py-1 rounded-full">{rightText}</span>
      )}
    </button>
  );

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed top-12 left-4 right-4 z-[1002] max-w-sm mx-auto"
          >
            <div className="bg-[#2A2A2A] border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-white text-sm font-medium flex-1">{toast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ListenTogetherModal isOpen={showListenTogether} onClose={() => setShowListenTogether(false)} track={trackInfo} />
      <ExcludeSongModal isOpen={showExclude} onClose={() => setShowExclude(false)} track={trackInfo} />
      <SongCreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} track={trackInfo} />
      <QRCodeModal isOpen={showQRCode} onClose={() => setShowQRCode(false)} track={trackInfo} />

      {/* Track Menu Bottom Sheet */}
      <AnimatePresence>
        {activeMenuTrack && (
          <>
            <div 
              className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-0 md:p-6"
              onClick={closeMenu}
            >
              <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[420px] bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-t md:border border-white/10"
              >
                {/* Header */}
                <div className="flex items-center gap-4 p-4 md:p-5 border-b border-white/5 sticky top-0 z-10 bg-inherit">
                  <div className="w-12 h-12 relative rounded-md overflow-hidden shrink-0 shadow-lg">
                    <Image src={thumbnailUrl} alt={activeMenuTrack.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base md:text-lg truncate">{activeMenuTrack.name}</h3>
                    <p className="text-white/50 text-xs md:text-sm truncate">{artistName}</p>
                  </div>
                  <button onClick={closeMenu} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-white/50 hover:text-white" />
                  </button>
                </div>

                {/* Scrollable Options */}
                <div className="flex-1 overflow-y-auto pb-4 md:pb-2 pt-2 custom-scrollbar">
                <MenuItem icon={Share2} label="Bagikan" onClick={handleShare} />
                <MenuItem 
                  icon={Heart} 
                  label={isLiked ? "Hapus dari Lagu yang Disukai" : "Tambahkan ke Lagu yang Disukai"} 
                  onClick={handleLike} 
                />
                <MenuItem icon={PlusCircle} label="Tambahkan ke playlist" onClick={() => {
                  setTrackToAdd(activeMenuTrack);
                  closeMenu();
                }} />
                <MenuItem icon={ListPlus} label="Tambahkan ke Antrean" onClick={handleAddToQueue} />
                <MenuItem icon={ListVideo} label="Buka Antrean" onClick={handleOpenQueue} />
                <MenuItem icon={Disc} label="Buka album" onClick={handleOpenAlbum} />
                <MenuItem icon={User} label="Buka artis" onClick={handleOpenArtist} />
                <MenuItem icon={Users} label="Mulai Dengar Bareng" rightText="Premium" onClick={handleListenTogether} />
                
                {/* Mobile Only Options */}
                <div className="md:hidden">
                  <MenuItem icon={XCircle} label="Kecualikan lagu dari profil seleramu" onClick={handleExclude} />
                  <MenuItem icon={Timer} label="Pengatur waktu tidur" onClick={handleSleepTimer} />
                  <MenuItem icon={Radio} label="Buka radio lagu" onClick={handleRadio} />
                </div>
                
                <MenuItem icon={FileText} label="Lihat kredit lagu" onClick={handleCredits} />
                <MenuItem icon={QrCode} label="Tampilkan Kode Music Kita semua" onClick={handleQRCode} />
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
