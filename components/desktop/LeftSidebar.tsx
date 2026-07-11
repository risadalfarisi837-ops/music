'use client';

import { Library } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useAuthStore, usePlayerStore } from '@/lib/store';
import { getHighResImage } from '@/lib/utils';

export function LeftSidebar() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const { isAuthenticated } = useAuthStore();
  const { currentTrack, playTrack } = usePlayerStore();

  useEffect(() => {
    if (isAuthenticated) {
      db.getHistory().then(res => setHistory(res));
    }
  }, [isAuthenticated, currentTrack?.videoId]);

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 px-6 text-zinc-400">
        <button 
          onClick={() => router.push('/library')}
          className="flex items-center gap-4 hover:text-white transition-colors group"
        >
          <Library className="w-6 h-6 group-hover:scale-105 transition-transform" />
          <span className="font-bold text-base">Your Library</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {history.length > 0 ? (
          history.map((item, index) => {
            const track = item.track;
            const artistName = Array.isArray(track.artist) ? track.artist.map((a:any) => a.name).join(', ') : track.artist?.name || 'Unknown Artist';
            const thumbnail = getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 200);
            
            return (
              <div 
                key={index}
                onClick={() => playTrack(track, history.map(h => h.track), 'similar')}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-800 shrink-0 relative">
                  <Image src={thumbnail} alt={track.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-base group-hover:text-green-500 transition-colors">{track.name}</p>
                  <p className="text-zinc-400 text-sm truncate">{artistName}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-zinc-500 text-sm p-4 text-center">Belum ada riwayat pemutaran</div>
        )}
      </div>
    </div>
  );
}
