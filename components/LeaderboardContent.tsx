'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Trophy, Medal, Crown } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_plays: number;
}

export function LeaderboardContent({ compact = false }: { compact?: boolean }) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    db.getLeaderboard().then(data => {
      setLeaders(data);
      setLoading(false);
    });
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-5 h-5 md:w-6 md:h-6 text-amber-700" />;
    return <span className="text-zinc-500 font-bold w-5 md:w-6 text-center text-sm md:text-base">{index + 1}</span>;
  };

  return (
    <div className={`w-full ${compact ? '' : 'p-4 md:p-6 pb-32 max-w-3xl mx-auto min-h-screen'}`}>
      {!compact && (
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 flex items-center justify-center relative overflow-hidden">
            <Image src="/icon.png" alt="Logo" fill className="object-cover opacity-80" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Top Pendengar</h1>
            <p className="text-zinc-400 text-xs font-medium mt-1">Peringkat berdasarkan total lagu diputar minggu ini</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2 mt-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`${compact ? 'h-12' : 'h-14'} bg-white/5 animate-pulse rounded-lg`} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {leaders.map((leader, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;
            
            return (
              <div 
                key={leader.user_id}
                onClick={() => router.push(`/user/${leader.user_id}`)}
                className={`group flex items-center gap-3 ${compact ? 'p-1.5' : 'p-2'} hover:bg-white/10 rounded-md cursor-pointer transition-colors`}
              >
                <div className={`flex items-center justify-center shrink-0 ${compact ? 'w-6' : 'w-8'}`}>
                  {getRankIcon(idx)}
                </div>
                
                <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden shrink-0 relative ${isTop1 ? 'ring-2 ring-yellow-500' : isTop2 ? 'ring-2 ring-gray-400' : isTop3 ? 'ring-2 ring-amber-700' : 'bg-zinc-800'}`}>
                  {leader.avatar_url ? (
                    <Image src={leader.avatar_url} alt={leader.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 text-xs bg-zinc-800">
                      {leader.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate ${isTop1 ? 'text-yellow-500 font-bold' : 'text-white'}`}>
                    {leader.name}
                  </h3>
                  {!compact && (
                    <p className="text-xs text-zinc-400 truncate">
                      Pendengar Setia
                    </p>
                  )}
                </div>

                <div className="text-right flex items-center gap-1.5">
                  <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${isTop1 ? 'text-yellow-500' : 'text-white'}`}>
                    {leader.total_plays}
                  </span>
                  {!compact && (
                    <span className="text-xs text-zinc-500">
                      kali
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {leaders.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Belum ada data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
