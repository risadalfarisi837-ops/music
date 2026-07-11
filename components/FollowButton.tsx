'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useAuthStore } from '@/lib/store';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      db.checkIsFollowing(targetUserId).then(status => {
        setIsFollowing(status);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [targetUserId, isAuthenticated]);

  if (user?.id === targetUserId) {
    return null; // Don't show follow button for own profile
  }

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    if (isFollowing) {
      const { error } = await db.unfollowUser(targetUserId);
      if (!error) setIsFollowing(false);
    } else {
      const { error } = await db.followUser(targetUserId);
      if (!error) setIsFollowing(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
        isFollowing 
          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
          : 'bg-white text-black'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Mengikuti
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Ikuti
        </>
      )}
    </button>
  );
}
