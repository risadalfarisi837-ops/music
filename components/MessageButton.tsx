'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { useAuthStore } from '@/lib/store';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Don't show for own profile
  if (user?.id === targetUserId) return null;

  const handleMessage = async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    const roomId = await db.getOrCreateDMRoom(targetUserId);
    setLoading(false);

    if (roomId) {
      router.push(`/messages/${roomId}`);
    }
  };

  return (
    <button
      onClick={handleMessage}
      disabled={loading}
      className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 bg-white/10 text-white border border-white/20 hover:bg-white/20"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <MessageCircle className="w-4 h-4" />
          Pesan
        </>
      )}
    </button>
  );
}
