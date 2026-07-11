'use client';

import { useState, useEffect } from 'react';
import { User, Crown, AlertCircle, MessageSquare, ArrowRight, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminStatsPage() {
  const [stats, setStats] = useState({ total: 0, premium: 0, free: 0, admins: 0 });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      const users = data || [];
      
      setStats({
        total: users.length,
        premium: users.filter(u => u.is_premium).length,
        free: users.filter(u => !u.is_premium).length,
        admins: users.filter(u => u.is_admin).length,
      });

      // Filter for top users (premium + admins as priority, or random top)
      const top = [...users].sort((a, b) => (b.is_premium ? 1 : 0) - (a.is_premium ? 1 : 0)).slice(0, 5);
      setTopUsers(top);

      // Filter for recent
      const recent = [...users].sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()).slice(0, 5);
      setRecentUsers(recent);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Statistik Aplikasi</h1>
        <p className="text-white/50 mb-8">Ringkasan performa dan metrik pengguna Stream Beats.</p>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-8 h-8 text-white/40 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total User Card */}
              <div className="bg-[#111111] p-6 rounded-2xl border border-blue-500/20 flex flex-col justify-center h-28 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total User</p>
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              {/* Premium Member Card */}
              <div className="bg-[#111111] p-6 rounded-2xl border border-yellow-500/20 flex flex-col justify-center h-28 relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <Crown className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Premium User</p>
                    <p className="text-2xl font-black text-white">{stats.premium}</p>
                  </div>
                </div>
              </div>
              
              {/* Free Member Card */}
              <div className="bg-[#111111] p-6 rounded-2xl border border-green-500/20 flex flex-col justify-center h-28 relative overflow-hidden group hover:border-green-500/40 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Free User</p>
                    <p className="text-2xl font-black text-white">{stats.free}</p>
                  </div>
                </div>
              </div>
              
              {/* Admins Card */}
              <div className="bg-[#111111] p-6 rounded-2xl border border-red-500/20 flex flex-col justify-center h-28 relative overflow-hidden group hover:border-red-500/40 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Admin User</p>
                    <p className="text-2xl font-black text-white">{stats.admins}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top User List */}
              <div className="bg-[#111111] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Top User
                  </h2>
                  <Link href="/admin/users" className="text-blue-400 text-xs font-bold flex items-center gap-1 hover:text-blue-300">
                    Lihat Semua <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {topUsers.map((u, i) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold w-4 text-center ${i < 3 ? 'text-yellow-500' : 'text-white/40'}`}>
                          #{i + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative shrink-0">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.full_name || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white/50 text-sm">
                              {(u.full_name || 'U').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.full_name || 'No Name'}</p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${u.is_premium ? 'bg-yellow-500/10 text-yellow-500' : 'bg-white/5 text-white/50'}`}>
                        {u.is_premium ? 'PREMIUM' : 'FREE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent User List */}
              <div className="bg-[#111111] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    User Terbaru
                  </h2>
                  <Link href="/admin/users" className="text-blue-400 text-xs font-bold flex items-center gap-1 hover:text-blue-300">
                    Lihat Semua <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative shrink-0">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.full_name || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white/50 text-sm bg-gradient-to-br from-green-500/20 to-blue-500/20 text-green-400">
                              {(u.full_name || 'U').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.full_name || 'No Name'}</p>
                          <p className="text-white/40 text-[10px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-500/10 text-green-400">
                        NEW
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
