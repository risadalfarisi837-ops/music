'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2, Music } from 'lucide-react';
import Image from 'next/image';

interface ShareSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: any) => void;
}

export default function ShareSongModal({ isOpen, onClose, onSelectSong }: ShareSongModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        searchSongs(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchSongs = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=song`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      }
    } catch (error) {
      console.error("Error searching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[70vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Bagikan Lagu</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="bg-[#2a2a2a] rounded-full flex items-center px-4 py-2 focus-within:ring-1 focus-within:ring-[#1DB954]/50 transition">
            <Search className="w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari lagu untuk dibagikan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-white text-[15px] placeholder:text-zinc-500 outline-none ml-2"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin mb-4" />
              <p className="text-zinc-400 text-sm">Mencari lagu...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((song) => (
                <button
                  key={song.videoId}
                  onClick={() => onSelectSong(song)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition text-left"
                >
                  <div className="relative w-12 h-12 rounded bg-zinc-800 shrink-0 overflow-hidden">
                    {song.thumbnails?.[0]?.url ? (
                      <Image src={song.thumbnails[0].url} alt={song.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-zinc-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{song.name}</p>
                    <p className="text-zinc-400 text-xs truncate">{song.artist?.name || 'Unknown Artist'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() !== '' ? (
            <div className="text-center py-10 text-zinc-500">
              Tidak ada lagu ditemukan.
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center">
              <Music className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-sm">Ketik nama lagu untuk mencari</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
