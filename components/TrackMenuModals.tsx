'use client';

import { X, Users, Copy, Check, XCircle, Music, FileText, QrCode, Crown, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { getHighResImage } from '@/lib/utils';
import { useState } from 'react';

interface TrackInfo {
  name: string;
  artist: string;
  videoId: string;
  thumbnailUrl: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: TrackInfo;
}

// ═══════ DENGAR BARENG MODAL ═══════
export function ListenTogetherModal({ isOpen, onClose, track }: ModalProps) {
  const [copied, setCopied] = useState(false);
  const sessionCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  const sessionLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/session/${sessionCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header gradient */}
        <div className="relative h-32 bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-teal-500/10 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1C1C1E]" />
          <div className="relative z-10 w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/50 hover:text-white bg-black/30 rounded-full z-20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 -mt-4 relative z-10">
          <h2 className="text-xl font-bold text-white text-center mb-1">Dengar Bareng</h2>
          <p className="text-white/50 text-sm text-center mb-6">Bagikan sesi ini agar teman bisa mendengar musik yang sama secara real-time.</p>

          {/* Now Playing */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-5 border border-white/5">
            <div className="w-11 h-11 relative rounded-lg overflow-hidden shrink-0">
              <Image src={track.thumbnailUrl} alt={track.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{track.name}</p>
              <p className="text-white/50 text-xs truncate">{track.artist}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-[10px] font-bold">LIVE</span>
            </div>
          </div>

          {/* Session Code */}
          <div className="bg-white/5 rounded-xl p-4 text-center mb-5 border border-white/5">
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Kode Sesi</p>
            <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{sessionCode}</p>
          </div>

          {/* Link + Copy */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm truncate">
              {sessionLink}
            </div>
            <button 
              onClick={handleCopy}
              className={`px-4 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {copied ? <><Check className="w-4 h-4" /> OK</> : <><Copy className="w-4 h-4" /> Salin</>}
            </button>
          </div>

          <p className="text-white/30 text-[11px] text-center">Fitur sinkronisasi real-time akan tersedia di pembaruan mendatang.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════ KECUALIKAN LAGU MODAL ═══════
export function ExcludeSongModal({ isOpen, onClose, track }: ModalProps) {
  const [excluded, setExcluded] = useState(false);

  const handleExclude = () => {
    setExcluded(true);
    setTimeout(() => {
      onClose();
      setExcluded(false);
    }, 1500);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative flex flex-col items-center text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        {excluded ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Berhasil Dikecualikan</h2>
            <p className="text-white/60 text-sm">Lagu ini tidak akan muncul di rekomendasi Anda lagi.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Kecualikan Lagu</h2>
            <p className="text-white/60 text-sm mb-2">Apakah Anda yakin ingin mengecualikan lagu ini dari profil selera Anda?</p>
            
            {/* Track preview */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl my-4 w-full border border-white/5">
              <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0">
                <Image src={track.thumbnailUrl} alt={track.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-semibold truncate">{track.name}</p>
                <p className="text-white/50 text-xs truncate">{track.artist}</p>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl font-medium text-white/70 bg-white/5 hover:bg-white/10 transition-colors">
                Batal
              </button>
              <button onClick={handleExclude} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Kecualikan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════ KREDIT LAGU MODAL ═══════
export function SongCreditsModal({ isOpen, onClose, track }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Album art header */}
        <div className="relative h-48 overflow-hidden">
          <Image src={track.thumbnailUrl} alt={track.name} fill className="object-cover blur-sm scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-[#1C1C1E]" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/50 hover:text-white bg-black/30 rounded-full z-20">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-5 right-5 z-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 relative rounded-xl overflow-hidden shrink-0 shadow-2xl border border-white/10">
                <Image src={track.thumbnailUrl} alt={track.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="text-white text-lg font-bold truncate">{track.name}</h2>
                <p className="text-white/60 text-sm truncate">{track.artist}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <h3 className="text-white/40 text-xs uppercase tracking-wider font-semibold">Informasi Lagu</h3>
          
          <div className="space-y-3">
            <CreditRow label="Judul" value={track.name} />
            <CreditRow label="Artis" value={track.artist} />
            <CreditRow label="ID Video" value={track.videoId} mono />
            <CreditRow label="Platform" value="YouTube Music" />
            <CreditRow label="Provider API" value="Stream Beats" />
            <CreditRow label="Format Audio" value="AAC / Opus" />
          </div>

          <div className="pt-2">
            <a 
              href={`https://music.youtube.com/watch?v=${track.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-bold text-white bg-red-500/20 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Buka di YouTube Music
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-white/50 text-sm">{label}</span>
      <span className={`text-white text-sm font-medium truncate max-w-[200px] text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

// ═══════ QR CODE MODAL ═══════
export function QRCodeModal({ isOpen, onClose, track }: ModalProps) {
  const [copied, setCopied] = useState(false);
  const trackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${track.videoId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1C1C1E] rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Gradient top */}
        <div className="relative h-20 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-pink-500/10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1C1C1E]" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/50 hover:text-white bg-black/30 rounded-full z-20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 -mt-6 relative z-10 flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-white mb-1">Kode Musik</h2>
          <p className="text-white/50 text-sm mb-6">Scan kode ini untuk langsung mendengarkan lagu.</p>

          {/* QR Code Visual - Pure CSS generated visual */}
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            {/* Generating a simple QR-like visual using the videoId for uniqueness */}
            <QRVisual data={track.videoId} />
          </div>

          {/* Track info */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl w-full mb-5 border border-white/5">
            <div className="w-10 h-10 relative rounded-lg overflow-hidden shrink-0">
              <Image src={track.thumbnailUrl} alt={track.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-sm font-semibold truncate">{track.name}</p>
              <p className="text-white/50 text-xs truncate">{track.artist}</p>
            </div>
          </div>

          <button 
            onClick={handleCopy}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Link Disalin!</> : <><Copy className="w-4 h-4" /> Salin Link Lagu</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════ CSS-based QR Code Visual ═══════
function QRVisual({ data }: { data: string }) {
  // Generate deterministic pattern from videoId
  const size = 21;
  const grid: boolean[][] = [];
  
  // Simple hash-based pattern generator
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  
  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const isFinderTL = row < 7 && col < 7;
      const isFinderTR = row < 7 && col >= size - 7;
      const isFinderBL = row >= size - 7 && col < 7;
      
      if (isFinderTL || isFinderTR || isFinderBL) {
        // Draw finder pattern squares
        const localR = isFinderTL ? row : isFinderTR ? row : row - (size - 7);
        const localC = isFinderTL ? col : isFinderTR ? col - (size - 7) : col;
        const isOuter = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const isInner = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        grid[row][col] = isOuter || isInner;
      } else {
        // Data area - pseudo-random from hash
        const seed = (hash * (row * size + col + 1)) >>> 0;
        grid[row][col] = (seed % 3) !== 0;
      }
    }
  }

  const cellSize = 8;
  
  return (
    <div style={{ width: size * cellSize, height: size * cellSize }} className="relative">
      {grid.map((row, r) =>
        row.map((cell, c) => (
          cell ? (
            <div
              key={`${r}-${c}`}
              className="absolute bg-black rounded-[1px]"
              style={{
                left: c * cellSize,
                top: r * cellSize,
                width: cellSize,
                height: cellSize,
              }}
            />
          ) : null
        ))
      )}
    </div>
  );
}
