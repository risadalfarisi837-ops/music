'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle, CreditCard, Image as ImageIcon, Search } from 'lucide-react';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          user:profiles(*),
          package:premium_packages(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (transaction: any, status: 'approved' | 'rejected') => {
    if (!confirm(`Anda yakin ingin ${status === 'approved' ? 'MENYETUJUI' : 'MENOLAK'} transaksi ini?`)) return;
    
    setProcessingId(transaction.id);
    try {
      // 1. Update status transaksi
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transaction.id);

      if (txError) throw txError;

      // 2. Jika approved, berikan premium ke user
      if (status === 'approved') {
        const packageDays = transaction.package.duration_days;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + packageDays);

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
          })
          .eq('id', transaction.user_id);

        if (profileError) throw profileError;
      }

      alert(`Transaksi berhasil di-${status}!`);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Kelola Transaksi</h1>
          <p className="text-white/50">Tinjau bukti pembayaran dan aktifkan paket Premium pengguna.</p>
        </div>
      </div>

      <div className="bg-[#1C1C1E] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-500" />
            Daftar Transaksi Terbaru
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Pengguna</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Paket</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Bukti Transfer</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Waktu</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/30 mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {tx.user?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tx.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-white">{tx.user?.full_name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.user?.full_name || 'No Name'}</p>
                          <p className="text-xs text-white/40">{tx.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{tx.package?.name}</p>
                      <p className="text-xs text-yellow-400">Rp {tx.package?.price?.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="p-4">
                      <a 
                        href={tx.proof_image_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-bold bg-blue-500/10 px-3 py-1.5 rounded-full w-fit transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Lihat Bukti
                      </a>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white/70">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        tx.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {tx.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(tx, 'approved')}
                            disabled={processingId === tx.id}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white p-2 rounded-xl transition-colors disabled:opacity-50"
                            title="Setujui Pembayaran"
                          >
                            {processingId === tx.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => handleAction(tx, 'rejected')}
                            disabled={processingId === tx.id}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-colors disabled:opacity-50"
                            title="Tolak Pembayaran"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
