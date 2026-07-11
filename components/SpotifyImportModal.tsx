import React, { useState } from 'react';
import { X, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { Track } from '@/lib/store';

interface SpotifyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotifyImportModal({ isOpen, onClose }: SpotifyImportModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!url.includes('spotify.com/playlist/')) {
      setError('Tolong masukkan link playlist Spotify yang valid.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);
    setProgress(0);
    setStatus('Mengambil data dari Spotify...');

    try {
      // 1. Fetch Spotify Playlist Data
      const res = await fetch(`/api/spotify?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengambil data dari Spotify');
      }

      if (!data.tracks || data.tracks.length === 0) {
        throw new Error('Playlist kosong atau tidak bisa dibaca');
      }

      const totalTracks = data.tracks.length;
      setTotal(totalTracks);
      
      const matchedTracks: Track[] = [];

      // 2. Match each track with YT Music
      for (let i = 0; i < data.tracks.length; i++) {
        const track = data.tracks[i];
        setStatus(`Mencari lagu ${i + 1} dari ${totalTracks}: ${track.title}`);
        setProgress(i + 1);

        try {
          const query = `${track.title} ${track.artist}`;
          const searchRes = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=song`);
          const searchData = await searchRes.json();

          if (searchData && searchData.length > 0) {
            // Take the first matching song
            const match = searchData[0];
            matchedTracks.push({
              videoId: match.videoId,
              name: match.name || match.title,
              artist: [{ name: match.artist?.name || (typeof match.artist === 'string' ? match.artist : 'Unknown Artist') }],
              duration: match.duration,
              thumbnails: match.thumbnails || [],
            });
          }
        } catch (err) {
          console.error(`Gagal mencari lagu: ${track.title}`, err);
          // Continue to next track even if one fails
        }
      }

      setStatus('Menyimpan playlist...');

      // 3. Save to local database
      const newPlaylistId = crypto.randomUUID();
      await db.addPlaylist({
        id: newPlaylistId,
        name: data.name + ' (Imported)',
        img: data.coverUrl || '',
        tracks: matchedTracks,
      });

      setSuccess(true);
      setStatus(`Selesai! Berhasil mengimpor ${matchedTracks.length} dari ${totalTracks} lagu.`);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));

      setTimeout(() => {
        onClose();
        // Reset states
        setUrl('');
        setIsLoading(false);
        setSuccess(false);
        setStatus('');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengimpor playlist');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-bold flex items-center">
            <Download className="w-5 h-5 mr-2 text-green-500" />
            Import Spotify Playlist
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {!isLoading && !success && (
            <>
              <p className="text-sm text-gray-400">
                Masukkan link playlist Spotify publik Anda. Sistem akan mencari dan mencocokkan lagu-lagunya secara otomatis.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleImport}
                disabled={!url}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mulai Import
              </button>
            </>
          )}

          {isLoading && !success && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <div className="text-center w-full">
                <p className="text-lg font-medium text-white mb-2">{status}</p>
                {total > 0 && (
                  <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(progress / total) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-white mb-1">Berhasil!</p>
                <p className="text-gray-400">{status}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
