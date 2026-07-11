'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore, usePartyStore } from '@/lib/store';
import { Headphones, Users, Share2, Copy, LogOut, Crown } from 'lucide-react';
import Image from 'next/image';

export default function PartyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  
  const { user } = useAuthStore();
  const { roomId: currentRoomId, isHost, members, setParty, leaveParty } = usePartyStore();
  
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      router.push('/auth?redirect=/party/' + roomId);
    }
  }, [user, router, roomId, isMounted]);

  const handleJoin = () => {
    setParty(roomId, false);
  };

  const handleLeave = () => {
    leaveParty();
    router.push('/');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted || !user) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-4 md:p-8 max-w-4xl mx-auto mt-2 md:mt-8">
        <div className="bg-zinc-900/80 p-5 md:p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/10 group">
                <Image src="/icon.png" alt="Stream Beats Logo" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 leading-tight tracking-tight">Listen Together</h1>
                <p className="text-sm md:text-base text-zinc-400 mt-1.5 font-medium line-clamp-1">Dengarkan musik bersama secara real-time</p>
              </div>
            </div>
            
            {currentRoomId === roomId ? (
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={handleCopyLink}
                  className="flex-1 md:flex-none flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium border bg-zinc-800/80 border-white/10 hover:bg-zinc-700 text-white transition-all active:scale-95"
                >
                  {copied ? 'Tersalin!' : <><Share2 className="w-4 h-4 md:mr-2 mr-1.5" /> <span className="hidden sm:inline">Bagikan Link</span><span className="sm:hidden">Bagikan</span></>}
                </button>
                <button 
                  onClick={handleLeave}
                  className="flex-1 md:flex-none flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </button>
              </div>
            ) : (
              <button 
                onClick={handleJoin}
                className="w-full md:w-auto flex items-center justify-center bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-4 rounded-xl transition-all text-base shadow-lg shadow-green-500/20 active:scale-95"
              >
                Gabung Sesi Sekarang
              </button>
            )}
          </div>

          <div className="w-full h-px bg-white/5 mb-8" />

          {/* Members Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
              <Users className="w-5 h-5 text-green-400" />
              <span>Anggota ({members.length})</span>
            </div>

            {currentRoomId === roomId ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors p-4 rounded-2xl border border-white/5">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700">
                      <Image
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{member.name}</p>
                      {member.isHost ? (
                        <p className="text-green-400 text-xs flex items-center gap-1 mt-0.5 font-medium">
                          <Crown className="w-3.5 h-3.5" /> Host
                        </p>
                      ) : (
                        <p className="text-zinc-500 text-xs mt-0.5 font-medium">Pendengar</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="col-span-full py-10 text-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-white/5 border-dashed">
                    <div className="animate-pulse">Menunggu teman bergabung...</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-zinc-800/20 rounded-3xl border border-white/5 border-dashed">
                <div className="relative w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-6 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500 border border-white/10">
                  <Image src="/icon.png" alt="Logo" fill className="object-cover grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Anda belum bergabung</h3>
                <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
                  Klik tombol <strong>"Gabung Sesi"</strong> di atas untuk mulai mendengarkan musik bersama teman-teman secara *real-time*.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
