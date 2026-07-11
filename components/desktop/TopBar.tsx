'use client';

import { ChevronLeft, ChevronRight, Home, Search, Bell, Users, Crown, MessageCircle, Trophy, Plus, Check } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, usePartyStore, usePlayerStore } from '@/lib/store';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, savedAccounts } = useAuthStore();
  const partyStore = usePartyStore();
  const setRightSidebarMode = usePlayerStore(state => state.setRightSidebarMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    import('@/lib/db').then(({ db }) => {
      db.getGlobalNotifications().then(setNotifications);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-black w-full shrink-0">
      {/* Navigation (Left) */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => router.forward()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Search & Home (Center) */}
      <div className="flex items-center gap-2 flex-1 max-w-xl mx-4">
        <button 
          onClick={() => router.push('/')}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 hover:scale-105 transition-all shrink-0"
        >
          <Home className="w-6 h-6 text-white" />
        </button>
        
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-white transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="What do you want to play?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-zinc-800 hover:bg-zinc-700/80 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full pl-12 pr-6 text-white placeholder:text-zinc-400 transition-all font-medium text-sm"
          />
        </form>
      </div>

      {/* Profile & Extras (Right) */}
      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={() => router.push('/premium')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-yellow-400 hover:text-yellow-300 transition-colors"
          title="Premium"
        >
          <Crown className="w-4 h-4" />
          <span className="text-xs font-bold hidden xl:inline">Premium</span>
        </button>

        <button 
          onClick={() => router.push('/messages')}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${pathname.startsWith('/messages') ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
          title="Pesan"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        <button 
          onClick={() => {
            if (!user?.isPremium) {
              router.push('/premium');
              return;
            }
            if (partyStore.roomId) {
              router.push(`/party/${partyStore.roomId}`);
            } else {
              const newRoomId = Math.random().toString(36).substring(2, 9);
              partyStore.setParty(newRoomId, true);
              router.push(`/party/${newRoomId}`);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Dengar Bareng (Party)"
        >
          <Users className="w-5 h-5" />
        </button>
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showNotifications ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          {showNotifications && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-bold text-white">Notifikasi</h3>
                </div>
                <div className="flex flex-col max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif: any) => (
                      <div key={notif.id} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                        {notif.title && <p className="font-semibold text-white mb-1">{notif.title}</p>}
                        {notif.message && <p className="text-sm text-zinc-300">{notif.message}</p>}
                        {notif.created_at && (
                          <span className="text-xs text-zinc-500 mt-2 block">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center min-h-[150px] text-zinc-500">
                      <Bell className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Belum ada notifikasi baru.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border-2 border-black hover:scale-105 transition-transform relative z-10"
          >
            {isAuthenticated && user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="Profile" width={32} height={32} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-black font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </button>
          
          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <>
              {/* Invisible overlay */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-1">
                {/* Saved Accounts */}
                {savedAccounts.length > 1 && (
                  <>
                    <p className="px-4 pt-2 pb-1 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Akun Tersimpan</p>
                    {savedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors ${acc.id === user?.id ? 'text-white bg-white/5' : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'}`}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-700 relative shrink-0">
                          {acc.avatarUrl ? (
                            <Image src={acc.avatarUrl} alt={acc.name} width={24} height={24} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{acc.name?.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <span className="flex-1 truncate">{acc.name}</span>
                        {acc.id === user?.id && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      </div>
                    ))}
                    <div className="h-px bg-zinc-800/50 my-1" />
                  </>
                )}

                <button 
                  onClick={() => { setShowProfileMenu(false); router.push('/auth'); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors flex items-center gap-3"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  Tambah akun
                </button>
                <div className="h-px bg-zinc-800/50 my-1" />
                <button 
                  onClick={() => { setShowProfileMenu(false); router.push('/settings'); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors"
                >
                  Profil
                </button>
                <button 
                  onClick={() => { setShowProfileMenu(false); router.push('/premium'); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors"
                >
                  Berlangganan
                </button>
                <button 
                  onClick={() => { setShowProfileMenu(false); setRightSidebarMode('leaderboard'); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors flex items-center gap-3"
                >
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Top Pendengar
                </button>
                <div className="h-px bg-zinc-800/50 my-1" />
                <button 
                  onClick={() => { setShowProfileMenu(false); logout(); router.push('/'); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors"
                >
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
