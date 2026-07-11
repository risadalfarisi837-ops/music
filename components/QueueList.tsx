'use client';

import React from 'react';
import { usePlayerStore, Track } from '@/lib/store';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Play } from 'lucide-react';
import Image from 'next/image';
import { getHighResImage, cn } from '@/lib/utils';
import { MarqueeText } from './MarqueeText';

function SortableTrackItem({ 
  track, 
  index, 
  isCurrent 
}: { 
  track: Track; 
  index: number; 
  isCurrent: boolean;
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
  };

  const thumbnail = getHighResImage(track.thumbnails?.[track.thumbnails.length - 1]?.url, 200);
  const artistName = Array.isArray(track.artist) ? track.artist.map(a => a.name).join(', ') : track.artist?.name || 'Unknown Artist';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors",
        isDragging && "opacity-50 shadow-2xl bg-white/10 z-50",
        isCurrent && "border-[#FA243C]/50 bg-[#FA243C]/10"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab hover:text-white text-white/50 p-1"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <Image src={thumbnail} alt={track.name} fill sizes="48px" className="object-cover" />
        {isCurrent && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <MarqueeText text={track.name} className={cn("font-medium", isCurrent ? "text-[#FA243C]" : "text-white")} />
        <MarqueeText text={artistName} className="text-sm text-white/50 mt-0.5" />
      </div>
    </div>
  );
}

export function QueueList() {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const reorderQueue = usePlayerStore((state) => state.reorderQueue);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // id is videoId-index
      const oldIndex = parseInt((active.id as string).split('-').pop() || '0', 10);
      const newIndex = parseInt((over.id as string).split('-').pop() || '0', 10);
      
      reorderQueue(oldIndex, newIndex);
    }
  };

  if (!queue || queue.length === 0) return null;

  const items = queue.map((track, index) => track.videoId + '-' + index);

  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
      <h3 className="text-white font-bold text-xl mb-4 px-2">Antrean Berikutnya</h3>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {queue.map((track, index) => (
                <SortableTrackItem 
                  key={track.videoId + '-' + index} 
                  track={track} 
                  index={index} 
                  isCurrent={index === queueIndex}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
