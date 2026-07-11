'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Use window.location for full page reload so AuthProvider picks up the new session
      window.location.href = '/';
      
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
        setError('Anda belum memverifikasi email Anda. Silakan periksa email Anda (termasuk folder Spam) untuk link verifikasi.');
      } else {
        setError('Email atau password salah.');
      }
      setLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[#0A0A0A] flex flex-col px-6 pt-12 relative">
      <Link href="/auth" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors absolute top-6 left-6 z-10">
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm mx-auto mt-16"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Selamat Datang Kembali</h1>
        <p className="text-white/50 mb-8 text-sm">Masuk untuk melanjutkan pengalaman mendengarkan Anda.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-white/30" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Password Anda"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-6 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk Sekarang'}
          </button>
        </form>
        
        <p className="text-center text-white/50 text-sm mt-8">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-white hover:underline">
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
