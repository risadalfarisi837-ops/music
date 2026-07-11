'use client';

import { X, Reply, Edit2, Trash2 } from 'lucide-react';

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  isOwner: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  isSticker?: boolean;
  onSaveSticker?: (messageId: string) => void;
}

const EMOJIS = ['❤️', '😂', '😢', '🔥', '👍', '👎'];

export default function MessageContextMenu({ isOpen, onClose, messageId, isOwner, onReact, onReply, onEdit, onDelete, isSticker, onSaveSticker }: MessageContextMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#181818] w-full max-w-sm sm:rounded-2xl rounded-t-2xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Tindakan Pesan</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex items-center justify-center gap-4 border-b border-white/10">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                onReact(messageId, emoji);
                onClose();
              }}
              className="text-3xl hover:scale-125 hover:-translate-y-2 transition-transform duration-200"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex flex-col p-2">
          <button 
            onClick={() => { onReply(messageId); onClose(); }}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-white/10 rounded-lg transition text-white"
          >
            <Reply className="w-5 h-5" />
            <span className="font-medium">Balas</span>
          </button>
          
          {isOwner && (
            <>
              <button 
                onClick={() => { onEdit(messageId); onClose(); }}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-white/10 rounded-lg transition text-white"
              >
                <Edit2 className="w-5 h-5" />
                <span className="font-medium">Edit</span>
              </button>
              <button 
                onClick={() => { onDelete(messageId); onClose(); }}
                className="flex items-center gap-3 w-full p-3 text-left hover:bg-white/10 rounded-lg transition text-red-400"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">Hapus</span>
              </button>
            </>
          )}

          {isSticker && onSaveSticker && (
            <button 
              onClick={() => { onSaveSticker(messageId); onClose(); }}
              className="flex items-center gap-3 w-full p-3 text-left hover:bg-white/10 rounded-lg transition text-yellow-400"
            >
              <span className="text-xl">⭐</span>
              <span className="font-medium">Simpan Stiker</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
