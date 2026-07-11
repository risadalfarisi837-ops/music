'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import Image from 'next/image';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).maybeSingle();
      if (data) {
        setFullName(data.full_name || user?.name || '');
        setAvatarUrl(data.avatar_url || user?.avatarUrl || '');
        setBannerUrl(data.banner_url || '');
      } else {
        setFullName(user?.name || '');
        setAvatarUrl(user?.avatarUrl || '');
      }
      setLoading(false);
    };

    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    } else {
      setBannerFile(file);
      setBannerUrl(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, bucket: 'avatars' | 'banners') => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`Error uploading ${bucket}:`, uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let newAvatarUrl = user.avatarUrl || '';
      let newBannerUrl = user.bannerUrl || '';

      // 1. Upload files if they changed
      if (avatarFile) {
        const url = await uploadFile(avatarFile, 'avatars');
        if (url) newAvatarUrl = url;
        else throw new Error("Gagal mengunggah foto profil. Pastikan Storage 'avatars' aktif di Supabase.");
      } else if (avatarUrl && !avatarUrl.startsWith('blob:')) {
        newAvatarUrl = avatarUrl;
      }

      if (bannerFile) {
        const url = await uploadFile(bannerFile, 'banners');
        if (url) newBannerUrl = url;
        else throw new Error("Gagal mengunggah banner. Pastikan Storage 'banners' aktif di Supabase.");
      } else if (bannerUrl && !bannerUrl.startsWith('blob:')) {
        newBannerUrl = bannerUrl;
      }

      // 2. Update profiles table
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // 3. Update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: newAvatarUrl }
      });

      // 4. Update local zustand store
      updateUser({
        name: fullName,
        avatarUrl: newAvatarUrl,
        bannerUrl: newBannerUrl
      });

      router.push('/profile');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Edit Profil</h1>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 mt-6">
        {/* Banner Upload */}
        <div className="relative w-full h-48 bg-white/5 rounded-2xl overflow-hidden mb-8 group cursor-pointer border border-white/10">
          {bannerUrl ? (
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-white/40">
              <Camera className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Tambah Banner Profil</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <input 
            type="file" 
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => handleFileChange(e, 'banner')}
          />
        </div>

        {/* Avatar Upload */}
        <div className="relative w-32 h-32 mx-auto -mt-20 mb-8">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#0A0A0A] bg-[#1C1C1E] relative group cursor-pointer shadow-2xl">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold">
                {fullName.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <input 
              type="file" 
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 px-2">Nama Lengkap</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
              placeholder="Masukkan nama Anda"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 px-2">Email</label>
            <input 
              type="text" 
              value={user?.email || ''}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
            />
            <p className="text-xs text-white/40 px-2 mt-1">Email tidak dapat diubah.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
