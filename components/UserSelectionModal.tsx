'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { db } from '@/lib/db';
import Image from 'next/image';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGroup: boolean;
  onSelectUser: (userId: string) => void;
  onCreateGroup: (name: string, userIds: string[]) => void;
}

export default function UserSelectionModal({ isOpen, onClose, isGroup, onSelectUser, onCreateGroup }: UserSelectionModalProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setUsers([]);
      setSelectedUsers([]);
      setGroupName('');
    }
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.trim().length < 2) {
        setUsers([]);
        return;
      }
      setLoading(true);
      const res = await db.searchUsers(query);
      setUsers(res);
      setLoading(false);
    };
    
    const timeout = setTimeout(search, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (!isGroup) {
      onSelectUser(id);
      return;
    }
    
    if (selectedUsers.includes(id)) {
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
    } else {
      setSelectedUsers(prev => [...prev, id]);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0 || !groupName.trim()) return;
    setCreating(true);
    await onCreateGroup(groupName, selectedUsers);
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{isGroup ? 'Buat Grup' : 'Pesan Baru'}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {isGroup && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Nama grup..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
              />
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
              </div>
            ) : users.length > 0 ? (
              users.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => toggleSelect(user.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${selectedUsers.includes(user.id) ? 'bg-[#1DB954]/20 border border-[#1DB954]/50' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.name}</p>
                  </div>
                  {isGroup && (
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUsers.includes(user.id) ? 'bg-[#1DB954] border-[#1DB954]' : 'border-zinc-500'}`}>
                      {selectedUsers.includes(user.id) && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                    </div>
                  )}
                </div>
              ))
            ) : query.length >= 2 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">Tidak ditemukan</div>
            ) : (
              <div className="text-center py-8 text-zinc-600 text-sm">Ketik nama untuk mencari</div>
            )}
          </div>
        </div>

        {isGroup && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim() || creating}
              className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating && <Loader2 className="w-5 h-5 animate-spin" />}
              Buat Grup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
