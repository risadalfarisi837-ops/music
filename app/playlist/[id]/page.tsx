'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { usePlayerStore, Track } from '@/lib/store';
import { Play, ArrowLeft, MoreHorizontal, Radio, Music, Trash2, BookmarkPlus, BookmarkCheck, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { TrackItem } from '@/components/TrackItem';
import { PlaylistSkeleton } from '@/components/PlaylistSkeleton';
import { MarqueeText } from '@/components/MarqueeText';
import { ConfirmModal } from '@/components/FeedbackModals';
import { getHighResImage } from '@/lib/utils';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Playlist {
  id: string;
  name: string;
  img: string;
  tracks: Track[];
}

function SortableTrackItem({ track, index, queue, onRemove, isSelfCreated }: {
  track: Track;
  index: number;
  queue: Track[];
  onRemove?: (track: Track) => void;
  isSelfCreated: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.videoId + '-' + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      {isSelfCreated && (
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <TrackItem 
          track={track} 
          queue={queue} 
          onRemove={isSelfCreated ? onRemove : undefined}
        />
      </div>
    </div>
  );
}

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [deletePlaylistTarget, setDeletePlaylistTarget] = useState(false);
  const [removeSongTarget, setRemoveSongTarget] = useState<Track | null>(null);
  const [savePlaylistTarget, setSavePlaylistTarget] = useState(false);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!params.id) return;
      try {
        const id = String(params.id);
        const data = await db.getPlaylist(id);
        if (data) {
          setPlaylist(data as Playlist);
          setIsSaved(true);
        } else {
          // Try fetching from YouTube Music API
          const res = await fetch(`/api/ytplaylist?id=${encodeURIComponent(id)}`);
          if (res.ok) {
            const ytData = await res.json();
            setPlaylist({
              id: ytData.playlistId || ytData.id || id,
              name: ytData.name || ytData.title || 'Playlist',
              img: ytData.thumbnails?.[ytData.thumbnails.length - 1]?.url || '',
              tracks: ytData.videos || ytData.songs || []
            });
            setIsSaved(false);
          }
        }
      } catch (error) {
        console.error('Failed to load playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();

    const handlePlaylistsUpdated = () => {
      loadPlaylist();
    };

    window.addEventListener('playlistsUpdated', handlePlaylistsUpdated);
    
    return () => {
      window.removeEventListener('playlistsUpdated', handlePlaylistsUpdated);
    };
  }, [params.id]);

  if (loading) {
    return <PlaylistSkeleton />;
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <p className="mb-4">Playlist tidak ditemukan</p>
        <button onClick={() => router.back()} className="text-[#FA243C]">Kembali</button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks, 'playlist');
    }
  };

  const handleRadio = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], [], 'similar');
    }
  };

  const handleDeletePlaylist = async () => {
    setDeletePlaylistTarget(true);
  };

  const confirmDeletePlaylist = async () => {
    if (playlist) {
      await db.deletePlaylist(playlist.id);
      router.back();
    }
  };

  const handleRemoveSong = async (trackToRemove: Track) => {
    setRemoveSongTarget(trackToRemove);
  };

  const confirmRemoveSong = async () => {
    if (playlist && removeSongTarget) {
        const updatedTracks = playlist.tracks.filter(t => t.videoId !== removeSongTarget.videoId);
        const updatedPlaylist = { ...playlist, tracks: updatedTracks };
        await db.addPlaylist(updatedPlaylist);
        setPlaylist(updatedPlaylist);
        setRemoveSongTarget(null);
    }
  };

  const handleSavePlaylist = async () => {
    if (isSaved) {
      setSavePlaylistTarget(true);
    } else {
      if (playlist) {
        await db.addPlaylist(playlist);
        setIsSaved(true);
      }
    }
  };

  const confirmSavePlaylist = async () => {
      if (playlist) {
        await db.deletePlaylist(playlist.id);
        setIsSaved(false);
      }
      setSavePlaylistTarget(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !playlist) return;

    const oldIndex = playlist.tracks.findIndex((t, i) => t.videoId + '-' + i === active.id);
    const newIndex = playlist.tracks.findIndex((t, i) => t.videoId + '-' + i === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newTracks = arrayMove(playlist.tracks, oldIndex, newIndex);
    const updatedPlaylist = { ...playlist, tracks: newTracks };
    setPlaylist(updatedPlaylist);
    
    // Save to database
    if (isSaved) {
      await db.addPlaylist(updatedPlaylist);
    }
  };

  const isSelfCreated = !(/^PL|^OL|^RD/.test(playlist.id));

  return (
    <main className="min-h-screen pb-20">
      <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-md px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col items-center text-center">
        <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl mb-6 relative bg-white/5 flex items-center justify-center">
          {playlist.img ? (
            <Image src={playlist.img} alt={playlist.name} fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover" />
          ) : (
            <Music className="w-20 h-20 text-white/20" />
          )}
        </div>
        <div className="w-full max-w-sm mb-2">
          <MarqueeText text={playlist.name} className="text-2xl sm:text-3xl font-bold text-white text-center" />
        </div>
        <p className="text-white/50 mb-6">{playlist.tracks.length} lagu</p>

        <div className="flex items-center gap-4 w-full justify-center">
          <button 
            onClick={handlePlayAll}
            disabled={playlist.tracks.length === 0}
            className="w-14 h-14 bg-[#81B29A] rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Play className="w-7 h-7 text-black fill-current ml-1" />
          </button>
          <button 
            onClick={handleRadio}
            disabled={playlist.tracks.length === 0}
            className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Radio className="w-6 h-6 text-white" />
          </button>
          {!isSelfCreated && (
            <button 
              onClick={handleSavePlaylist}
              className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              title={isSaved ? "Hapus dari Koleksi" : "Simpan ke Koleksi"}
            >
              {isSaved ? <BookmarkCheck className="w-6 h-6 text-[#81B29A]" /> : <BookmarkPlus className="w-6 h-6 text-white" />}
            </button>
          )}
          {isSelfCreated && isSaved && (
            <button 
              onClick={handleDeletePlaylist}
              className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors"
              title="Hapus Playlist"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 max-w-3xl mx-auto">
        {playlist.tracks.length === 0 ? (
          <div className="text-center text-white/50 py-12">
            Belum ada lagu di playlist ini.
          </div>
        ) : isSelfCreated ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.tracks.map((t, i) => t.videoId + '-' + i)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {playlist.tracks.map((track, index) => (
                  <SortableTrackItem
                    key={track.videoId + '-' + index}
                    track={track}
                    index={index}
                    queue={playlist.tracks}
                    onRemove={handleRemoveSong}
                    isSelfCreated={isSelfCreated}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, index) => (
              <TrackItem 
                key={`${track.videoId}-${index}`} 
                track={track} 
                queue={playlist.tracks} 
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deletePlaylistTarget}
        title="Hapus Playlist"
        message="Apakah Anda yakin ingin menghapus playlist ini?"
        onConfirm={confirmDeletePlaylist}
        onCancel={() => setDeletePlaylistTarget(false)}
      />

      <ConfirmModal
        isOpen={!!removeSongTarget}
        title="Hapus Lagu"
        message="Hapus lagu ini dari playlist?"
        onConfirm={confirmRemoveSong}
        onCancel={() => setRemoveSongTarget(null)}
      />

      <ConfirmModal
        isOpen={savePlaylistTarget}
        title="Hapus dari Koleksi"
        message="Apakah Anda yakin ingin menghapus playlist ini dari koleksi?"
        onConfirm={confirmSavePlaylist}
        onCancel={() => setSavePlaylistTarget(false)}
      />
    </main>
  );
}
