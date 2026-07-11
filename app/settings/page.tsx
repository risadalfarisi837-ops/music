'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useSettingsStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Search, 
  BarChart2, 
  EyeOff, 
  UserCircle2, 
  Music, 
  Lock, 
  Volume2, 
  Bell, 
  MonitorSpeaker, 
  ArrowDownCircle, 
  BarChart3, 
  LayoutTemplate, 
  Info,
  ChevronDown,
  Trash2,
  Download,
  AlertCircle,
  Code,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { ConfirmModal } from '@/components/FeedbackModals';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { PiPPlugin } from '@/lib/pip';

export default function Settings() {
  const router = useRouter();
  const { user, isAuthenticated, logout, removeSavedAccount } = useAuthStore();
  const settings = useSettingsStore();
  const supabase = createClient();
  const [clearTarget, setClearTarget] = useState<'history' | 'search' | 'all' | null>(null);
  const [showDevs, setShowDevs] = useState(false);
  const [expandedSetting, setExpandedSetting] = useState<string | null>(null);
  const [autoPip, setAutoPip] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoPipEnabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Sync PiP state to native on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const saved = localStorage.getItem('autoPipEnabled');
      const enabled = saved !== null ? saved === 'true' : true;
      PiPPlugin.setAutoPipEnabled({ enabled }).catch(console.error);
    }
  }, []);

  const toggleAutoPip = () => {
    const newState = !autoPip;
    setAutoPip(newState);
    localStorage.setItem('autoPipEnabled', String(newState));
    if (Capacitor.isNativePlatform()) {
      PiPPlugin.setAutoPipEnabled({ enabled: newState }).catch(console.error);
    }
  };

  const toggleSetting = (name: string) => {
    setExpandedSetting(prev => prev === name ? null : name);
  };

  const SubSettingToggle = ({ label, isOn = false, onToggle }: { label: string, isOn?: boolean, onToggle?: () => void }) => {
    return (
      <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 cursor-pointer pl-[72px]" onClick={(e) => { e.stopPropagation(); onToggle?.(); }}>
        <span className="text-white/80 text-sm">{label}</span>
        <div className={`w-10 h-5 rounded-full relative transition-colors ${isOn ? 'bg-green-500' : 'bg-white/20'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>
    );
  };

  const handleFeatureClick = () => alert('Pengaturan berhasil disimpan/diperbarui!');

  const handleClear = async () => {
    if (!clearTarget) return;
    try {
      if (clearTarget === 'history' || clearTarget === 'all') {
        localStorage.removeItem('music-player-storage'); 
      }
      if (clearTarget === 'search') {
        await db.clearRecentSearches();
      } else if (clearTarget === 'all') {
        await db.clearAllData();
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
    setClearTarget(null);
  };

  const handleExport = async () => {
    try {
      const playlists = await db.getPlaylists();
      const liked = await db.getLikedSongs();
      const albums = await db.getSavedAlbums();
      
      const backup = {
        version: 1,
        date: new Date().toISOString(),
        data: { playlists, liked, albums }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `music-app-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleLogout = async () => {
    if (user?.id) removeSavedAccount(user.id);
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  const SettingItem = ({ icon: Icon, title, subtitle, onClick, rightIcon: RightIcon }: { icon: any, title: string, subtitle: string, onClick?: () => void, rightIcon?: any }) => (
    <div onClick={onClick} className="flex items-center justify-between py-4 px-4 hover:bg-white/5 cursor-pointer transition-colors">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-8 flex justify-center">
          <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-[15px] font-medium tracking-wide">{title}</span>
          <span className="text-white/60 text-[13px] mt-0.5">{subtitle}</span>
        </div>
      </div>
      {RightIcon && (
        <RightIcon className="w-5 h-5 text-white/50" />
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* Header (Mobile Only) */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A] flex md:hidden items-center justify-between px-4 h-16">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-start">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-bold text-white">Pengaturan</h1>
        <Link href="/search" className="w-10 h-10 flex items-center justify-end">
          <Search className="w-6 h-6 text-white" />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Top Cards */}
        <div className="flex gap-4 px-4 py-4 mb-2">
          <div className="flex-1 bg-[#242424] hover:bg-[#2A2A2A] cursor-pointer transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2" onClick={() => {
            settings.setDataSaver(!settings.dataSaver);
            alert(`Mode hemat data ${!settings.dataSaver ? 'diaktifkan' : 'dinonaktifkan'}`);
          }}>
            <BarChart2 className={`w-7 h-7 mb-1 ${settings.dataSaver ? 'text-green-400' : 'text-white'}`} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">Mode hemat data</span>
              <span className="text-white/50 text-xs">{settings.dataSaver ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          </div>
          <div className="flex-1 bg-[#242424] hover:bg-[#2A2A2A] cursor-pointer transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2" onClick={() => {
            settings.setPrivateSession(!settings.privateSession);
            alert(`Sesi pribadi ${!settings.privateSession ? 'diaktifkan' : 'dinonaktifkan'}`);
          }}>
            <EyeOff className={`w-7 h-7 mb-1 ${settings.privateSession ? 'text-green-400' : 'text-white'}`} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">Sesi pribadi</span>
              <span className="text-white/50 text-xs">{settings.privateSession ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="flex flex-col mt-2">
          <SettingItem 
            icon={UserCircle2} 
            title="Akun" 
            subtitle="Nama pengguna • Tutup akun" 
            onClick={() => router.push('/profile')}
          />
          <div>
            <SettingItem icon={Music} title="Konten dan tampilan" subtitle="Canvas • Kurangi animasi" onClick={() => toggleSetting('konten')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'konten' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Kurangi animasi" isOn={settings.reduceMotion} onToggle={() => settings.setReduceMotion(!settings.reduceMotion)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <SettingItem icon={Lock} title="Privasi dan sosial" subtitle="Sesi pribadi • Playlist publik" onClick={() => toggleSetting('privasi')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'privasi' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Sesi pribadi" isOn={settings.privateSession} onToggle={() => settings.setPrivateSession(!settings.privateSession)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <SettingItem icon={Volume2} title="Playback" subtitle="Playback tanpa jeda • Autoplay • Auto-PiP" onClick={() => toggleSetting('playback')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'playback' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Playback tanpa jeda" isOn={settings.gaplessPlayback} onToggle={() => settings.setGaplessPlayback(!settings.gaplessPlayback)} />
                  <SubSettingToggle label="Autoplay" isOn={settings.autoplay} onToggle={() => settings.setAutoplay(!settings.autoplay)} />
                  <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 cursor-pointer pl-[72px]" onClick={(e) => { e.stopPropagation(); toggleAutoPip(); }}>
                    <div className="flex flex-col">
                      <span className="text-white/80 text-sm">Auto Picture-in-Picture</span>
                      <span className="text-white/40 text-xs">Tampilkan jendela kecil saat keluar aplikasi</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${autoPip ? 'bg-green-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoPip ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <SettingItem icon={Bell} title="Notifikasi" subtitle="Push • Email" onClick={() => toggleSetting('notifikasi')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'notifikasi' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Push" isOn={false} onToggle={handleFeatureClick} />
                  <SubSettingToggle label="Email" isOn={false} onToggle={handleFeatureClick} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <SettingItem icon={ArrowDownCircle} title="Mode hemat data dan offline" subtitle="Mode hemat data • Download memakai data seluler" onClick={() => toggleSetting('mode')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'mode' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Mode hemat data" />
                  <SubSettingToggle label="Download memakai data seluler" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <SettingItem icon={BarChart3} title="Kualitas media" subtitle="Kualitas streaming Wi-Fi • Kualitas download audio" onClick={() => toggleSetting('kualitas')} rightIcon={ChevronDown} />
            <AnimatePresence>
              {expandedSetting === 'kualitas' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/20">
                  <SubSettingToggle label="Kualitas streaming Wi-Fi (Tinggi)" />
                  <SubSettingToggle label="Kualitas download audio (Tinggi)" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          
          {/* Restored Features in new UI format */}
          <div className="h-px bg-white/10 my-2 mx-4" />
          
          <SettingItem 
            icon={Download} 
            title="Backup Data" 
            subtitle="Ekspor playlist dan lagu yang disukai" 
            onClick={handleExport}
          />
          <SettingItem 
            icon={Trash2} 
            title="Hapus Riwayat" 
            subtitle="Kosongkan riwayat pencarian dan putar" 
            onClick={() => setClearTarget('history')}
          />
          <SettingItem 
            icon={AlertCircle} 
            title="Reset Semua Data" 
            subtitle="Hapus seluruh data secara permanen" 
            onClick={() => setClearTarget('all')}
          />
          
          <div className="h-px bg-white/10 my-2 mx-4" />

          <SettingItem 
            icon={Info} 
            title="Tentang dan dukungan" 
            subtitle="Versi • Info Developer" 
            onClick={() => setShowDevs(!showDevs)}
            rightIcon={ChevronDown}
          />

          <AnimatePresence>
            {showDevs && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-black/20"
              >
                <div 
                  onClick={() => router.push('/developer')}
                  className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors pl-[72px]"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/10 mr-4">
                    <Image src="/icon.png" alt="Developer" width={40} height={40} className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-sm font-medium">SANN404 FORUM</h3>
                    <p className="text-white/50 text-xs">Lead Developer</p>
                  </div>
                </div>
                <div 
                  onClick={() => router.push('/developer')}
                  className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors pl-[72px]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 border-2 border-white/10 mr-4">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-sm font-medium">./B7</h3>
                    <p className="text-white/50 text-xs">Co-Developer</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout Button */}
        <div className="flex justify-center mt-12 mb-8">
          {isAuthenticated ? (
            <button 
              onClick={handleLogout}
              className="bg-white hover:scale-105 active:scale-95 transition-transform text-black font-bold text-[15px] px-8 py-3 rounded-full"
            >
              Keluar
            </button>
          ) : (
            <button 
              onClick={() => router.push('/auth/login')}
              className="bg-white hover:scale-105 active:scale-95 transition-transform text-black font-bold text-[15px] px-8 py-3 rounded-full"
            >
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!clearTarget}
        title={clearTarget === 'all' ? 'Reset Semua Data?' : 'Hapus Riwayat?'}
        message={clearTarget === 'all' ? 'Aksi ini akan menghapus semua riwayat, lagu yang disukai, dan playlist. Data tidak bisa dikembalikan.' : 'Apakah kamu yakin ingin menghapus riwayat putar lagu?'}
        onConfirm={handleClear}
        onCancel={() => setClearTarget(null)}
      />
    </main>
  );
}
