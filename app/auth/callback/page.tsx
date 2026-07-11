'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Sedang memproses login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // Check URL for code (PKCE flow)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('Gagal login. Silakan coba lagi.');
            setTimeout(() => router.replace('/auth'), 2000);
            return;
          }
        }

        // Check for hash fragments (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setStatus('Gagal login. Silakan coba lagi.');
            setTimeout(() => router.replace('/auth'), 2000);
            return;
          }
        }

        // Wait a moment for AuthProvider to pick up the session
        setStatus('Login berhasil! Mengalihkan...');
        setTimeout(() => {
          router.replace('/');
        }, 500);
        
      } catch (err) {
        setStatus('Terjadi kesalahan. Mengalihkan...');
        setTimeout(() => router.replace('/auth'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <main className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-white/60 text-sm">{status}</p>
    </main>
  );
}
