'use client';

import { X, User, UserX, Ban } from 'lucide-react';

interface ChatContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onViewProfile: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  onBlock: (userId: string) => void;
}

export default function ChatContextMenu({ isOpen, onClose, user, onViewProfile, onUnfollow, onBlock }: ChatContextMenuProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#181818] w-full max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-white font-bold text-lg">{user.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2">
          <button 
            onClick={() => { onViewProfile(user.id); onClose(); }}
            className="w-full flex items-center gap-4 p-4 text-left text-white hover:bg-white/10 rounded-xl transition"
          >
            <User className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Lihat Profil</span>
          </button>
          
          <button 
            onClick={() => { onUnfollow(user.id); onClose(); }}
            className="w-full flex items-center gap-4 p-4 text-left text-white hover:bg-white/10 rounded-xl transition"
          >
            <UserX className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Hapus Pertemanan (Unfollow)</span>
          </button>
          
          <button 
            onClick={() => { onBlock(user.id); onClose(); }}
            className="w-full flex items-center gap-4 p-4 text-left text-red-500 hover:bg-red-500/10 rounded-xl transition"
          >
            <Ban className="w-5 h-5 text-red-500" />
            <span className="font-medium">Blokir Pengguna</span>
          </button>
        </div>
      </div>
    </div>
  );
}
