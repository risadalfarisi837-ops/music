import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

export const metadata = {
  title: 'Profil Pengguna',
  description: 'Kelola profil, playlist, dan pengaturan akun Anda.',
};

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Background gradient matching user theme */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/10 to-[#0A0A0A] pointer-events-none" />
      
      <div className="relative z-10 max-w-lg mx-auto w-full">
        <ProfileHeader />
        <ProfileTabs />
      </div>
    </main>
  );
}
