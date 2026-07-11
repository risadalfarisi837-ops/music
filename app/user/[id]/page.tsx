import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Play, Music, Users } from 'lucide-react';
import { MarqueeText } from '@/components/MarqueeText';
import { FollowButton } from '@/components/FollowButton';
import { MessageButton } from '@/components/MessageButton';

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  
  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', id);

  // Fetch public profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Fetch counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', id);
    
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', id);

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* Header */}
      <div className="relative pt-12 pb-6 px-4 flex flex-col items-center text-center overflow-hidden">
        {/* Banner Background */}
        <div className="absolute top-0 inset-x-0 h-48 overflow-hidden">
          {profile?.banner_url ? (
            <Image src={profile.banner_url} alt="Banner" fill className="object-cover opacity-50" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
        </div>
        
        <Link href="/" className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition z-10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Avatar */}
        <div className="relative w-32 h-32 rounded-full mb-4 shadow-2xl">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile?.name || 'Pengguna'}
              fill
              className="rounded-full object-cover border-4 border-white/10"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#282828] border-4 border-white/10 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            {profile?.name || 'Pengguna'}
          </h1>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{playlists?.length || 0}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">Playlist</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{followersCount || 0}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">Pengikut</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">{followingCount || 0}</span>
              <span className="text-xs text-white/50 uppercase tracking-wider">Mengikuti</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <FollowButton targetUserId={id} />
            <MessageButton targetUserId={id} />
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <h2 className="text-xl font-bold text-white mb-4">Playlist Publik</h2>
        
        {(!playlists || playlists.length === 0) ? (
          <div className="text-center py-12 text-white/50">
            Pengguna ini belum membuat playlist.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <Link href={`/playlist/${playlist.id}`} key={playlist.id} className="group cursor-pointer block">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
                  {playlist.img ? (
                    <Image src={playlist.img} alt={playlist.name} fill className="object-cover transition duration-300 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#FA243C] flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                      <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-medium truncate group-hover:text-[#FA243C] transition-colors">{playlist.name}</h3>
                <p className="text-white/50 text-xs truncate mt-0.5">{playlist.tracks?.length || 0} lagu</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
