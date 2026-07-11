'use client';

import Image from 'next/image';
import { getHighResImage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MarqueeText } from './MarqueeText';
import { ListMusic } from 'lucide-react';

export function PlaylistItem({ playlist }: { playlist: any }) {
  const router = useRouter();
  const thumbnail = getHighResImage(playlist.thumbnails?.[playlist.thumbnails.length - 1]?.url, 200);

  return (
    <div
      className="flex items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
      onClick={() => router.push(`/playlist/${playlist.browseId || playlist.playlistId}`)}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        {thumbnail ? (
          <Image src={thumbnail} alt={playlist.name || playlist.title || 'Playlist'} fill sizes="48px" className="object-cover" />
        ) : (
          <ListMusic className="w-6 h-6 text-white/50" />
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0 border-b border-white/5 pb-3 group-hover:border-transparent transition-colors">
        <MarqueeText text={playlist.name || playlist.title} className="font-medium text-white" />
        <MarqueeText text={`Playlist • ${playlist.author || 'YouTube Music'}`} className="text-sm text-gray-400 mt-0.5" />
      </div>
    </div>
  );
}
