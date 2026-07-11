'use client';

import { X, BellOff, Bell, Activity, Share2, MessageSquare, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: ModalProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#1C1C1E] rounded-t-3xl z-[999] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-white/10 sticky top-0 bg-[#1C1C1E] z-10">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg">Notifikasi</h3>
                <p className="text-white/50 text-xs">Pembaruan & Pengumuman</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-white/60" />
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto pb-8">
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white/50 text-sm">Memuat...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <BellOff className="w-12 h-12 text-white/20 mb-3" />
                  <h3 className="text-white font-bold mb-1">Belum ada notifikasi</h3>
                  <p className="text-white/50 text-sm">Pengumuman dari admin akan muncul di sini.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="relative p-5 border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="text-white font-bold text-[15px] leading-tight">{notif.title}</h3>
                            <span className="text-white/40 text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                              {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ActivityModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Aktivitas Teman</h2>
        <p className="text-white/60 text-sm mb-6">Hubungkan akun sosial Anda untuk melihat apa yang sedang didengarkan teman-teman Anda secara real-time.</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-green-500/20 hover:bg-green-500/30 transition-colors">
          Hubungkan Akun (Segera)
        </button>
      </div>
    </div>
  );
}

export function ShareModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert('Tautan aplikasi berhasil disalin!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Undang Teman</h2>
        <p className="text-white/60 text-sm mb-6">Bagikan Stream Beats ke teman Anda dan dengarkan musik bersama.</p>
        
        <div className="flex w-full gap-3">
          <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors">
            <Copy className="w-4 h-4" /> Salin Link
          </button>
        </div>
      </div>
    </div>
  );
}

export function MessagesModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Pesan & Chat</h2>
        <p className="text-white/60 text-sm mb-6">Mulai percakapan dengan teman atau bagikan playlist secara langsung di sini.</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 transition-colors">
          Mulai Percakapan
        </button>
      </div>
    </div>
  );
}
