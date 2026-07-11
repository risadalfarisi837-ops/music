'use client';

import Image from 'next/image';
import { getHighResImage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MarqueeText } from './MarqueeText';
import { Disc3 } from 'lucide-react';

export function AlbumItem({ album }: { album: any }) {
  const router = useRouter();
  const thumbnail = getHighResImage(album.thumbnails?.[album.thumbnails.length - 1]?.url, 200);

  return (
    <div
      className="flex items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
      onClick={() => router.push(`/album/${album.browseId || album.albumId}`)}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        {thumbnail ? (
          <Image src={thumbnail} alt={album.name || album.title || 'Album'} fill sizes="48px" className="object-cover" />
        ) : (
          <Disc3 className="w-6 h-6 text-white/50" />
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0 border-b border-white/5 pb-3 group-hover:border-transparent transition-colors">
        <MarqueeText text={album.name || album.title} className="font-medium text-white" />
        <MarqueeText 
          text={`Album • ${album.artist || 'Various Artists'}${album.year ? ` • ${album.year}` : ''}`} 
          className="text-sm text-gray-400 mt-0.5" 
        />
      </div>
    </div>
  );
}
