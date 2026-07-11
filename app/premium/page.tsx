'use client';

import { useAuthStore } from '@/lib/store';
import { ArrowLeft, CheckCircle2, Crown, Zap, Users, Download, ShieldCheck, Loader2, Upload, ImageIcon, X, VolumeX, Shuffle, Headphones, MonitorPlay, Sparkles, AudioLines } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PremiumPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [checkoutPkg, setCheckoutPkg] = useState<any | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingTx, setPendingTx] = useState<any | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchPackagesAndStatus = async () => {
      try {
        const { data: pkgData, error: pkgError } = await supabase
          .from('premium_packages')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });
        
        if (pkgError) throw pkgError;
        setPackages(pkgData || []);

        if (isAuthenticated && user?.id) {
          // Check for pending transaction
          const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .maybeSingle();
            
          if (txData) {
            setPendingTx(txData);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackagesAndStatus();
  }, [supabase, isAuthenticated, user?.id]);

  const handleSelectPackage = async (pkg: any) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // Get QRIS Image
    const { data } = supabase.storage.from('qris').getPublicUrl('main-qris.png');
    if (data?.publicUrl) {
      setQrisUrl(data.publicUrl + '?t=' + Date.now());
    }
    
    setCheckoutPkg(pkg);
    setProofFile(null);
  };

  const handleDownloadQris = async () => {
    if (!qrisUrl) return;
    try {
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'QRIS_StreamBeats.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QRIS:', err);
      alert('Gagal mengunduh QRIS. Anda bisa mengambil screenshot layar ini.');
    }
  };

  const handleSubmitPayment = async () => {
    if (!proofFile || !checkoutPkg || !user) return;
    setSubmitting(true);

    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload proof
      const { error: uploadError } = await supabase.storage
        .from('payments')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payments')
        .getPublicUrl(filePath);

      // 3. Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          package_id: checkoutPkg.id,
          status: 'pending',
          proof_image_url: publicUrl
        }]);

      if (txError) throw txError;

      alert('Bukti pembayaran berhasil dikirim! Menunggu konfirmasi Admin.');
      setCheckoutPkg(null);
      
      // Refresh status
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (txData) setPendingTx(txData);

    } catch (err: any) {
      console.error(err);
      alert('Gagal mengirim bukti pembayaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimFreeTrial = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    
    if (user.isPremium) {
      alert("Anda sudah memiliki akses Premium.");
      return;
    }
    
    setSubmitting(true);
    try {
      // Check if user already claimed trial
      const { data: existingTrial } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'free_trial')
        .maybeSingle();
        
      if (existingTrial) {
        alert("Anda sudah pernah mengklaim penawaran Premium 1 Bulan Gratis sebelumnya.");
        setSubmitting(false);
        return;
      }
      
      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Record trial claim in transactions
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          status: 'free_trial'
        }]);
        
      alert("Selamat! Anda sekarang menikmati Premium 1 Bulan Gratis.");
      updateUser({ ...user, isPremium: true });
      window.location.reload();
    } catch (err: any) {
      console.error("Error claiming trial:", err);
      alert("Gagal mengklaim Premium: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      <main className="min-h-screen bg-[#000000] pb-24 font-sans selection:bg-green-500/30">
        <div className="sticky top-0 z-30 flex items-center px-4 h-16 bg-transparent">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-start">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="relative pt-4 pb-8 px-6 bg-gradient-to-b from-[#2a2a2a] to-black">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
            {/* Abstract shapes or colors to mimic album covers */}
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-600/40 blur-[80px] rounded-full mix-blend-screen" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-green-500/30 blur-[80px] rounded-full mix-blend-screen" />
          </div>

          <div className="relative z-10 flex flex-col items-start pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <span className="text-white font-bold text-lg">Premium</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Dengarkan tanpa batas. Nikmati gratis 1 bulan layanan Premium Standard untuk merasakan pengalaman terbaik dengan Stream Beats.
            </h1>

            <button 
              onClick={handleClaimFreeTrial}
              disabled={submitting || user?.isPremium}
              className="w-full bg-white text-black font-bold py-3.5 rounded-full text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-transform mb-4 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : user?.isPremium ? 'Anda sudah Premium' : 'Dapatkan 1 Bulan Gratis'}
            </button>
            <p className="text-[#a7a7a7] text-xs leading-relaxed">
              Gratis selama 1 bulan pertama, lalu Rp 10.000 per bulan sesudahnya. Penawaran ini khusus untuk pengguna baru agar dapat merasakan layanan Premium sepenuhnya. <span className="underline cursor-pointer">Persyaratan berlaku.</span> Lihat paket lainnya di bawah ini.
            </p>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Keuntungan Section */}
          <div className="bg-[#1f1f1f] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Kenapa harus pilih Premium Standard?</h3>
            
            <div className="space-y-5">
              <div className="flex gap-4 items-center">
                <VolumeX className="w-6 h-6 text-white shrink-0" />
                <span className="text-white text-sm font-medium">Mendengarkan musik bebas iklan</span>
              </div>
              <div className="flex gap-4 items-center">
                <Shuffle className="w-6 h-6 text-white shrink-0" />
                <span className="text-white text-sm font-medium">Putar lagu dalam urutan apa pun</span>
              </div>
              <div className="flex gap-4 items-center">
                <Headphones className="w-6 h-6 text-white shrink-0" />
                <span className="text-white text-sm font-medium">Kualitas audio sangat tinggi</span>
              </div>
              <div className="flex gap-4 items-center">
                <Users className="w-6 h-6 text-white shrink-0" />
                <span className="text-white text-sm font-medium">Mendengarkan bersama teman secara real-time</span>
              </div>
              <div className="flex gap-4 items-center">
                <MonitorPlay className="w-6 h-6 text-white shrink-0" />
                <span className="text-white text-sm font-medium">Tonton video musik tanpa gangguan</span>
              </div>
            </div>
          </div>

          {/* Packages Header */}
          <h3 className="text-2xl font-bold text-white mb-1">Paket yang tersedia</h3>
          <p className="text-[#a7a7a7] text-sm mb-6">Selalu fleksibel, batalkan kapan saja.</p>

          {/* Packages List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-10 text-[#a7a7a7]">Belum ada paket yang tersedia.</div>
            ) : (
              packages.map(pkg => {
                const nameLower = pkg.name.toLowerCase();
                const isPlatinum = nameLower.includes('platinum');
                const isStudent = nameLower.includes('student');
                const isStandard = !isPlatinum && !isStudent;

                // Card Theme logic
                let cardBg = 'bg-[#1f1f1f]';
                let accentColor = 'text-green-500';
                let buttonBg = 'bg-[#1ed760] text-black hover:bg-[#1fdf64]';
                
                if (isPlatinum) {
                  cardBg = 'bg-[#121212]'; 
                  accentColor = 'text-yellow-400';
                  buttonBg = 'bg-[#e5f059] text-black hover:bg-[#cddb47]';
                } else if (isStudent) {
                  cardBg = 'bg-[#1f1f1f]';
                  accentColor = 'text-[#1ed760]';
                  buttonBg = 'bg-[#a5e6b7] text-black hover:bg-[#92d3a4]';
                } else if (isStandard) {
                  cardBg = 'bg-[#0f3a2b] bg-gradient-to-br from-[#0f3a2b] to-[#041a12]';
                  accentColor = 'text-[#1ed760]';
                }

                return (
                  <div key={pkg.id} className={`${cardBg} rounded-xl p-5 relative overflow-hidden mb-4`}>
                    {isStandard && (
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none">
                        <div className="w-full h-full bg-[#1ed760] blur-[40px] rounded-full translate-x-1/4 -translate-y-1/4" />
                      </div>
                    )}
                    {isPlatinum && (
                      <div className="absolute top-0 right-0 w-48 h-48 opacity-40 pointer-events-none">
                        <div className="w-24 h-24 bg-purple-500/50 blur-[30px] rounded-full absolute top-2 right-2" />
                        <div className="w-16 h-16 bg-yellow-500/50 blur-[20px] rounded-full absolute bottom-4 left-4" />
                      </div>
                    )}
                    {isStudent && (
                      <div className="absolute top-0 left-0">
                         <div className="bg-[#333333] text-white text-[11px] font-bold px-3 py-1 rounded-br-xl">Diskon tersedia</div>
                      </div>
                    )}

                    <div className={`flex items-center gap-2 mb-4 ${isStudent ? 'mt-6' : ''}`}>
                       <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                      <span className={`font-bold text-sm ${isPlatinum ? 'text-[#e5f059]' : isStudent ? 'text-[#1ed760]' : 'text-[#1ed760]'}`}>
                        {pkg.name}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4">
                      {isPlatinum ? 'Pengalaman mendengarkan yang lebih baik' : isStudent ? 'Premium for Students' : 'Iringi hidupmu dengan musik'}
                    </h3>

                    {isStudent && (
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-[#1ed760]" />
                        <span className="text-white text-sm">Semua fitur Standard, dengan harga lebih murah</span>
                      </div>
                    )}

                    {!isStudent && (
                      <ul className="mb-6 space-y-3">
                        {pkg.benefits?.map((b: string, i: number) => (
                          <li key={i} className="text-white text-sm flex items-start gap-3">
                            {isPlatinum && i === 0 ? <CheckCircle2 className={`w-5 h-5 ${accentColor} shrink-0`} /> : 
                             isPlatinum && i === 1 ? <Users className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isPlatinum && i === 2 ? <Headphones className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isPlatinum && i === 3 ? <Sparkles className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isPlatinum && i === 4 ? <AudioLines className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isStandard && i === 0 ? <VolumeX className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isStandard && i === 1 ? <Shuffle className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isStandard && i === 2 ? <Headphones className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             isStandard && i === 3 ? <Download className={`w-5 h-5 ${accentColor} shrink-0`} /> :
                             <CheckCircle2 className={`w-5 h-5 ${accentColor} shrink-0`} />
                            }
                            <span className="leading-tight">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mb-4">
                      <div className="text-lg font-bold text-white">
                        {formatRupiah(pkg.price)} selama {pkg.duration_days > 30 ? Math.round(pkg.duration_days/30) + ' bulan' : pkg.duration_days + ' hari'}
                      </div>
                      <div className="text-[#a7a7a7] text-sm">
                        {formatRupiah(pkg.price)}/{pkg.duration_days > 30 ? 'bulan' : 'periode'} sesudahnya
                      </div>
                    </div>

                    <button 
                      onClick={() => handleSelectPackage(pkg)}
                      disabled={user?.isPremium || pendingTx?.package_id === pkg.id}
                      className={`w-full font-bold py-3.5 rounded-full text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 ${buttonBg}`}
                    >
                      {user?.isPremium ? (
                        'Kamu sudah Premium'
                      ) : pendingTx?.package_id === pkg.id ? (
                        'Menunggu Konfirmasi'
                      ) : pendingTx ? (
                        'Selesaikan pesanan lain'
                      ) : (
                        isPlatinum ? 'Dapatkan Premium Platinum' : `Coba ${pkg.duration_days > 30 ? Math.round(pkg.duration_days/30) + ' bulan' : pkg.duration_days + ' hari'} seharga ${formatRupiah(pkg.price)}`
                      )}
                    </button>
                    
                    <p className="text-center text-[#a7a7a7] text-[11px] mt-4 leading-relaxed px-2">
                      {formatRupiah(pkg.price)} selama {pkg.duration_days > 30 ? Math.round(pkg.duration_days/30) + ' bulan' : pkg.duration_days + ' hari'}, lalu {formatRupiah(pkg.price)} per bulan sesudahnya. Tawaran hanya berlaku kalau kamu belum pernah mencoba Premium dan kamu berlangganan melalui Stream Beats. Tawaran mungkin berbeda. <span className="underline cursor-pointer">Persyaratan berlaku.</span>
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutPkg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1C1C1E] z-10">
              <h2 className="text-lg font-bold text-white">Pembayaran Paket</h2>
              <button onClick={() => setCheckoutPkg(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar">
              <div className="bg-[#1ed760]/10 border border-[#1ed760]/20 rounded-2xl p-4 mb-6">
                <p className="text-[#1ed760] font-bold mb-1">{checkoutPkg.name}</p>
                <p className="text-2xl font-black text-white">{formatRupiah(checkoutPkg.price)}</p>
              </div>

              <div className="mb-6">
                <p className="text-white text-sm text-center mb-4">1. Scan QRIS di bawah ini untuk membayar</p>
                <div className="bg-white rounded-2xl p-4 w-48 h-48 mx-auto relative flex items-center justify-center">
                  {qrisUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                  )}
                </div>
                <button 
                  onClick={handleDownloadQris}
                  className="mt-4 mx-auto flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold bg-blue-500/10 px-4 py-2 rounded-full transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Simpan QRIS (Download)
                </button>
              </div>

              <div className="bg-white/5 h-px w-full my-6" />

              <div>
                <p className="text-white text-sm text-center mb-4">2. Unggah bukti pembayaran (Screenshot)</p>
                
                {proofFile ? (
                  <div className="bg-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <ImageIcon className="w-6 h-6 text-[#1ed760] shrink-0" />
                      <span className="text-white text-sm truncate">{proofFile.name}</span>
                    </div>
                    <button onClick={() => setProofFile(null)} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full bg-[#2A2A2A] hover:bg-[#333] border-2 border-dashed border-white/20 hover:border-[#1ed760]/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-white/50 mb-2" />
                    <span className="text-white font-medium text-sm">Pilih File Bukti Transfer</span>
                    <span className="text-white/40 text-xs mt-1">Format: JPG, PNG</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProofFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-[#1C1C1E] sticky bottom-0 z-10">
              <button 
                onClick={handleSubmitPayment}
                disabled={!proofFile || submitting}
                className="w-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : 'Kirim Bukti Pembayaran'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
