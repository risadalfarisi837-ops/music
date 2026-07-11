import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Track {
  videoId: string;
  name: string;
  artist: { name: string; artistId?: string } | { name: string; artistId?: string }[];
  thumbnails: { url: string; width: number; height: number }[];
  duration?: number;
  isExplicit?: boolean;
}

export interface HistoryItem {
  track: Track;
  playedAt: number;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
  isRightSidebarOpen: boolean;
  rightSidebarMode: 'info' | 'queue' | 'leaderboard';
  volume: number;
  progress: number;
  duration: number;
  playContext: 'playlist' | 'similar';
  trackToAdd: Track | null;
  history: HistoryItem[];
  playCounts: Record<string, number>;
  dominantColor: string | null;
  
  originalQueue: Track[];
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  sleepTimer: number | null; // timestamp when playback should stop
  activeMenuTrack: Track | null;
  
  playTrack: (track: Track, queue?: Track[], context?: 'playlist' | 'similar') => void;
  playNext: () => Promise<void>;
  playPrev: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  toggleRightSidebar: () => void;
  setRightSidebarMode: (mode: 'info' | 'queue' | 'leaderboard') => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  setTrackToAdd: (track: Track | null) => void;
  setDominantColor: (color: string | null) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setActiveMenuTrack: (track: Track | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      isExpanded: false,
      isRightSidebarOpen: true,
      rightSidebarMode: 'info',
      volume: 100,
      progress: 0,
      duration: 0,
      playContext: 'similar',
      trackToAdd: null,
      history: [],
      playCounts: {},
      dominantColor: null,
      
      originalQueue: [],
      isShuffle: false,
      repeatMode: 'off',
      sleepTimer: null,
      activeMenuTrack: null,

      playTrack: (rawTrack, rawQueue, context = 'similar') => {
        const track = {
          videoId: rawTrack.videoId,
          name: rawTrack.name,
          artist: rawTrack.artist,
          thumbnails: rawTrack.thumbnails,
          duration: rawTrack.duration,
          isExplicit: rawTrack.isExplicit,
        };
        let queue = rawQueue ? rawQueue.map(t => ({
          videoId: t.videoId,
          name: t.name,
          artist: t.artist,
          thumbnails: t.thumbnails,
          duration: t.duration,
          isExplicit: t.isExplicit,
        })) : undefined;

        const state = get();
        const newHistoryItem = { track, playedAt: Date.now() };
        
        const filteredHistory = state.history.filter(h => h.track.videoId !== track.videoId);
        const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
        
        const newPlayCounts = { ...state.playCounts };
        newPlayCounts[track.videoId] = (newPlayCounts[track.videoId] || 0) + 1;

        let newQueue = queue || [track];
        let newIndex = newQueue.findIndex((t) => t.videoId === track.videoId);
        if (newIndex === -1) newIndex = 0;

        const originalQueue = [...newQueue];

        if (state.isShuffle && newQueue.length > 1) {
          const current = newQueue[newIndex];
          const others = newQueue.filter((_, i) => i !== newIndex);
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          newQueue = [current, ...others];
          newIndex = 0;
        }

        set({
          currentTrack: track,
          isPlaying: true,
          queue: newQueue,
          originalQueue: originalQueue,
          queueIndex: newIndex,
          progress: 0,
          playContext: context,
          history: newHistory,
          playCounts: newPlayCounts,
          isRightSidebarOpen: true,
        });
      },

      playNext: async () => {
        const { queue, queueIndex, playContext, currentTrack, repeatMode } = get();
        if (queueIndex < queue.length - 1) {
          const nextIndex = queueIndex + 1;
          const nextTrack = queue[nextIndex];
          
          const state = get();
          const newHistoryItem = { track: nextTrack, playedAt: Date.now() };
          const filteredHistory = state.history.filter(h => h.track.videoId !== nextTrack.videoId);
          const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
          
          const newPlayCounts = { ...state.playCounts };
          newPlayCounts[nextTrack.videoId] = (newPlayCounts[nextTrack.videoId] || 0) + 1;

          set({
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
            history: newHistory,
            playCounts: newPlayCounts,
          });
        } else if (repeatMode === 'all' && queue.length > 0) {
          const nextIndex = 0;
          const nextTrack = queue[nextIndex];
          
          const state = get();
          const newHistoryItem = { track: nextTrack, playedAt: Date.now() };
          const filteredHistory = state.history.filter(h => h.track.videoId !== nextTrack.videoId);
          const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
          
          const newPlayCounts = { ...state.playCounts };
          newPlayCounts[nextTrack.videoId] = (newPlayCounts[nextTrack.videoId] || 0) + 1;

          set({
            currentTrack: nextTrack,
            queueIndex: nextIndex,
            isPlaying: true,
            progress: 0,
            history: newHistory,
            playCounts: newPlayCounts,
          });
        } else {
          if (playContext === 'similar' && currentTrack) {
            try {
              const res = await fetch(`/api/upnext?id=${currentTrack.videoId}`);
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                const nextTracks = data.filter((t: any) => t.videoId !== currentTrack.videoId);
                if (nextTracks.length > 0) {
                  const nextTrack = nextTracks[0];
                  
                  const state = get();
                  const newHistoryItem = { track: nextTrack, playedAt: Date.now() };
                  const filteredHistory = state.history.filter(h => h.track.videoId !== nextTrack.videoId);
                  const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
                  
                  const newPlayCounts = { ...state.playCounts };
                  newPlayCounts[nextTrack.videoId] = (newPlayCounts[nextTrack.videoId] || 0) + 1;

                  let finalNextTracks = nextTracks;
                  if (state.isShuffle) {
                    const others = nextTracks.slice(1);
                    for (let i = others.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [others[i], others[j]] = [others[j], others[i]];
                    }
                    finalNextTracks = [nextTrack, ...others];
                  }

                  set({
                    queue: [...queue, ...finalNextTracks],
                    originalQueue: state.originalQueue.length > 0 ? [...state.originalQueue, ...nextTracks] : [],
                    currentTrack: nextTrack,
                    queueIndex: queueIndex + 1,
                    isPlaying: true,
                    progress: 0,
                    history: newHistory,
                    playCounts: newPlayCounts,
                  });
                  return;
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
          set({ isPlaying: false, progress: 0 });
        }
      },

      playPrev: () => {
        const { queue, queueIndex, progress, repeatMode } = get();
        if (progress > 3) {
          set({ progress: 0 });
          return;
        }
        if (queueIndex > 0) {
          const prevIndex = queueIndex - 1;
          const prevTrack = queue[prevIndex];
          
          const state = get();
          const newHistoryItem = { track: prevTrack, playedAt: Date.now() };
          const filteredHistory = state.history.filter(h => h.track.videoId !== prevTrack.videoId);
          const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
          
          const newPlayCounts = { ...state.playCounts };
          newPlayCounts[prevTrack.videoId] = (newPlayCounts[prevTrack.videoId] || 0) + 1;

          set({
            currentTrack: prevTrack,
            queueIndex: prevIndex,
            isPlaying: true,
            progress: 0,
            history: newHistory,
            playCounts: newPlayCounts,
          });
        } else if (repeatMode === 'all' && queue.length > 0) {
          const prevIndex = queue.length - 1;
          const prevTrack = queue[prevIndex];
          
          const state = get();
          const newHistoryItem = { track: prevTrack, playedAt: Date.now() };
          const filteredHistory = state.history.filter(h => h.track.videoId !== prevTrack.videoId);
          const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 500);
          
          const newPlayCounts = { ...state.playCounts };
          newPlayCounts[prevTrack.videoId] = (newPlayCounts[prevTrack.videoId] || 0) + 1;

          set({
            currentTrack: prevTrack,
            queueIndex: prevIndex,
            isPlaying: true,
            progress: 0,
            history: newHistory,
            playCounts: newPlayCounts,
          });
        } else {
          set({ progress: 0 });
        }
      },

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
      setRightSidebarMode: (mode) => set({ rightSidebarMode: mode }),
      setProgress: (progress) => set({ progress }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume }),
      addToQueue: (rawTrack) => {
        const track = {
          videoId: rawTrack.videoId,
          name: rawTrack.name,
          artist: rawTrack.artist,
          thumbnails: rawTrack.thumbnails,
          duration: rawTrack.duration,
          isExplicit: rawTrack.isExplicit,
        };
        set((state) => ({ queue: [...state.queue, track] }));
      },
      setTrackToAdd: (rawTrack) => {
        const track = rawTrack ? {
          videoId: rawTrack.videoId,
          name: rawTrack.name,
          artist: rawTrack.artist,
          thumbnails: rawTrack.thumbnails,
          duration: rawTrack.duration,
          isExplicit: rawTrack.isExplicit,
        } : null;
        set({ trackToAdd: track });
      },
      setDominantColor: (color) => set({ dominantColor: color }),
      toggleShuffle: () => {
        const state = get();
        const newIsShuffle = !state.isShuffle;
        if (newIsShuffle) {
          const current = state.queue[state.queueIndex];
          const others = state.queue.filter((_, i) => i !== state.queueIndex);
          for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
          }
          const newQueue = [current, ...others];
          set({
            isShuffle: true,
            originalQueue: state.queue,
            queue: newQueue,
            queueIndex: 0
          });
        } else {
          const current = state.queue[state.queueIndex];
          const newQueue = state.originalQueue.length > 0 ? state.originalQueue : state.queue;
          let newIndex = newQueue.findIndex(t => t.videoId === current?.videoId);
          if (newIndex === -1) newIndex = 0;
          set({
            isShuffle: false,
            queue: newQueue,
            queueIndex: newIndex
          });
        }
      },
      toggleRepeat: () => {
        const current = get().repeatMode;
        const next = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
        set({ repeatMode: next });
      },

      reorderQueue: (startIndex: number, endIndex: number) => {
        const { queue } = get();
        const newQueue = Array.from(queue);
        const [reorderedItem] = newQueue.splice(startIndex, 1);
        newQueue.splice(endIndex, 0, reorderedItem);
        
        // Find new queueIndex to keep currentTrack playing
        const currentTrack = get().currentTrack;
        const newIndex = currentTrack ? newQueue.findIndex(t => t.videoId === currentTrack.videoId) : -1;
        
        set({ queue: newQueue, queueIndex: newIndex !== -1 ? newIndex : get().queueIndex });
      },

      setSleepTimer: (minutes: number | null) => {
        if (minutes === null) {
          set({ sleepTimer: null });
        } else {
          set({ sleepTimer: Date.now() + minutes * 60 * 1000 });
        }
      },
      setActiveMenuTrack: (track: Track | null) => set({ activeMenuTrack: track }),
    }),
    {
      name: 'player-storage',
      partialize: (state) => ({ 
        history: state.history, 
        playCounts: state.playCounts,
        volume: state.volume,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode
      }),
    }
  )
);

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  isAdmin?: boolean;
  joinDate: string;
  followers: number;
  following: number;
  totalListeningHours: number;
  bannerUrl?: string;
  sessionInfo?: { access_token: string; refresh_token: string };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  savedAccounts: User[];
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  removeSavedAccount: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      savedAccounts: [],
      login: (userData) => set((state) => {
        const filtered = state.savedAccounts.filter(a => a.id !== userData.id);
        const newAccounts = [userData, ...filtered].slice(0, 2);
        return { user: userData, isAuthenticated: true, savedAccounts: newAccounts };
      }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (data) => set((state) => {
        if (!state.user) return { user: null };
        const updatedUser = { ...state.user, ...data };
        return { 
          user: updatedUser,
          savedAccounts: state.savedAccounts.map(a => a.id === updatedUser.id ? updatedUser : a)
        };
      }),
      removeSavedAccount: (id) => set((state) => ({
        savedAccounts: state.savedAccounts.filter(a => a.id !== id)
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export interface SettingsState {
  dataSaver: boolean;
  reduceMotion: boolean;
  privateSession: boolean;
  gaplessPlayback: boolean;
  autoplay: boolean;
  autoPip: boolean;
  setDataSaver: (val: boolean) => void;
  setReduceMotion: (val: boolean) => void;
  setPrivateSession: (val: boolean) => void;
  setGaplessPlayback: (val: boolean) => void;
  setAutoplay: (val: boolean) => void;
  setAutoPip: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSaver: false,
      reduceMotion: false,
      privateSession: false,
      gaplessPlayback: true,
      autoplay: true,
      autoPip: false,
      setDataSaver: (val) => set({ dataSaver: val }),
      setReduceMotion: (val) => set({ reduceMotion: val }),
      setPrivateSession: (val) => set({ privateSession: val }),
      setGaplessPlayback: (val) => set({ gaplessPlayback: val }),
      setAutoplay: (val) => set({ autoplay: val }),
      setAutoPip: (val) => set({ autoPip: val }),
    }),
    {
      name: 'settings-storage',
    }
  )
);

export interface PartyMember {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
}

interface PartyState {
  roomId: string | null;
  isHost: boolean;
  members: PartyMember[];
  setParty: (roomId: string, isHost: boolean) => void;
  setMembers: (members: PartyMember[]) => void;
  leaveParty: () => void;
}

export const usePartyStore = create<PartyState>()(
  persist(
    (set) => ({
      roomId: null,
      isHost: false,
      members: [],
      setParty: (roomId, isHost) => set({ roomId, isHost }),
      setMembers: (members) => set({ members }),
      leaveParty: () => set({ roomId: null, isHost: false, members: [] }),
    }),
    {
      name: 'party-storage',
    }
  )
);
