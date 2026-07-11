import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.musickuzyy.app',
  appName: 'Stream Beats',
  webDir: 'public',
  server: {
    url: 'https://musickuzyy.vercel.app',
    cleartext: true,
    allowNavigation: [
      '*.google.com',
      '*.googleapis.com',
      '*.supabase.co',
      '*.supabase.com',
      'accounts.google.com',
      'musickuzyy.vercel.app'
    ]
  },
  android: {
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    allowMixedContent: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '193378763566-br298ob97b9th8i1liq6gcuil0e6mckm.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
