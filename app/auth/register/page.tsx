'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Supabase by default requires email confirmation.
      // If session is null, it means email confirmation is required.
      if (!data.session) {
        setSuccess("Pendaftaran berhasil! Silakan periksa kotak masuk atau folder Spam email Anda untuk link verifikasi.");
        // Redirect to login page instead of home so they know they need to login later
        setTimeout(() => {
          router.push('/auth/login');
        }, 4000);
        return;
      }

      setSuccess("Pendaftaran berhasil! Mengalihkan...");
      // Full page reload so AuthProvider picks up the new session
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
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
        <h1 className="text-3xl font-bold text-white mb-2">Buat Akun</h1>
        <p className="text-white/50 mb-8 text-sm">Daftar secara gratis untuk mulai membuat playlist Anda.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-5 rounded-2xl text-center text-sm leading-relaxed w-full">
              {success}
            </div>
            {email.toLowerCase().endsWith('@gmail.com') && (
              <a 
                href="https://mail.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Buka Gmail Sekarang
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 ml-1">Nama Tampilan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-white/30" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Nama Panggilan Anda"
                />
              </div>
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform mt-6 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Akun'}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
