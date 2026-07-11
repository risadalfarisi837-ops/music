'use client';

import { ArrowLeft, Edit, Users, MessageCircle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import UserSelectionModal from '@/components/UserSelectionModal';
import ChatContextMenu from '@/components/ChatContextMenu';
import StoriesList from '@/components/StoriesList';
import { db } from '@/lib/db';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  created_at: string;
  chat_members: { user_id: string }[];
  messages: { id: string; text: string; created_at: string; sender_id: string }[];
  // Computed after fetching profiles
  displayName?: string;
  displayAvatar?: string | null;
  lastMessage?: string;
  lastDate?: string;
  otherUserId?: string | null;
}

function formatDate(isoDate: string) {
  const d = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return d.toLocaleDateString('id-ID', { weekday: 'short' });
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function ChatList() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [contextMenuUser, setContextMenuUser] = useState<any>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, room: ChatRoom) => {
    if (room.is_group || !room.otherUserId) return;
    pressTimer.current = setTimeout(() => {
      setContextMenuUser({
        id: room.otherUserId,
        name: room.displayName,
        avatar_url: room.displayAvatar
      });
    }, 600);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleCreateDirect = async (userId: string) => {
    setModalOpen(false);
    const roomId = await db.createDirectChat(userId);
    if (roomId) router.push(`/messages/${roomId}`);
  };

  const handleCreateGroup = async (name: string, userIds: string[]) => {
    setModalOpen(false);
    const roomId = await db.createGroupChat(name, userIds);
    if (roomId) router.push(`/messages/${roomId}`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function loadRooms() {
    setLoading(true);
    const rawRooms: ChatRoom[] = await db.getChatRooms() as ChatRoom[];

    // Untuk setiap room, ambil profil anggota lain agar bisa tampilkan nama & avatar
    const processed = await Promise.all(rawRooms.map(async (room) => {
      const otherMemberIds = room.chat_members
        .map(m => m.user_id)
        .filter(id => id !== user?.id);

      let displayName = room.name || 'Grup';
      let displayAvatar = room.avatar_url || null;

      if (!room.is_group && otherMemberIds.length > 0) {
        // Ambil profil dari tabel profiles Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', otherMemberIds[0])
          .maybeSingle();

        if (profile) {
          displayName = profile.name || 'Pengguna';
          displayAvatar = profile.avatar_url || null;
        } else {
          displayName = 'Pengguna';
        }
      }

      const sortedMessages = [...(room.messages || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMessages[0];

      let lastMessagePreview = 'Mulai obrolan';
      if (lastMsg?.text) {
        if (lastMsg.text.startsWith('$$SONG::')) {
          const parts = lastMsg.text.split('::');
          lastMessagePreview = parts.length >= 3 ? `🎵 ${parts[2]}` : '🎵 Lagu';
        } else if (lastMsg.text.startsWith('$$STICKER::')) {
          lastMessagePreview = '🩷 Stiker';
        } else if (lastMsg.text.startsWith('Membalas kisah')) {
          lastMessagePreview = '💬 Balasan kisah';
        } else if (lastMsg.text.startsWith('Bereaksi terhadap kisah')) {
          lastMessagePreview = '✨ Reaksi kisah';
        } else {
          lastMessagePreview = lastMsg.text;
        }
      }

      return {
        ...room,
        displayName,
        displayAvatar,
        otherUserId: otherMemberIds.length > 0 ? otherMemberIds[0] : null,
        lastMessage: lastMessagePreview,
        lastDate: lastMsg ? formatDate(lastMsg.created_at) : '',
      };
    }));

    // Urutkan berdasarkan pesan terbaru
    processed.sort((a, b) => {
      const aTime = a.messages[0] ? new Date(a.messages[0].created_at).getTime() : new Date(a.created_at).getTime();
      const bTime = b.messages[0] ? new Date(b.messages[0].created_at).getTime() : new Date(b.created_at).getTime();
      return bTime - aTime;
    });

    setRooms(processed);
    setLoading(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-center px-8 pb-32">
        <MessageCircle className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Masuk untuk melihat pesan</h2>
        <p className="text-zinc-400 text-sm mb-6">Login terlebih dahulu untuk membuka fitur pesan.</p>
        <button
          onClick={() => router.push('/auth')}
          className="bg-[#1DB954] text-black font-bold px-6 py-3 rounded-full hover:scale-105 transition"
        >
          Masuk
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto pb-32 md:pb-0 shrink-0 bg-[#121212] lg:rounded-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212] px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => router.back()} className="text-white hover:opacity-70 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-base">Pesan</h1>
        <button 
          onClick={() => { setIsGroupMode(false); setModalOpen(true); }}
          className="text-white hover:opacity-70 transition"
        >
          <Edit className="w-6 h-6" />
        </button>
      </div>

      <div className="pt-4 px-4 mb-2">
        <StoriesList />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 md:pb-6">
        {/* Create Group Action */}
        <div 
          onClick={() => { setIsGroupMode(true); setModalOpen(true); }}
          className="flex items-center gap-4 py-3 cursor-pointer hover:bg-white/5 transition rounded-lg"
        >
          <div className="w-14 h-14 rounded-full bg-[#282828] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-medium text-base">Buat grup</span>
        </div>

        {/* Chat List */}
        {loading ? (
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Belum ada obrolan</p>
            <p className="text-zinc-600 text-xs mt-1">Mulai obrolan dari halaman profil pengguna lain</p>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            {rooms.map((room) => (
              <div
                key={room.id}
                onTouchStart={(e) => handleTouchStart(e, room)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onMouseDown={(e) => handleTouchStart(e, room)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onClick={(e) => {
                  // Prevent navigation if context menu is already open
                  if (contextMenuUser) e.preventDefault();
                  else router.push(`/messages/${room.id}`);
                }}
                className="flex items-center gap-4 py-3 cursor-pointer hover:bg-white/5 transition rounded-lg"
              >
                <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden bg-[#282828] flex items-center justify-center pointer-events-none">
                  {room.displayAvatar ? (
                    <Image src={room.displayAvatar} alt={room.displayName || ''} fill className="object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {(room.displayName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium text-base truncate">{room.displayName}</h3>
                    {room.lastDate && (
                      <span className="text-zinc-500 text-xs shrink-0 ml-2">{room.lastDate}</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-sm truncate mt-0.5 pointer-events-none">{room.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserSelectionModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        isGroup={isGroupMode}
        onSelectUser={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
      />
      
      <ChatContextMenu
        isOpen={!!contextMenuUser}
        onClose={() => setContextMenuUser(null)}
        user={contextMenuUser}
        onViewProfile={(id) => router.push(`/profile/${id}`)}
        onUnfollow={async (id) => {
          await db.unfollowUser(id);
          alert('Berhasil berhenti mengikuti.');
        }}
        onBlock={async (id) => {
          await db.blockUser(id);
          alert('Pengguna berhasil diblokir.');
        }}
      />
    </div>
  );
}
