'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

export default function AuthPage() {
  const supabase = createClient();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleSignIn.initialize({
        clientId: '193378763566-br298ob97b9th8i1liq6gcuil0e6mckm.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      }).catch(console.error);
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await GoogleSignIn.signIn();
        
        if (result.idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: result.idToken,
          });
          
          if (error) throw error;
          window.location.href = '/'; 
        }
      } else {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[#0A0A0A] flex flex-col items-center justify-center relative px-6">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/profile" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center z-10"
      >
        <div className="w-24 h-24 rounded-3xl overflow-hidden mb-8 shadow-2xl relative border-2 border-white/10">
          <Image src="/icon.png" alt="App Icon" fill className="object-cover" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Jutaan lagu.<br/>Gratis di sini.</h1>
        <p className="text-white/50 text-center mb-10 text-sm">Masuk untuk menyimpan lagu dan membuat playlist kustom Anda sendiri.</p>

        <div className="w-full space-y-4">
          <Link href="/auth/register" className="w-full block text-center bg-white text-black py-4 rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform">
            Daftar Gratis
          </Link>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 py-4 rounded-full font-bold hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </button>

          <Link href="/auth/login" className="w-full block text-center text-white py-4 font-bold hover:text-white/80 transition-colors mt-2">
            Masuk (Login)
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
