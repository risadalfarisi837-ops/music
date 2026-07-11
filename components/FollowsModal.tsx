'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { FollowButton } from './FollowButton';

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
}

export function FollowsModal({ isOpen, onClose, userId, initialTab = 'followers' }: FollowsModalProps) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    const loadUsers = async () => {
      const data = tab === 'followers' 
        ? await db.getFollowers(userId)
        : await db.getFollowing(userId);
      
      if (isMounted) {
        setUsers(data as Profile[]);
        setLoading(false);
      }
    };

    loadUsers();

    return () => { isMounted = false; };
  }, [isOpen, tab, userId]);

  const handleUserClick = (id: string) => {
    onClose();
    router.push(`/user/${id}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-10 flex flex-col h-[70vh] sm:h-[600px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-bold text-white">Ikatan</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            <button
              onClick={() => setTab('followers')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${tab === 'followers' ? 'text-white' : 'text-white/50 hover:text-white/70'}`}
            >
              Pengikut
              {tab === 'followers' && (
                <motion.div layoutId="followsTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => setTab('following')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${tab === 'following' ? 'text-white' : 'text-white/50 hover:text-white/70'}`}
            >
              Mengikuti
              {tab === 'following' && (
                <motion.div layoutId="followsTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-white" />
              )}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-1">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => handleUserClick(u.id)}
                    >
                      <div className="relative w-12 h-12 rounded-full bg-white/10 overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} alt={u.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white/50" />
                          </div>
                        )}
                      </div>
                      <span className="text-white font-medium truncate group-hover:underline">{u.name || 'Pengguna'}</span>
                    </div>
                    <div className="shrink-0 ml-4">
                      <FollowButton targetUserId={u.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                {tab === 'followers' ? 'Belum ada pengikut.' : 'Belum mengikuti siapa pun.'}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
