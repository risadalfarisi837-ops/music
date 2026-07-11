'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export function AuthProvider() {
  const { login, logout } = useAuthStore();
  const supabaseRef = useRef(createClient());
  const processingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;

    const syncUserFromSession = async (session: any) => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        let isPremium = profileData?.is_premium || false;
        const premiumExpiresAt = profileData?.premium_expires_at;

        // Auto-Basic: Cek apakah masa aktif sudah habis
        if (isPremium && premiumExpiresAt) {
          const expiresDate = new Date(premiumExpiresAt);
          if (expiresDate < new Date()) {
            isPremium = false;
            // Update database secara background
            supabase.from('profiles').update({ is_premium: false }).eq('id', session.user.id).then();
          }
        }

        if (mounted) {
          login({
            id: session.user.id,
            name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            avatarUrl: profileData?.avatar_url || session.user.user_metadata?.avatar_url || '/icon.png',
            bannerUrl: profileData?.banner_url || '',
            isPremium,
            premiumExpiresAt,
            isAdmin: profileData?.is_admin || false,
            joinDate: new Date(session.user.created_at).getFullYear().toString(),
            followers: 0,
            following: 0,
            totalListeningHours: 0,
            sessionInfo: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            },
          });
        }
      } catch (err) {
        console.error('Unexpected error in syncUserFromSession:', err);
      } finally {
        processingRef.current = false;
      }
    };

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncUserFromSession(session);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') &&
          session
        ) {
          await syncUserFromSession(session);
          if (event === 'SIGNED_IN') {
            router.refresh();
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear user, NOT savedAccounts (handled in store)
          if (mounted) logout();
          router.refresh();
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
