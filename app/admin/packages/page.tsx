'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Crown, Save, X, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PremiumPackage {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  benefits: string[];
  is_active: boolean;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formBenefits, setFormBenefits] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('premium_packages')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormDuration('');
    setFormBenefits('');
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (pkg: PremiumPackage) => {
    setFormName(pkg.name);
    setFormPrice(pkg.price.toString());
    setFormDuration(pkg.duration_days.toString());
    setFormBenefits(pkg.benefits.join('\n'));
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice || !formDuration) return;
    setSaving(true);

    const benefitsArray = formBenefits.split('\n').filter(b => b.trim());

    try {
      if (editingId) {
        const { error } = await supabase.from('premium_packages').update({
          name: formName,
          price: Number(formPrice),
          duration_days: Number(formDuration),
          benefits: benefitsArray,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('premium_packages').insert({
          name: formName,
          price: Number(formPrice),
          duration_days: Number(formDuration),
          benefits: benefitsArray,
          is_active: true,
        });
        if (error) throw error;
      }

      await fetchPackages();
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan paket.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: PremiumPackage) => {
    try {
      const { error } = await supabase.from('premium_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id);
      if (error) throw error;
      setPackages(packages.map(p => p.id === pkg.id ? { ...p, is_active: !p.is_active } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Yakin ingin menghapus paket ini?')) return;
    try {
      const { error } = await supabase.from('premium_packages').delete().eq('id', id);
      if (error) throw error;
      setPackages(packages.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus paket.');
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Paket Premium</h1>
          <p className="text-white/50">Atur harga, durasi, dan benefit paket langganan.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Buat Paket Baru
        </button>
      </div>

      {/* Packages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-[#1C1C1E] rounded-3xl p-12 border border-white/5 text-center">
          <Crown className="w-12 h-12 text-yellow-500/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Belum Ada Paket</h3>
          <p className="text-white/50">Buat paket pertama Anda dengan tombol di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className={`bg-[#1C1C1E] rounded-3xl border overflow-hidden flex flex-col transition-all ${pkg.is_active ? 'border-yellow-500/20' : 'border-white/5 opacity-60'}`}>
              {/* Header */}
              <div className="p-6 pb-4 relative">
                {pkg.is_active && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500" />}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pkg.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                    {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{pkg.name}</h3>
                <p className="text-yellow-400 text-2xl font-black">{formatRupiah(pkg.price)}</p>
                <p className="text-white/40 text-xs mt-1">{pkg.duration_days} hari masa aktif</p>
              </div>

              {/* Benefits */}
              <div className="px-6 pb-4 flex-1">
                <ul className="space-y-2">
                  {pkg.benefits.map((b, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">&#10003;</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-white/5 flex gap-2">
                <button onClick={() => openEditForm(pkg)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => toggleActive(pkg)} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-sm transition-colors">
                  {pkg.is_active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => deletePackage(pkg.id)} className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 text-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Paket' : 'Buat Paket Baru'}</h2>
              <button onClick={resetForm} className="p-2 text-white/50 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-white/50 text-sm font-medium mb-1">Nama Paket</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="misal: Premium 1 Bulan"
                  className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-sm font-medium mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="49000"
                    className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-sm font-medium mb-1">Durasi (Hari)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    placeholder="30"
                    className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 text-sm font-medium mb-1">Benefit (satu per baris)</label>
                <textarea
                  value={formBenefits}
                  onChange={e => setFormBenefits(e.target.value)}
                  placeholder={"Tanpa Iklan\nKualitas Audio Tinggi\nAkses Radio Eksklusif"}
                  rows={4}
                  className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 border border-white/5 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3.5 rounded-xl transition-all hover:brightness-110 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {editingId ? 'Simpan Perubahan' : 'Buat Paket'}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
