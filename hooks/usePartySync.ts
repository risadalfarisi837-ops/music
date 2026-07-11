import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePartyStore, usePlayerStore, useAuthStore, Track } from '@/lib/store';

export function usePartySync(playerRef: React.MutableRefObject<any>) {
  const supabase = createClient();
  const { roomId, isHost, setMembers, leaveParty } = usePartyStore();
  const { user } = useAuthStore();
  const { currentTrack, isPlaying, progress, playTrack, setPlaying, setProgress } = usePlayerStore();
  
  const channelRef = useRef<any>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!roomId || !user?.id) return;

    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
        broadcast: {
          self: false,
          ack: true
        }
      },
    });

    channelRef.current = channel;

    // Handle Presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const membersList = Object.keys(state).map((key) => {
          const userState: any = state[key][0];
          return {
            id: userState.user_id,
            name: userState.name,
            avatarUrl: userState.avatar_url,
            isHost: userState.isHost,
          };
        });
        setMembers(membersList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (isHost && currentTrack) {
          // Send current state to newly joined user
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'sync_state',
              payload: {
                track: currentTrack,
                isPlaying,
                progress
              },
            });
          }, 1000);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // If host leaves, everyone leaves
        if (leftPresences[0]?.isHost) {
          leaveParty();
          alert('Host telah meninggalkan ruangan. Sesi selesai.');
        }
      });

    // Handle Broadcast (for Guests)
    if (!isHost) {
      channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        isSyncing.current = true;
        
        if (payload.track) {
          const currentId = usePlayerStore.getState().currentTrack?.videoId;
          if (payload.track.videoId !== currentId) {
            playTrack(payload.track, [payload.track], 'similar');
          }
        }
        
        if (payload.isPlaying !== undefined && payload.isPlaying !== usePlayerStore.getState().isPlaying) {
          setPlaying(payload.isPlaying);
          if (playerRef.current) {
            if (payload.isPlaying) playerRef.current.playVideo();
            else playerRef.current.pauseVideo();
          }
        }

        if (payload.progress !== undefined) {
          // Allow some threshold to prevent stuttering
          const currentProgress = usePlayerStore.getState().progress;
          if (Math.abs(payload.progress - currentProgress) > 2) {
            setProgress(payload.progress);
            if (playerRef.current) playerRef.current.seekTo(payload.progress, true);
          }
        }
        
        setTimeout(() => { isSyncing.current = false; }, 1000);
      });
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          name: user.name,
          avatar_url: user.avatarUrl,
          isHost: isHost
        });
        
        // Request sync from host when joining
        if (!isHost) {
          channel.send({
            type: 'broadcast',
            event: 'request_sync',
          });
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, user?.id, isHost]);

  // Host Broadcasting Effects
  useEffect(() => {
    if (isHost && channelRef.current) {
      const handleRequestSync = () => {
        const state = usePlayerStore.getState();
        if (state.currentTrack) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'sync_state',
            payload: { 
              track: state.currentTrack,
              isPlaying: state.isPlaying,
              progress: state.progress
            }
          });
        }
      };

      channelRef.current.on('broadcast', { event: 'request_sync' }, handleRequestSync);
    }
  }, [isHost]);

  useEffect(() => {
    if (isHost && channelRef.current && currentTrack && !isSyncing.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: { track: currentTrack }
      });
    }
  }, [currentTrack, isHost]);

  useEffect(() => {
    if (isHost && channelRef.current && !isSyncing.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: { isPlaying }
      });
    }
  }, [isPlaying, isHost]);

  // Only broadcast seek, avoid broadcasting normal ticking progress
  const lastBroadcastProgress = useRef(0);
  useEffect(() => {
    if (isHost && channelRef.current && !isSyncing.current) {
      if (Math.abs(progress - lastBroadcastProgress.current) > 2) {
        lastBroadcastProgress.current = progress;
        channelRef.current.send({
          type: 'broadcast',
          event: 'sync_state',
          payload: { progress }
        });
      }
    }
  }, [progress, isHost]);
}
