'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, User, Crown, Clock, AlertTriangle, Edit, Save, X } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editingUser.full_name,
          email: editingUser.email,
          is_premium: editingUser.is_premium,
          is_admin: editingUser.is_admin
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan perubahan pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Manajemen Pengguna</h1>
          <p className="text-white/50">Edit profil pengguna, atur role, dan kelola langganan.</p>
        </div>
      </div>

      <div className="bg-[#1C1C1E] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 bg-[#111111]/50 flex items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full bg-[#2A2A2A] text-white pl-12 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-4" />
              <p className="text-white/50">Memuat database pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <AlertTriangle className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Tidak ada data</h3>
              <p className="text-white/50">Data pengguna tidak ditemukan.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 bg-[#1A1A1A]">
                  <th className="px-6 py-4 text-white/40 font-medium text-xs uppercase tracking-wider">Pengguna</th>
                  <th className="px-6 py-4 text-white/40 font-medium text-xs uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-white/40 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-white/40 font-medium text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 relative">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.full_name || 'User'} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 font-bold text-sm">
                              {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.full_name || 'Tanpa Nama'}</p>
                          <p className="text-white/50 text-xs">{u.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                      }`}>
                        {u.is_admin ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.is_premium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'
                      }`}>
                        {u.is_premium ? <Crown className="w-3 h-3" /> : null}
                        {u.is_premium ? 'PREMIUM' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs inline-flex items-center gap-2 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Pengguna</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 text-white/50 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-white/50 text-sm font-medium mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editingUser.full_name || ''} 
                  onChange={e => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5"
                />
              </div>

              <div>
                <label className="block text-white/50 text-sm font-medium mb-1">Email</label>
                <input 
                  type="text" 
                  value={editingUser.email || ''} 
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2A2A2A] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold text-sm">Status Premium</p>
                  <p className="text-white/50 text-xs">Akses semua fitur berbayar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={editingUser.is_premium || false} onChange={e => setEditingUser({...editingUser, is_premium: e.target.checked})} />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2A2A2A] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-bold text-sm">Role Admin</p>
                  <p className="text-white/50 text-xs">Berikan akses ke Panel Admin ini</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={editingUser.is_admin || false} onChange={e => setEditingUser({...editingUser, is_admin: e.target.checked})} />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 mt-4"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
