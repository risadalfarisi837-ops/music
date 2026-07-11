'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePlayerStore } from '@/lib/store';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image';

const supabase = createClient();

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (url: string) => void;
}

const STICKERS = [
  // Cats & Pets
  "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
  "https://media.giphy.com/media/LHZyixOnHwDDy/giphy.gif",
  "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
  "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/VbnUQpnihPSIg/giphy.gif",
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/VbKymK6C1L2qI/giphy.gif",
  
  // Expressions / Reactions
  "https://media.giphy.com/media/BzyTuYCmvSORqs1Q/giphy.gif",
  "https://media.giphy.com/media/C9x8gX02SnMIoAClAo/giphy.gif",
  "https://media.giphy.com/media/Wj7lNjMNDxSmc/giphy.gif",
  "https://media.giphy.com/media/Lq0h93Z4F03lE8vA8/giphy.gif",
  "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
  "https://media.giphy.com/media/l0HlRnAWXxn0MhK5W/giphy.gif",
  "https://media.giphy.com/media/3o7TKsJtXzC1Ipsa3C/giphy.gif",
  "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif",
  "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
  "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
  "https://media.giphy.com/media/3oEduUv0C6oV25W7Oo/giphy.gif",
  "https://media.giphy.com/media/3o7TKUslwxnKVDd6Bq/giphy.gif",
  "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
  "https://media.giphy.com/media/26FPGWzRm53D43K8E/giphy.gif",
  "https://media.giphy.com/media/l2SqbcqUssvG6FvSE/giphy.gif",
  
  // Memes / Funny
  "https://media.giphy.com/media/3o85xKzvhRWSlOE7qU/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  "https://media.giphy.com/media/l0Iy1u3x4XRo320oE/giphy.gif",
  "https://media.giphy.com/media/l4pT06DIn1P1T7Aac/giphy.gif",
  "https://media.giphy.com/media/26BRLeLZPu2pqzyeI/giphy.gif",
  "https://media.giphy.com/media/3o84U6421OOWegpQhq/giphy.gif",
  "https://media.giphy.com/media/3o7TKyooGcW1iMwXJq/giphy.gif",
  "https://media.giphy.com/media/xT4uQulxzV39haZjVu/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jT5m4H6kY2Y/giphy.gif",
  "https://media.giphy.com/media/3oKIPa2TdahY8LAAUU/giphy.gif",
  "https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif",
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/26his5i9YJTqsqCyY/giphy.gif",
  "https://media.giphy.com/media/3oz8xTUMa2lH0zC4f2/giphy.gif",
  "https://media.giphy.com/media/3o7btUgG07Fh4r0C2Q/giphy.gif",
  "https://media.giphy.com/media/l3vRaQ3xb2h3W8MGA/giphy.gif",
  "https://media.giphy.com/media/l4FGo3IonE0NdH0S4/giphy.gif",
  "https://media.giphy.com/media/3oEduM8gZ71H4UeCZy/giphy.gif",
  "https://media.giphy.com/media/26xBx9C11u7UFYkFy/giphy.gif",
  "https://media.giphy.com/media/3o6ozh46EBu2EQe7iE/giphy.gif",
];

export default function StickerPicker({ isOpen, onClose, onSelectSticker }: StickerPickerProps) {
  const { currentTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'default' | 'saved'>('default');
  const [savedStickers, setSavedStickers] = useState<{ id: string, url: string }[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'saved') {
      loadSavedStickers();
    }
  }, [isOpen, activeTab]);

  const loadSavedStickers = async () => {
    const stickers = await db.getSavedStickers();
    setSavedStickers(stickers);
  };

  const handleAddCustomSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setIsSaving(true);
    const saved = await db.saveSticker(customUrl.trim());
    if (saved) {
      setSavedStickers([saved, ...savedStickers]);
      setCustomUrl('');
    }
    setIsSaving(false);
  };

  const handleDeleteSavedSticker = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const success = await db.deleteSavedSticker(id);
    if (success) {
      setSavedStickers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error } = await supabase.storage.from('stickers').upload(filePath, compressed);
      
      if (error) throw error;
      
      const { data } = supabase.storage.from('stickers').getPublicUrl(filePath);
      
      const saved = await db.saveSticker(data.publicUrl);
      if (saved) {
        setSavedStickers([saved, ...savedStickers]);
      }
    } catch (error) {
      console.error("Error uploading sticker:", error);
      alert("Gagal mengunggah foto. Pastikan ukuran file tidak terlalu besar dan koneksi stabil.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };
  
  if (!isOpen) return null;

  // Sesuaikan posisi bottom tergantung apakah mini player sedang aktif atau tidak
  const bottomClass = currentTrack ? 'bottom-[150px] md:bottom-[160px]' : 'bottom-[70px] md:bottom-[80px]';

  return (
    <div className={`fixed ${bottomClass} left-0 right-0 z-30 flex justify-center px-4 animate-in slide-in-from-bottom-2 duration-200 pointer-events-none`}>
      <div className="bg-[#181818] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[300px] pointer-events-auto">
        <div className="p-3 border-b border-white/10 bg-[#2a2a2a] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">Pilih Stiker</h3>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition rounded-full hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex w-full bg-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('default')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'default' ? 'bg-[#2a2a2a] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Bawaan
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'saved' ? 'bg-[#2a2a2a] text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Tersimpan
            </button>
          </div>
        </div>

        <div className="p-3 overflow-y-auto flex-1 bg-[#181818]">
          {activeTab === 'default' ? (
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((url, index) => (
                <button
                  key={index}
                  onClick={() => onSelectSticker(url)}
                  className="relative w-full aspect-square hover:bg-white/10 rounded-xl transition overflow-hidden group bg-white/5"
                >
                  <div className="w-full h-full p-1 relative">
                    <img src={url} alt={`Sticker ${index}`} className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-full">
              <div className="flex flex-col gap-2">
                <form onSubmit={handleAddCustomSticker} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste URL GIF/Sticker..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-[#2a2a2a] text-white text-xs px-3 py-2 rounded-lg outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-[#1DB954]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#1DB954] text-black px-3 py-2 rounded-lg hover:bg-[#1DB954]/80 transition disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>
                
                <div className="flex items-center gap-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">ATAU</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleUploadPhoto}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition border border-white/5 disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isUploading ? "Mengunggah..." : "Pilih Foto dari Perangkat"}
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-2">
                {savedStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="relative w-full aspect-square hover:bg-white/10 rounded-xl transition overflow-hidden group bg-white/5"
                  >
                    <button
                      onClick={() => onSelectSticker(sticker.url)}
                      className="w-full h-full p-1 block"
                    >
                      <img src={sticker.url} alt="Saved Sticker" className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSavedSticker(e, sticker.id)}
                      className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {savedStickers.length === 0 && (
                  <div className="col-span-4 text-center py-6 text-zinc-500 text-xs">
                    Belum ada stiker tersimpan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
