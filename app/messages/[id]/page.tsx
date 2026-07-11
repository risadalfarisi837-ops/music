'use client';

import { ArrowLeft, ChevronRight, Plus, Smile, Send, Play, Music, X, Headphones } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef, useEffect, use } from 'react';
import { db } from '@/lib/db';
import { useAuthStore, usePlayerStore, usePartyStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import ShareSongModal from '@/components/ShareSongModal';
import StickerPicker from '@/components/StickerPicker';
import MessageContextMenu from '@/components/MessageContextMenu';

interface Message {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  reply_to_id?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  message_reactions?: { emoji: string; user_id: string }[];
}

interface OtherUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface RoomDetails {
  id: string;
  is_group: boolean;
  name: string | null;
  avatar_url: string | null;
  members: OtherUser[];
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [sending, setSending] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { playTrack } = usePlayerStore();
  const { setParty, leaveParty, isHost, roomId: partyRoomId } = usePartyStore();

  const isPartyActive = partyRoomId === roomId;

  const startLiveSession = async () => {
    if (!roomId || !user) return;
    setParty(roomId, true);
    const text = `$$PARTY_SESSION::${user.id}`;
    await db.sendMessage(roomId, text);
  };

  // Fetch messages & other user info
  useEffect(() => {
    if (!roomId || !user) return;

    // Load existing messages
    loadMessages();
    loadRoomInfo();

    // Subscribe real-time
    // Gunakan nama channel unik (dengan Math.random) agar tidak error saat React StrictMode re-render
    const channelName = `room:${roomId}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, user]);

  const handleReact = async (messageId: string, emoji: string) => {
    await db.toggleMessageReaction(messageId, emoji);
    // Reload messages to get updated reactions
    loadMessages();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const data = await db.getMessages(roomId);
    setMessages(data as Message[]);
  }

  async function loadRoomInfo() {
    const { data: room } = await supabase.from('chat_rooms').select('*').eq('id', roomId).single();
    if (!room) return;

    // Get members
    const { data: membersData } = await supabase.from('chat_members').select('user_id').eq('room_id', roomId);
    const memberIds = membersData?.map(m => m.user_id) || [];
    
    // Fetch profiles
    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', memberIds);
    const members = profiles || [];

    setRoomDetails({ ...room, members });

    if (!room.is_group) {
      const other = members.find(m => m.id !== user?.id);
      if (other) {
        setOtherUser({ id: other.id, name: other.name || 'Pengguna', avatar_url: other.avatar_url });
      }
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const text = newMessage.trim();

    if (editingMessage) {
      const success = await db.editMessage(editingMessage.id, text);
      if (success) {
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text, is_edited: true } : m));
      }
      setEditingMessage(null);
      setNewMessage('');
      setSending(false);
      return;
    }

    setNewMessage('');
    const replyId = replyingTo?.id;
    setReplyingTo(null);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      text,
      sender_id: user?.id || '',
      created_at: new Date().toISOString(),
      reply_to_id: replyId,
    };
    setMessages(prev => [...prev, tempMsg]);

    const sent = await db.sendMessage(roomId, text, replyId);

    // Ganti temp msg dengan yang real
    if (sent) {
      setMessages(prev => prev.map(m => m.id === tempId ? sent as Message : m));
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  const isGroup = roomDetails?.is_group;
  const displayName = isGroup ? (roomDetails.name || 'Grup') : (otherUser?.name || 'Obrolan');
  const displayAvatar = isGroup ? roomDetails.avatar_url : otherUser?.avatar_url;

  return (
    <div className="h-full bg-[#121212] flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button onClick={() => router.back()} className="md:hidden text-white hover:opacity-70 transition p-1 -ml-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            if (isGroup) setShowGroupModal(true);
            else if (otherUser) router.push(`/user/${otherUser.id}`);
          }}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-700">
            {displayAvatar ? (
              <Image src={displayAvatar} alt={displayName} width={32} height={32} className="object-cover w-full h-full" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-white font-bold text-base">{displayName}</h1>
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
        <div className="flex items-center gap-2">
          {isGroup && !isPartyActive && (
            <button onClick={startLiveSession} className="text-[#1DB954] bg-[#1DB954]/10 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-[#1DB954]/20 transition">
              <Headphones className="w-3.5 h-3.5" />
              Party
            </button>
          )}
          {isGroup && isPartyActive && (
            <button onClick={leaveParty} className="text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/20 transition">
              <X className="w-3.5 h-3.5" />
              Keluar Party
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-6 transition-all duration-300 lg:pb-4 ${usePlayerStore((state) => state.currentTrack) ? 'pb-[220px]' : 'pb-[140px]'}`}>
        {/* Security Banner */}
        <div className="text-center mb-8 px-2">
          <p className="text-zinc-500 text-xs leading-relaxed">
            Agar obrolanmu tetap aman, kami mungkin akan meninjau pesan tertentu jika dilaporkan.
          </p>
        </div>

        {/* Profile / Group Card */}
        <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-zinc-700 flex items-center justify-center">
              {displayAvatar ? (
                <Image src={displayAvatar} alt={displayName} width={96} height={96} className="object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-white text-2xl font-bold mb-4">{displayName}</h2>
            <button
              onClick={() => {
                if (isGroup) setShowGroupModal(true);
                else if (otherUser) router.push(`/user/${otherUser.id}`);
              }}
              className="border border-white/20 hover:bg-white/10 text-white rounded-full px-6 py-2 text-sm font-medium transition"
            >
              {isGroup ? 'Detail grup' : 'Buka profil'}
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-zinc-500 text-xs">
              Mulai obrolan di {isGroup ? 'grup' : displayName}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

        {/* Message Bubbles */}
        <div className="space-y-2">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[i - 1];
            const showTime = !prevMsg || formatTime(msg.created_at) !== formatTime(prevMsg.created_at);
            const showSenderName = isGroup && !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            const senderProfile = isGroup ? roomDetails?.members.find(m => m.id === msg.sender_id) : null;

            // Generate a consistent color from the sender's id
            const nameColors = ['#1DB954', '#E91E63', '#FF9800', '#03A9F4', '#9C27B0', '#FFEB3B', '#00BCD4', '#FF5722'];
            const senderColor = senderProfile ? nameColors[senderProfile.name.charCodeAt(0) % nameColors.length] : '#1DB954';

            let songData = null;
            let stickerUrl = null;
            let displayText = msg.text;
            let isLiveMessage = false;
            let liveHostId = '';

            if (msg.text.startsWith('$$SONG::')) {
              const parts = msg.text.split('::');
              if (parts.length >= 5) {
                songData = {
                  videoId: parts[1],
                  title: parts[2],
                  artist: parts[3],
                  coverUrl: parts[4]
                };
              } else {
                displayText = 'Lagu (Tidak Tersedia)';
              }
            } else if (msg.text.startsWith('$$STICKER::')) {
              const parts = msg.text.split('::');
              if (parts.length >= 2) {
                stickerUrl = parts[1];
              }
            } else if (msg.text.startsWith('$$PARTY_SESSION::')) {
              isLiveMessage = true;
              liveHostId = msg.text.split('::')[1] || '';
            }

            return (
              <div key={msg.id} className="group/message">
                {showTime && i > 0 && (
                  <div className="text-center my-3">
                    <span className="text-zinc-600 text-[10px]">{formatTime(msg.created_at)}</span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender name label for group chats */}
                  {showSenderName && senderProfile && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-700 shrink-0">
                        {senderProfile.avatar_url ? (
                          <Image src={senderProfile.avatar_url} alt={senderProfile.name} width={20} height={20} className="object-cover w-full h-full" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[9px] text-white font-bold">
                            {senderProfile.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: senderColor }}>
                        {senderProfile.name}
                      </span>
                    </div>
                  )}
                  <div 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMessageId(msg.id);
                    }}
                  >
                    {msg.reply_to_id && (() => {
                      const repliedMsg = messages.find(m => m.id === msg.reply_to_id);
                      if (!repliedMsg) return null;
                      const repliedProfile = roomDetails?.members.find(m => m.id === repliedMsg.sender_id);
                      const isRepliedMe = repliedMsg.sender_id === user?.id;
                      const repliedName = isRepliedMe ? 'Anda' : (repliedProfile?.name || 'Seseorang');
                      
                      let rText = repliedMsg.text;
                      if (rText.startsWith('$$SONG::')) rText = 'Lagu';
                      else if (rText.startsWith('$$STICKER::')) rText = 'Stiker';
                      else if (repliedMsg.is_deleted) rText = 'Pesan ini telah dihapus';

                      return (
                        <div className={`mb-1 opacity-80 text-xs px-3 py-1.5 rounded-xl border-l-4 ${isMe ? 'bg-[#1DB954]/20 border-[#1DB954] text-white/90 mr-2' : 'bg-white/5 border-zinc-500 text-white/70 ml-2'} max-w-[75%] truncate`}>
                          <p className="font-bold mb-0.5">{repliedName}</p>
                          <p className="truncate">{rText}</p>
                        </div>
                      );
                    })()}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                    {songData ? (
                      <div 
                      onClick={() => {
                        const track = {
                          videoId: songData.videoId,
                          name: songData.title,
                          artist: { name: songData.artist },
                          thumbnails: [{ url: songData.coverUrl, width: 300, height: 300 }]
                        };
                        playTrack(track, [track]);
                      }}
                      className={`flex items-center gap-3 w-64 p-2 rounded-2xl cursor-pointer hover:opacity-90 transition shadow-sm ${
                        isMe ? 'bg-[#1DB954] text-black rounded-br-sm' : 'bg-[#282828] text-white rounded-bl-sm'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg bg-zinc-800 shrink-0 overflow-hidden">
                        {songData.coverUrl ? (
                          <Image src={songData.coverUrl} alt={songData.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] truncate leading-tight">{songData.title}</p>
                        <p className={`text-[12px] truncate mt-0.5 ${isMe ? 'text-black/70' : 'text-zinc-400'}`}>{songData.artist}</p>
                      </div>
                      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isMe ? 'bg-black/10' : 'bg-white/10'}`}>
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                  ) : stickerUrl ? (
                    <div className="relative w-32 h-32 md:w-40 md:h-40">
                      <img src={stickerUrl} alt="Sticker" className="w-full h-full object-contain" />
                    </div>
                  ) : isLiveMessage ? (
                    <div className="bg-[#1DB954]/20 border border-[#1DB954]/50 text-white p-3 rounded-2xl w-64 max-w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Headphones className="w-5 h-5 text-[#1DB954]" />
                        <span className="font-bold text-sm">Sesi Dengarkan Bersama</span>
                      </div>
                      <p className="text-xs text-zinc-300 mb-3">Ikut mendengarkan lagu secara real-time di grup ini.</p>
                      {liveHostId === user?.id ? (
                        <button disabled className="w-full py-2 bg-[#1DB954]/20 text-white/50 font-bold text-xs rounded-xl cursor-not-allowed">
                          Anda adalah Host
                        </button>
                      ) : isPartyActive ? (
                        <button 
                          onClick={leaveParty}
                          className="w-full py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition font-bold text-xs rounded-xl"
                        >
                          Keluar Party
                        </button>
                      ) : (
                        <button 
                          onClick={() => setParty(roomId, false)}
                          className="w-full py-2 bg-[#1DB954] text-black hover:scale-105 transition font-bold text-xs rounded-xl shadow-lg shadow-[#1DB954]/20"
                        >
                          Gabung Sesi
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-[#1DB954] text-black rounded-br-sm'
                        : 'bg-[#282828] text-white rounded-bl-sm'
                    }`}>
                      {msg.is_deleted ? (
                        <p className="text-[15px] italic opacity-60">Pesan ini telah dihapus</p>
                      ) : (
                        <p className="text-[15px] leading-relaxed break-words">{displayText}</p>
                      )}
                      {!msg.is_deleted && msg.is_edited && (
                        <span className="text-[10px] ml-2 opacity-50 block mt-1">(diedit)</span>
                      )}
                    </div>
                  )}
                    </div>
                  </div>
                  
                  {/* Reactions */}
                  {msg.message_reactions && msg.message_reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {Object.entries(
                        msg.message_reactions.reduce((acc, curr) => {
                          acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([emoji, count]) => (
                        <div key={emoji} className="bg-[#282828] border border-white/10 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1 cursor-pointer" onClick={() => handleReact(msg.id, emoji)}>
                          <span>{emoji}</span>
                          <span className="text-zinc-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className={`fixed bottom-0 left-0 right-0 z-20 bg-[#121212]/95 backdrop-blur-md px-4 pt-3 border-t border-white/5 md:pb-6 transition-all duration-300 lg:static lg:pb-3 lg:pt-2 ${usePlayerStore((state) => state.currentTrack) ? 'pb-[156px]' : 'pb-[76px]'}`}>
        
        {replyingTo && (
          <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between bg-[#2a2a2a] p-3 rounded-xl border-l-4 border-[#1DB954]">
            <div className="flex-1 min-w-0">
              <p className="text-[#1DB954] text-xs font-bold mb-0.5">Membalas {replyingTo.sender_id === user?.id ? 'Anda' : (roomDetails?.members.find(m => m.id === replyingTo.sender_id)?.name || 'Seseorang')}</p>
              <p className="text-zinc-400 text-sm truncate">{replyingTo.text.startsWith('$$SONG::') ? 'Lagu' : replyingTo.text.startsWith('$$STICKER::') ? 'Stiker' : replyingTo.is_deleted ? 'Pesan ini telah dihapus' : replyingTo.text}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-zinc-400 hover:text-white shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {editingMessage && (
          <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between bg-[#2a2a2a] p-3 rounded-xl border-l-4 border-blue-500">
            <div className="flex-1 min-w-0">
              <p className="text-blue-500 text-xs font-bold mb-0.5">Mengedit pesan</p>
              <p className="text-zinc-400 text-sm truncate">{editingMessage.text.startsWith('$$SONG::') ? 'Lagu' : editingMessage.text.startsWith('$$STICKER::') ? 'Stiker' : editingMessage.text}</p>
            </div>
            <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="p-1 text-zinc-400 hover:text-white shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="flex-1 bg-[#2a2a2a] rounded-full flex items-center px-4 py-1 focus-within:ring-1 focus-within:ring-[#1DB954]/50 transition">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white text-[15px] placeholder:text-zinc-500 outline-none py-2"
            />
            <button 
              type="button" 
              onClick={() => setShowShareModal(true)}
              className="text-zinc-500 hover:text-white transition p-2"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className={`transition p-2 ${showStickerPicker ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          {newMessage.trim() && (
            <button
              type="submit"
              disabled={sending}
              className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black hover:scale-105 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
      
      {/* Modals */}
      <ShareSongModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSelectSong={(song) => {
          setShowShareModal(false);
          const coverUrl = song.thumbnails?.[0]?.url || '';
          const text = `$$SONG::${song.videoId}::${song.name}::${song.artist?.name || 'Unknown'}::${coverUrl}`;
          setNewMessage(text);
          // Auto send trick using a hidden mechanism or just let the user send it. 
          // Since handleSend uses the state, we can't await it easily here.
          // We'll set it in state and the user can just press send, or we trigger it.
          // Better to trigger sending manually.
          setTimeout(() => {
            const formEvent = { preventDefault: () => {} } as React.FormEvent;
            // Let's just create a quick direct DB send for songs to avoid state sync issues
            setSending(true);
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, { id: tempId, text, sender_id: user?.id || '', created_at: new Date().toISOString() }]);
            db.sendMessage(roomId, text).then(sent => {
              if (sent) setMessages(prev => prev.map(m => m.id === tempId ? sent as Message : m));
              setSending(false);
              setNewMessage('');
            });
          }, 0);
        }}
      />
      
      <StickerPicker
        isOpen={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={(url) => {
          setShowStickerPicker(false);
          const text = `$$STICKER::${url}`;
          
          setTimeout(() => {
            setSending(true);
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, { id: tempId, text, sender_id: user?.id || '', created_at: new Date().toISOString() }]);
            db.sendMessage(roomId, text).then(sent => {
              if (sent) setMessages(prev => prev.map(m => m.id === tempId ? sent as Message : m));
              setSending(false);
            });
          }, 0);
        }}
      />

      <MessageContextMenu 
        isOpen={!!activeMessageId} 
        onClose={() => setActiveMessageId(null)} 
        messageId={activeMessageId!} 
        isOwner={messages.find(m => m.id === activeMessageId)?.sender_id === user?.id}
        onReact={handleReact} 
        onReply={(id) => {
          const m = messages.find(msg => msg.id === id);
          if (m) { setReplyingTo(m); setEditingMessage(null); }
        }}
        onEdit={(id) => {
          const m = messages.find(msg => msg.id === id);
          if (m) { 
            setEditingMessage(m); 
            setReplyingTo(null); 
            setNewMessage(m.text.startsWith('$$') ? '' : m.text);
          }
        }}
        onDelete={async (id) => {
          const success = await db.deleteMessage(id);
          if (success) {
             setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, text: 'Pesan ini telah dihapus' } : m));
          }
        }}
        isSticker={messages.find(m => m.id === activeMessageId)?.text.startsWith('$$STICKER::')}
        onSaveSticker={async (id) => {
          const m = messages.find(msg => msg.id === id);
          if (m && m.text.startsWith('$$STICKER::')) {
            const url = m.text.split('::')[1];
            if (url) {
              const saved = await db.saveSticker(url);
              if (saved) {
                alert("Stiker berhasil disimpan ke koleksi Anda!");
              } else {
                alert("Gagal menyimpan stiker atau stiker sudah ada di koleksi Anda.");
              }
            }
          }
        }}
      />
      {/* Group Details Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181818] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Detail Grup</h2>
              <button onClick={() => setShowGroupModal(false)} className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center mb-3">
                  {displayAvatar ? (
                    <Image src={displayAvatar} alt={displayName} width={80} height={80} className="object-cover" />
                  ) : (
                    <span className="text-white font-bold text-2xl">{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-white font-bold text-xl">{displayName}</h3>
                <p className="text-zinc-400 text-sm">{roomDetails?.members.length} Anggota</p>
              </div>

              <h4 className="text-white font-medium mb-3">Anggota Grup</h4>
              <div className="space-y-3">
                {roomDetails?.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      {member.avatar_url ? (
                        <Image src={member.avatar_url} alt={member.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{member.name}</p>
                      {member.id === user?.id && <p className="text-xs text-[#1DB954]">Anda</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
