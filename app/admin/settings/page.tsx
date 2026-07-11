'use client';

import { useState, useEffect } from 'react';
import { Send, Bell, Trash2, Loader2, Clock, Upload, QrCode } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [uploadingQris, setUploadingQris] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchHistory();
    fetchQris();
  }, []);

  const fetchQris = async () => {
    const { data } = supabase.storage.from('qris').getPublicUrl('main-qris.png');
    // Add timestamp to prevent caching if needed, but let's just use the url
    if (data?.publicUrl) {
      setQrisUrl(data.publicUrl + '?t=' + Date.now());
    }
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQris(true);
    try {
      const { error } = await supabase.storage
        .from('qris')
        .upload('main-qris.png', file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      alert('QRIS berhasil diperbarui!');
      fetchQris();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengunggah QRIS: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploadingQris(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('global_notifications')
        .insert([{ title, message }]);

      if (error) throw error;

      alert('Notifikasi berhasil disiarkan ke semua pengguna!');
      setTitle('');
      setMessage('');
      fetchHistory(); // Refresh daftar riwayat
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim notifikasi.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus notifikasi ini dari riwayat?')) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('global_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(history.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus notifikasi.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Pengaturan & Broadcast</h1>
        <p className="text-white/50 mb-8">Kirim pengumuman atau pembaruan yang akan masuk ke lonceng notifikasi semua pengguna.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form Broadcast */}
        <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Buat Notifikasi Baru</h2>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">Judul Pengumuman</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Update Versi 2.0!"
                className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">Isi Pesan</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan detail informasi yang ingin disampaikan..."
                rows={4}
                className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Kirim ke Semua Pengguna
            </button>
          </form>
        </div>

        {/* History Notifications */}
        <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-6">Riwayat Notifikasi</h2>
          
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="py-10 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin mb-2" />
                <p className="text-white/50 text-sm">Memuat riwayat...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-white/50 text-sm">Belum ada pengumuman yang dikirim.</p>
              </div>
            ) : (
              history.map((notif) => (
                <div key={notif.id} className="bg-[#2A2A2A] rounded-2xl p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold">{notif.title}</h3>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      disabled={deletingId === notif.id}
                      className="text-white/20 hover:text-red-500 transition-colors p-1"
                    >
                      {deletingId === notif.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-white/70 text-sm mb-3">{notif.message}</p>
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(notif.created_at).toLocaleString('id-ID', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* QRIS Settings */}
        <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Pengaturan QRIS Premium</h2>
          </div>
          
          <p className="text-white/60 text-sm mb-6">
            Unggah gambar QRIS yang akan ditampilkan kepada pengguna saat mereka membeli paket Premium.
          </p>

          <div className="flex flex-col items-center gap-4">
            {qrisUrl && (
              <div className="w-48 h-48 bg-white rounded-xl p-2 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
              </div>
            )}
            
            <label className="w-full bg-[#2A2A2A] hover:bg-[#333] border-2 border-dashed border-white/20 hover:border-yellow-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-white/50 mb-2" />
              <span className="text-white font-medium text-sm">
                {uploadingQris ? 'Mengunggah...' : 'Klik untuk Unggah Gambar QRIS'}
              </span>
              <span className="text-white/40 text-xs mt-1">Format: JPG, PNG</span>
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleQrisUpload}
                disabled={uploadingQris}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
