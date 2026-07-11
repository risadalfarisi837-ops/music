'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, Lock, Key, Users, BarChart3, Settings as SettingsIcon, LayoutDashboard, LogOut, Crown, Search, ChevronDown, CreditCard, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  
  // State untuk autentikasi tambahan
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pendingTxCount, setPendingTxCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  const supabase = createClient();
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Fetch initial count
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (!error && count !== null) {
        setPendingTxCount(count);
      }
    };
    
    fetchCount();
    
    // Subscribe to changes
    const channel = supabase.channel('admin-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
         fetchCount();
      })
      .subscribe();
      
    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, supabase]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Login Diperlukan</h1>
        <p className="text-white/60 mb-8">Anda harus login terlebih dahulu untuk mengakses halaman admin.</p>
        <button 
          onClick={() => router.push('/auth/login')}
          className="bg-white text-black font-bold px-8 py-3 rounded-full"
        >
          Login Sekarang
        </button>
      </div>
    );
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setAdminPassword('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6">
        <div className="bg-[#1C1C1E] p-8 rounded-3xl w-full max-w-md border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
          
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Terkunci</h1>
          <p className="text-white/60 text-center text-sm mb-8">Masukkan password admin untuk mengakses panel kontrol.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Masukkan Password..."
                className={`w-full bg-[#2A2A2A] text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 ${
                  passwordError ? 'ring-2 ring-red-500/50 border-red-500' : 'focus:ring-white/20'
                }`}
                autoFocus
              />
            </div>
            
            {passwordError && (
              <p className="text-red-400 text-sm text-center animate-pulse">Password salah, coba lagi!</p>
            )}
            
            <button 
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-colors"
            >
              Buka Kunci
            </button>
            <button 
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-white/50 text-sm py-2 hover:text-white transition-colors"
            >
              Kembali ke Beranda
            </button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
    { name: 'Statistik', href: '/admin/stats', icon: BarChart3 },
    { name: 'Transaksi', href: '/admin/transactions', icon: CreditCard },
    { name: 'Paket Premium', href: '/admin/packages', icon: Crown },
    { name: 'Pengaturan', href: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex relative">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Admin Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col
        transform transition-transform duration-300 ease-in-out md:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* User Profile Block */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 bg-[#111111] p-3 rounded-2xl border border-white/5">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Admin" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-white">A</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-sm font-bold truncate">{user?.name || 'Admin'}</h2>
              <p className="text-white/40 text-xs truncate">{user?.email || 'admin@streambeats.com'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-white text-xs font-bold">StreamBeats Admin</span>
            <button className="text-white/40 text-[10px] uppercase font-bold hover:text-white transition-colors">Kelola Akses</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-[#111111] text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white/20 border border-white/5 transition-all"
            />
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl text-white font-bold text-sm">
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-1">
          {menuItems.slice(1).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-white/50 hover:text-white group">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'group-hover:text-white/80'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.name}</span>
                  {item.name === 'Transaksi' && pendingTxCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                      {pendingTxCount}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white/40" />
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 px-3 py-2 text-red-500/80 hover:text-red-400 transition-colors w-full rounded-xl hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 bg-[#0A0A0A] flex flex-col h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#111111] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-white/50 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          </div>
          <button onClick={() => router.push('/')} className="p-2 -mr-2 text-white/50 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sub-page Content */}
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
