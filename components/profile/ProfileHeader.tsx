'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'motion/react';
import { Settings, Edit2, Crown, Share2, Check } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { FollowsModal } from '@/components/FollowsModal';

export function ProfileHeader() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollows, setShowFollows] = useState(false);
  const [initialTab, setInitialTab] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      db.getFollowCounts(user.id).then(counts => {
        setFollowersCount(counts.followers);
        setFollowingCount(counts.following);
      });
    }
  }, [isAuthenticated, user?.id]);

  const handleLogin = () => {
    router.push('/auth');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
          <Settings className="w-10 h-10 text-white/50" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Belum Masuk</h2>
        <p className="text-white/60 text-center mb-8">Masuk untuk menyimpan riwayat, membuat playlist, dan sinkronisasi antar perangkat.</p>
        <button 
          onClick={handleLogin}
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
        >
          Masuk ke Akun
        </button>
      </div>
    );
  }

  return (
    <div className="relative pt-12 pb-6 px-4 flex flex-col items-center text-center">
      {/* Banner Background */}
      {user?.bannerUrl && (
        <div className="absolute top-0 inset-x-0 h-48 -z-10 overflow-hidden rounded-t-3xl opacity-50">
          <Image src={user.bannerUrl} alt="Banner" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        </div>
      )}

      {/* Avatar */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-32 h-32 rounded-full mb-4 shadow-2xl"
      >
        <Image
          src={user.avatarUrl || '/icon.png'}
          alt={user.name}
          fill
          className="rounded-full object-cover border-4 border-white/10"
        />
        {user.isPremium && (
          <div className="absolute -bottom-2 -right-2 bg-yellow-500 p-2 rounded-full shadow-lg">
            <Crown className="w-5 h-5 text-black" />
          </div>
        )}
      </motion.div>

      {/* Name and Tag */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          {user.name}
        </h1>
        <p className="text-white/60 text-sm mt-1">{user.email}</p>
        
        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setInitialTab('followers'); setShowFollows(true); }}
          >
            <span className="text-xl font-bold text-white">{followersCount}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">Pengikut</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => { setInitialTab('following'); setShowFollows(true); }}
          >
            <span className="text-xl font-bold text-white">{followingCount}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">Mengikuti</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-white">{user.totalListeningHours}h</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">Diputar</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button 
            onClick={() => router.push('/profile/edit')}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-full text-sm font-medium border border-white/5"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profil
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/user/${user.id}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors py-2 rounded-full text-sm font-medium border border-white/5"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Disalin!' : 'Bagikan'}
          </button>
        </div>
      </motion.div>

      {/* Follows Modal */}
      {user && (
        <FollowsModal
          isOpen={showFollows}
          onClose={() => setShowFollows(false)}
          userId={user.id}
          initialTab={initialTab}
        />
      )}
    </div>
  );
}
