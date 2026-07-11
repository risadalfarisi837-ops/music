'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/db';
import Image from 'next/image';
import { Plus, Play, X, Music, ChevronLeft, ChevronRight, Trash2, Send, Eye, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore, usePlayerStore } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';

interface Story {
  id: string;
  user_id: string;
  track_data: any;
  caption: string;
  created_at: string;
  profiles: any;
}

interface UserStoryGroup {
  userId: string;
  profile: any;
  stories: Story[];
  hasUnseen: boolean;
}

const STORY_DURATION = 15000; // 15 seconds per story
const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👏'];

export default function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Story Viewer States
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  
  // Floating Reactions
  const [floatingEmojis, setFloatingEmojis] = useState<{id: number, emoji: string, x: number}[]>([]);
  
  // Viewers List States
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { playTrack, currentTrack, volume, setVolume } = usePlayerStore();

  const fetchStoriesData = async () => {
    const fetchedStories = await db.getStories();
    const fetchedViewedIds = await db.getViewedStoryIds();
    
    setStories(fetchedStories);
    setViewedIds(new Set(fetchedViewedIds));
  };

  useEffect(() => {
    fetchStoriesData();
  }, []);

  // Group stories by user
  useEffect(() => {
    const groupsMap = new Map<string, UserStoryGroup>();
    
    const myStories = stories.filter(s => s.user_id === user?.id);
    if (myStories.length > 0) {
      const myProfile = Array.isArray(myStories[0].profiles) ? myStories[0].profiles[0] : myStories[0].profiles;
      groupsMap.set(user!.id, {
        userId: user!.id,
        profile: myProfile,
        stories: myStories.reverse(),
        hasUnseen: false
      });
    }

    stories.forEach(story => {
      if (story.user_id === user?.id) return;
      
      if (!groupsMap.has(story.user_id)) {
        const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
        groupsMap.set(story.user_id, {
          userId: story.user_id,
          profile: profile,
          stories: [],
          hasUnseen: false
        });
      }
      
      const group = groupsMap.get(story.user_id)!;
      group.stories.push(story);
      if (!viewedIds.has(story.id)) {
        group.hasUnseen = true;
      }
    });

    groupsMap.forEach(group => {
      if (group.userId !== user?.id) {
        group.stories.reverse();
      }
    });

    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.userId === user?.id) return -1;
      if (b.userId === user?.id) return 1;
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });

    setStoryGroups(sortedGroups);
  }, [stories, viewedIds, user?.id]);

  const fetchViewers = async (storyId: string) => {
    const viewersList = await db.getStoryViewers(storyId);
    setViewers(viewersList);
  };

  const handlePlayStory = useCallback((groupIndex: number, storyIndex: number = 0, dir: number = 1) => {
    const group = storyGroups[groupIndex];
    if (!group) return;
    
    const story = group.stories[storyIndex];
    if (!story) return;
    
    setDirection(dir);
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(storyIndex);
    setStoryProgress(0);
    setReplyText('');
    setShowViewers(false);
    
    if (story.track_data) {
      playTrack(story.track_data, [story.track_data]);
    }

    if (story.user_id !== user?.id && !viewedIds.has(story.id)) {
      db.markStoryAsViewed(story.id);
      setViewedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(story.id);
        return newSet;
      });
    }

    if (story.user_id === user?.id) {
      fetchViewers(story.id);
    }
  }, [storyGroups, playTrack, user?.id, viewedIds]);

  const closeViewer = useCallback(() => {
    setActiveGroupIndex(null);
    setStoryProgress(0);
    setReplyText('');
    setShowViewers(false);
    setFloatingEmojis([]);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const handleNextStory = useCallback(() => {
    if (activeGroupIndex === null) return;
    const group = storyGroups[activeGroupIndex];
    
    if (activeStoryIndex < group.stories.length - 1) {
      handlePlayStory(activeGroupIndex, activeStoryIndex + 1, 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      handlePlayStory(activeGroupIndex + 1, 0, 1);
    } else {
      closeViewer();
    }
  }, [activeGroupIndex, activeStoryIndex, storyGroups, handlePlayStory, closeViewer]);

  const handlePrevStory = useCallback(() => {
    if (activeGroupIndex === null) return;
    
    if (activeStoryIndex > 0) {
      handlePlayStory(activeGroupIndex, activeStoryIndex - 1, -1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = storyGroups[activeGroupIndex - 1];
      handlePlayStory(activeGroupIndex - 1, prevGroup.stories.length - 1, -1);
    } else {
      setStoryProgress(0); 
    }
  }, [activeGroupIndex, activeStoryIndex, storyGroups, handlePlayStory]);

  // Handle story auto-progress
  useEffect(() => {
    if (activeGroupIndex !== null && !isPaused && !showViewers) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      const updateInterval = 50; 
      progressIntervalRef.current = setInterval(() => {
        if (document.activeElement?.tagName === 'INPUT') return;

        setStoryProgress(prev => {
          const newProgress = prev + (updateInterval / STORY_DURATION) * 100;
          if (newProgress >= 100) {
            clearInterval(progressIntervalRef.current!);
            handleNextStory();
            return 100;
          }
          return newProgress;
        });
      }, updateInterval);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeGroupIndex, activeStoryIndex, handleNextStory, isPaused, showViewers]);

  const handleAddStory = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk membuat kisah.');
      return;
    }
    if (!currentTrack) {
      alert('Silakan putar lagu terlebih dahulu untuk membagikannya ke kisah Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.addStory(currentTrack, caption);
      setCaption('');
      setIsModalOpen(false);
      fetchStoriesData();
    } catch (error) {
      console.error('Failed to add story:', error);
      alert('Gagal membuat kisah. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus story ini?")) {
      const success = await db.deleteStory(storyId);
      if (success) {
        const group = storyGroups[activeGroupIndex!];
        if (group.stories.length > 1) {
           handleNextStory();
        } else {
           closeViewer();
        }
        fetchStoriesData();
      } else {
        alert("Gagal menghapus story.");
      }
    }
  };

  const handleReplyStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || activeGroupIndex === null) return;
    
    const story = storyGroups[activeGroupIndex].stories[activeStoryIndex];
    if (!story) return;

    setIsSendingReply(true);
    try {
      const roomId = await db.getOrCreateDMRoom(story.user_id);
      if (roomId) {
        const fullMessage = `Membalas kisah (${story.track_data.name}): ${replyText}`;
        await db.sendMessage(roomId, fullMessage);
        setReplyText('');
        alert("Balasan terkirim lewat pesan!");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim balasan.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const sendReaction = async (emoji: string) => {
    if (!user || activeGroupIndex === null) return;
    
    // Trigger floating animation
    const newEmoji = { id: Date.now(), emoji, x: Math.random() * 80 + 10 };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);

    // Send DM
    const story = storyGroups[activeGroupIndex].stories[activeStoryIndex];
    if (!story) return;
    try {
      const roomId = await db.getOrCreateDMRoom(story.user_id);
      if (roomId) {
        const fullMessage = `Bereaksi terhadap kisah (${story.track_data.name}): ${emoji}`;
        await db.sendMessage(roomId, fullMessage);
      }
    } catch (error) {
      console.error("Failed to send reaction", error);
    }
  };

  const activeGroup = activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null;
  const activeStory = activeGroup ? activeGroup.stories[activeStoryIndex] : null;
  const activeProfile = activeGroup?.profile;
  const activeCoverUrl = activeStory?.track_data?.thumbnails?.[activeStory.track_data.thumbnails.length - 1]?.url || '';

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);
  const toggleMute = () => setVolume(volume === 0 ? 100 : 0);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar px-1">
        <div 
          className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="relative w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg border-[3px] border-black group-hover:scale-105 transition">
            <Plus className="w-8 h-8 text-black" />
          </div>
          <span className="text-xs text-white font-medium">Kisah Anda</span>
        </div>

        {storyGroups.map((group, index) => {
          const lastStory = group.stories[group.stories.length - 1];
          const coverUrl = lastStory.track_data.thumbnails?.[lastStory.track_data.thumbnails.length - 1]?.url || '';
          
          const ringColor = group.userId === user?.id 
            ? 'border-zinc-500' 
            : group.hasUnseen ? 'border-[#1DB954]' : 'border-zinc-500';

          return (
            <div key={group.userId} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group relative" onClick={() => handlePlayStory(index, 0)}>
              <div className={`relative w-16 h-16 rounded-full overflow-hidden border-[3px] ${ringColor} group-hover:scale-105 transition shadow-lg p-[2px]`}>
                <div className="w-full h-full relative rounded-full overflow-hidden">
                  {coverUrl ? (
                    <Image src={coverUrl} alt="Story" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="absolute top-10 right-0 w-6 h-6 rounded-full overflow-hidden border-2 border-black bg-zinc-800 z-10">
                {group.profile?.avatar_url ? (
                  <Image src={group.profile.avatar_url} alt={group.profile.name} fill className="object-cover" />
                ) : (
                  <span className="flex items-center justify-center text-[10px] text-white font-bold h-full">
                    {group.profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-white/80 font-medium truncate w-16 text-center">
                {group.userId === user?.id ? 'Kisah Anda' : group.profile?.name?.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {activeStory && activeGroup && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Floating Emojis Overlay */}
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {floatingEmojis.map(emoji => (
                <motion.div
                  key={emoji.id}
                  initial={{ y: '100vh', opacity: 1, scale: 1 }}
                  animate={{ y: '-20vh', opacity: 0, scale: 2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="absolute text-5xl"
                  style={{ left: `${emoji.x}%` }}
                >
                  {emoji.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-0 opacity-40">
            {activeCoverUrl && (
              <Image src={activeCoverUrl} alt="Blur bg" fill className="object-cover blur-3xl" unoptimized />
            )}
          </div>
          
          <div className="w-full max-w-md h-full relative z-10 flex flex-col bg-zinc-900/50 shadow-2xl sm:rounded-2xl sm:h-[90vh] sm:overflow-hidden sm:border sm:border-zinc-800">
            
            <div className="absolute top-0 inset-x-0 p-2 flex gap-1 z-30">
              {activeGroup.stories.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ 
                      width: idx === activeStoryIndex 
                        ? `${storyProgress}%` 
                        : idx < activeStoryIndex ? '100%' : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-4 inset-x-0 px-4 flex items-center justify-between z-30 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-700 relative">
                  {activeProfile?.avatar_url ? (
                    <Image src={activeProfile.avatar_url} alt={activeProfile.name} fill className="object-cover" />
                  ) : (
                    <span className="flex items-center justify-center text-sm font-bold text-white h-full">
                      {activeProfile?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm drop-shadow-md">{activeProfile?.name}</p>
                  <p className="text-white/70 text-xs drop-shadow-md">
                    {new Date(activeStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-2 text-white hover:bg-white/10 rounded-full transition">
                  {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                {user?.id === activeStory.user_id && (
                  <button onClick={() => handleDeleteStory(activeStory.id)} className="p-2 text-red-400 hover:bg-white/10 rounded-full transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={closeViewer} className="p-2 text-white hover:bg-white/10 rounded-full transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={handlePrevStory} />
            <div className="absolute inset-y-0 right-0 w-2/3 z-20" onClick={handleNextStory} />

            {/* Content area with Framer Motion Transitions */}
            <div className="flex-1 relative overflow-hidden pointer-events-none mt-16 mb-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStory.id}
                  initial={{ opacity: 0, x: direction * 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -direction * 50, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6"
                >
                  <div className={`w-full aspect-square relative rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] mb-8 transition-transform ${isPaused ? 'scale-[0.98]' : 'scale-100'}`}>
                    {activeCoverUrl ? (
                      <Image src={activeCoverUrl} alt="Cover" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Music className="w-20 h-20 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center w-full bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/10 pointer-events-auto">
                    <p className="text-white font-bold text-xl truncate mb-1">{activeStory.track_data?.name}</p>
                    <p className="text-[#1DB954] text-sm font-medium truncate mb-4">
                      {Array.isArray(activeStory.track_data?.artist) 
                        ? activeStory.track_data.artist.map((a: any) => a.name).join(', ') 
                        : activeStory.track_data?.artist?.name}
                    </p>
                    
                    {activeStory.caption && (
                      <p className="text-white/90 text-sm leading-relaxed mt-2 border-t border-white/10 pt-4">
                        {activeStory.caption}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
              {user?.id !== activeStory.user_id ? (
                <div className="flex flex-col gap-3">
                  {/* Quick Reactions */}
                  <div className="flex justify-between px-2">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="text-2xl hover:scale-125 transition-transform active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {/* Reply Form */}
                  <form onSubmit={handleReplyStory} className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      placeholder="Balas kisah..."
                      className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition"
                    />
                    <button 
                      type="submit" 
                      disabled={!replyText.trim() || isSendingReply}
                      className="w-12 h-12 shrink-0 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-50 disabled:bg-white/50"
                    >
                      <Send className="w-5 h-5 ml-1" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button 
                    onClick={() => setShowViewers(true)}
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{viewers.length} Tayangan</span>
                  </button>
                </div>
              )}
            </div>

            {showViewers && (
              <div 
                className="absolute inset-x-0 bottom-0 top-1/2 bg-zinc-900 z-40 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                  <h3 className="text-white font-bold">Dilihat oleh</h3>
                  <button onClick={() => setShowViewers(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {viewers.length === 0 ? (
                    <p className="text-zinc-500 text-center text-sm mt-4">Belum ada yang melihat kisah ini.</p>
                  ) : (
                    viewers.map((viewer, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 relative shrink-0">
                          {viewer.avatar_url ? (
                            <Image src={viewer.avatar_url} alt={viewer.name} fill className="object-cover" />
                          ) : (
                            <span className="flex items-center justify-center text-sm font-bold text-white h-full">
                              {viewer.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium text-sm truncate">{viewer.name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 relative border border-zinc-800 shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Buat Kisah Baru</h2>
            
            <div className="space-y-6">
              {currentTrack ? (
                <div className="flex items-center gap-4 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                  <div className="w-16 h-16 relative rounded-md overflow-hidden shrink-0">
                    <Image 
                      src={currentTrack.thumbnails?.[currentTrack.thumbnails.length - 1]?.url || ''} 
                      alt="Cover" 
                      fill 
                      className="object-cover" 
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{currentTrack.name}</p>
                    <p className="text-zinc-400 text-sm truncate">
                      {Array.isArray(currentTrack.artist) ? currentTrack.artist.map((a: any) => a.name).join(', ') : currentTrack.artist.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 bg-zinc-800/30 p-8 rounded-lg border border-dashed border-zinc-700">
                  <Music className="w-8 h-8 text-zinc-500" />
                  <p className="text-zinc-400 text-sm text-center">Belum ada lagu yang diputar.<br/>Putar lagu terlebih dahulu untuk membagikannya.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Caption (Opsional)</label>
                <textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tulis sesuatu tentang lagu ini..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] resize-none h-24"
                  maxLength={150}
                />
                <p className="text-xs text-zinc-500 mt-1 text-right">{caption.length}/150</p>
              </div>

              <button 
                onClick={handleAddStory}
                disabled={!currentTrack || isSubmitting}
                className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Membagikan...' : 'Bagikan ke Kisah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
