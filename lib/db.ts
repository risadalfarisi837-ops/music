import { createClient } from '@/lib/supabase/client';
import { Track } from './store';

export interface SavedAlbum {
  albumId: string;
  name: string;
  artist: string;
  thumbnails: { url: string; width: number; height: number }[];
  savedAt: number;
}

export interface SubscribedArtist {
  artistId: string;
  name: string;
  thumbnails: { url: string; width: number; height: number }[];
  subscribedAt: number;
}

export interface RecentSearch {
  query: string;
  timestamp: number;
}

export interface PlayHistory {
  id: string;
  user_id: string;
  video_id: string;
  track_data: Track;
  played_at: string;
}

import { useAuthStore } from './store';

const supabase = createClient();

async function getUserId() {
  // Use Zustand store for instant synchronous lookup instead of slow Supabase getSession
  return useAuthStore.getState().user?.id || null;
}

export const db = {
  // PLAYLISTS
  async getPlaylists() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('playlists').select('*').eq('user_id', userId);
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },
  async addPlaylist(playlist: { id: string; name: string; img: string; tracks: Track[] }) {
    const userId = await getUserId();
    if (!userId) {
      alert("Gagal membuat playlist: Anda harus login terlebih dahulu.");
      return;
    }
    
    // Check if updating or inserting
    const { data: existing } = await supabase.from('playlists').select('id').eq('id', playlist.id).eq('user_id', userId).maybeSingle();
    
    let error;
    if (existing) {
      const res = await supabase.from('playlists').update({ name: playlist.name, img: playlist.img, tracks: playlist.tracks }).eq('id', playlist.id).eq('user_id', userId);
      error = res.error;
    } else {
      const res = await supabase.from('playlists').insert([{ ...playlist, user_id: userId }]);
      error = res.error;
    }
    
    if (error) {
      console.error(error);
      alert("Terjadi kesalahan pada database: " + error.message);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));
  },
  async getPlaylist(id: string) {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from('playlists').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) return null;
    return data;
  },
  async deletePlaylist(id: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('playlists').delete().eq('id', id).eq('user_id', userId);
    if (error) console.error(error);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('playlistsUpdated'));
  },
  
  // LIKED SONGS
  // PLAY HISTORY
  async addToHistory(track: Track) {
    const userId = await getUserId();
    if (!userId) return;

    // Remove existing entry for this track to avoid duplicates (moves to top)
    await supabase.from('play_history').delete().eq('user_id', userId).eq('video_id', track.videoId);

    const { error } = await supabase.from('play_history').insert({
      user_id: userId,
      video_id: track.videoId,
      track_data: track,
    });

    if (error) console.error('Failed to add to play_history:', error);
  },

  async getHistory(): Promise<{ track: Track; playedAt: number }[]> {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('play_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch play_history:', error);
      return [];
    }

    // Deduplicate in case there are already duplicates in the database
    const uniqueTracks = new Map();
    for (const d of data) {
      if (!uniqueTracks.has(d.video_id)) {
        uniqueTracks.set(d.video_id, {
          track: d.track_data as Track,
          playedAt: new Date(d.played_at).getTime()
        });
      }
    }

    return Array.from(uniqueTracks.values()).slice(0, 50);
  },

  // FOLLOW SYSTEM
  async followUser(followingId: string) {
    const followerId = await getUserId();
    if (!followerId || followerId === followingId) return { error: 'Invalid action' };

    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId
    });
    return { error };
  },

  async unfollowUser(followingId: string) {
    const followerId = await getUserId();
    if (!followerId) return { error: 'Not logged in' };

    const { error } = await supabase.from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });
    return { error };
  },

  async checkIsFollowing(followingId: string) {
    const followerId = await getUserId();
    if (!followerId) return false;

    const { data } = await supabase.from('follows')
      .select('follower_id')
      .match({ follower_id: followerId, following_id: followingId })
      .maybeSingle();

    return !!data;
  },

  async getFollowers(userId: string) {
    const { data: follows } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
    if (!follows || !follows.length) return [];
    
    const ids = follows.map(f => f.follower_id);
    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', ids);
    return profiles || [];
  },

  async getFollowing(userId: string) {
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    if (!follows || !follows.length) return [];
    
    const ids = follows.map(f => f.following_id);
    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', ids);
    return profiles || [];
  },

  async getFollowCounts(userId: string) {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);
    return { followers: followers || 0, following: following || 0 };
  },

  async getLikedSongs() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('liked_songs').select('track_data').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data.map(d => d.track_data);
  },
  async addLikedSong(track: Track) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('liked_songs').upsert({ user_id: userId, video_id: track.videoId, track_data: track }, { onConflict: 'user_id,video_id' });
    if (error) console.error(error);
  },
  async removeLikedSong(videoId: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('liked_songs').delete().eq('video_id', videoId).eq('user_id', userId);
    if (error) console.error(error);
  },
  async isLiked(videoId: string) {
    const userId = await getUserId();
    if (!userId) return false;
    const { data, error } = await supabase.from('liked_songs').select('video_id').eq('video_id', videoId).eq('user_id', userId).maybeSingle();
    if (error || !data) return false;
    return true;
  },

  // SUBSCRIBED ARTISTS
  async getSubscribedArtists() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('subscribed_artists').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
  async addSubscribedArtist(artist: SubscribedArtist) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('subscribed_artists').upsert({ user_id: userId, artist_id: artist.artistId, name: artist.name, thumbnails: artist.thumbnails }, { onConflict: 'user_id,artist_id' });
    if (error) console.error(error);
  },
  async removeSubscribedArtist(artistId: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('subscribed_artists').delete().eq('artist_id', artistId).eq('user_id', userId);
    if (error) console.error(error);
  },
  async isSubscribed(artistId: string) {
    const userId = await getUserId();
    if (!userId) return false;
    const { data, error } = await supabase.from('subscribed_artists').select('artist_id').eq('artist_id', artistId).eq('user_id', userId).maybeSingle();
    return !!data;
  },

  // SAVED ALBUMS
  async getSavedAlbums() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('saved_albums').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
  async addSavedAlbum(album: SavedAlbum) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('saved_albums').upsert({ user_id: userId, album_id: album.albumId, name: album.name, artist: album.artist, thumbnails: album.thumbnails }, { onConflict: 'user_id,album_id' });
    if (error) console.error(error);
  },
  async removeSavedAlbum(albumId: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('saved_albums').delete().eq('album_id', albumId).eq('user_id', userId);
    if (error) console.error(error);
  },
  async isAlbumSaved(albumId: string) {
    const userId = await getUserId();
    if (!userId) return false;
    const { data, error } = await supabase.from('saved_albums').select('album_id').eq('album_id', albumId).eq('user_id', userId).maybeSingle();
    return !!data;
  },

  // NOTIFICATIONS
  async getNotifications() {
    const userId = await getUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // GLOBAL NOTIFICATIONS
  async getGlobalNotifications() {
    try {
      const { data, error } = await supabase
        .from('global_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // RECENT SEARCHES
  async getRecentSearches() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('recent_searches').select('query, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) return [];
    return data?.map(d => ({ query: d.query, timestamp: new Date(d.created_at).getTime() })) || [];
  },
  async addRecentSearch(query: string) {
    const userId = await getUserId();
    if (!userId) return;
    
    // Insert new search
    const { error } = await supabase.from('recent_searches').upsert({ user_id: userId, query }, { onConflict: 'user_id,query' });
    if (error) console.error(error);

    // Enforce limit of 20 by deleting oldest if count > 20
    const { data } = await supabase.from('recent_searches').select('id').eq('user_id', userId).order('created_at', { ascending: false });
    if (data && data.length > 20) {
      const idsToDelete = data.slice(20).map(d => d.id);
      await supabase.from('recent_searches').delete().in('id', idsToDelete);
    }
  },
  async removeRecentSearch(query: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('recent_searches').delete().eq('query', query).eq('user_id', userId);
    if (error) console.error(error);
  },
  async clearRecentSearches() {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await supabase.from('recent_searches').delete().eq('user_id', userId);
    if (error) console.error(error);
  },

  // CLEAR ALL DATA
  async clearAllData() {
    const userId = await getUserId();
    if (!userId) return;
    await Promise.all([
      supabase.from('playlists').delete().eq('user_id', userId),
      supabase.from('liked_songs').delete().eq('user_id', userId),
      supabase.from('subscribed_artists').delete().eq('user_id', userId),
      supabase.from('saved_albums').delete().eq('user_id', userId),
      supabase.from('recent_searches').delete().eq('user_id', userId)
    ]);
  },

  // ============================================================
  // MESSAGING / CHAT
  // ============================================================

  /** Ambil semua ruang obrolan yang diikuti user saat ini, beserta pesan terakhir */
  async getChatRooms() {
    const userId = await getUserId();
    if (!userId) return [];

    // Ambil room_id yang diikuti user ini
    const { data: memberships, error: mErr } = await supabase
      .from('chat_members')
      .select('room_id')
      .eq('user_id', userId);

    if (mErr || !memberships?.length) return [];

    const roomIds = memberships.map(m => m.room_id);

    // Ambil data tiap room + anggota + pesan terakhir
    const { data: rooms, error: rErr } = await supabase
      .from('chat_rooms')
      .select(`
        id, name, is_group, avatar_url, created_at,
        chat_members ( user_id ),
        messages ( id, text, created_at, sender_id )
      `)
      .in('id', roomIds)
      .order('created_at', { referencedTable: 'messages', ascending: false });

    if (rErr) return [];
    return rooms || [];
  },

  /** Buat obrolan 1-on-1 dengan pengguna lain. Jika sudah ada, kembalikan yang lama. */
  async getOrCreateDMRoom(otherUserId: string) {
    const userId = await getUserId();
    if (!userId || userId === otherUserId) return null;

    // Cek apakah sudah ada room DM antara kedua user ini
    const { data: myRooms } = await supabase
      .from('chat_members')
      .select('room_id')
      .eq('user_id', userId);

    if (myRooms?.length) {
      const myRoomIds = myRooms.map(r => r.room_id);
      const { data: shared } = await supabase
        .from('chat_members')
        .select('room_id')
        .eq('user_id', otherUserId)
        .in('room_id', myRoomIds);

      if (shared?.length) {
        // Verifikasi ini adalah DM (bukan grup)
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('id', shared[0].room_id)
          .eq('is_group', false)
          .maybeSingle();
        if (room) return room.id;
      }
    }

    // Buat room baru
    const { data: newRoom, error } = await supabase
      .from('chat_rooms')
      .insert({ is_group: false })
      .select('id')
      .single();

    if (error || !newRoom) return null;

    // Tambahkan kedua user sebagai anggota
    await supabase.from('chat_members').insert([
      { room_id: newRoom.id, user_id: userId },
      { room_id: newRoom.id, user_id: otherUserId },
    ]);

    return newRoom.id;
  },

  /** Ambil semua pesan dalam satu room */
  async getMessages(roomId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, text, sender_id, created_at, reply_to_id, is_edited, is_deleted, message_reactions(emoji, user_id)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data || [];
  },

  /** Kirim pesan ke sebuah room */
  async sendMessage(roomId: string, text: string, replyToId?: string) {
    const userId = await getUserId();
    if (!userId || !text.trim()) return null;

    const { data, error } = await supabase
      .from('messages')
      .insert({ 
        room_id: roomId, 
        sender_id: userId, 
        text: text.trim(),
        ...(replyToId && { reply_to_id: replyToId })
      })
      .select()
      .single();

    if (error) { console.error(error); return null; }
    return data;
  },

  async editMessage(messageId: string, newText: string) {
    const userId = await getUserId();
    if (!userId || !newText.trim()) return false;

    const { error } = await supabase
      .from('messages')
      .update({ text: newText.trim(), is_edited: true })
      .eq('id', messageId)
      .eq('sender_id', userId);
    
    if (error) { console.error(error); return false; }
    return true;
  },

  async deleteMessage(messageId: string) {
    const userId = await getUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true, text: 'Pesan ini telah dihapus' })
      .eq('id', messageId)
      .eq('sender_id', userId);
    
    if (error) { console.error(error); return false; }
    return true;
  },

  async toggleMessageReaction(messageId: string, emoji: string) {
    const userId = await getUserId();
    if (!userId) return;

    // Check if exists
    const { data } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (data) {
      await supabase.from('message_reactions').delete().eq('id', data.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: userId,
        emoji
      });
    }
  },

  /** Ambil info anggota sebuah room (profil pengguna lain) */
  async getRoomMembers(roomId: string) {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('room_id', roomId);

    if (error) return [];
    // Kembalikan semua user_id kecuali diri sendiri
    return (data || []).map(m => m.user_id).filter(id => id !== userId);
  },

  // SOCIAL & CHAT
  async blockUser(userIdToBlock: string) {
    const userId = await getUserId();
    if (!userId) return false;
    const { error } = await supabase.from('blocks').insert({ blocker_id: userId, blocked_id: userIdToBlock });
    if (error) return false;
    // Remove follows
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', userIdToBlock);
    await supabase.from('follows').delete().eq('follower_id', userIdToBlock).eq('following_id', userId);
    return true;
  },

  async searchUsers(query: string) {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .ilike('name', `%${query}%`)
      .neq('id', userId)
      .limit(20);
    if (error) return [];
    return data || [];
  },

  async createDirectChat(otherUserId: string) {
    const userId = await getUserId();
    if (!userId) return null;

    // First check if room already exists
    // Since we don't have a reliable RPC, we check manually
    const { data: myRooms } = await supabase.from('chat_members').select('room_id').eq('user_id', userId);
    if (myRooms && myRooms.length > 0) {
      const roomIds = myRooms.map(r => r.room_id);
      const { data: commonRooms } = await supabase.from('chat_members')
        .select('room_id')
        .eq('user_id', otherUserId)
        .in('room_id', roomIds);
      
      if (commonRooms && commonRooms.length > 0) {
        // Find one that is NOT a group
        const { data: directRoom } = await supabase.from('chat_rooms')
          .select('id')
          .in('id', commonRooms.map(r => r.room_id))
          .eq('is_group', false)
          .maybeSingle();
        
        if (directRoom) return directRoom.id;
      }
    }

    // Create new room
    const { data: room, error: roomError } = await supabase.from('chat_rooms').insert({ is_group: false }).select().single();
    if (roomError || !room) return null;

    await supabase.from('chat_members').insert([
      { room_id: room.id, user_id: userId },
      { room_id: room.id, user_id: otherUserId }
    ]);
    return room.id;
  },

  async createGroupChat(name: string, memberIds: string[]) {
    const userId = await getUserId();
    if (!userId) return null;

    const { data: room, error: roomError } = await supabase.from('chat_rooms').insert({ is_group: true, name }).select().single();
    if (roomError || !room) return null;

    const members = [userId, ...memberIds].map(id => ({ room_id: room.id, user_id: id }));
    await supabase.from('chat_members').insert(members);
    return room.id;
  },

  // STORIES
  async getStories() {
    const userId = await getUserId();
    if (!userId) return [];
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('stories')
      .select('id, user_id, track_data, caption, created_at, profiles(name, avatar_url)')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  },
  
  async addStory(track_data: any, caption: string = '') {
    const userId = await getUserId();
    if (!userId) return;
    
    await supabase.from('stories').insert({
      user_id: userId,
      track_data,
      caption
    });
  },

  async deleteStory(storyId: string) {
    const userId = await getUserId();
    if (!userId) return false;
    
    const { error } = await supabase.from('stories').delete().eq('id', storyId).eq('user_id', userId);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  },

  async markStoryAsViewed(storyId: string) {
    const userId = await getUserId();
    if (!userId) return;
    
    await supabase.from('story_views').insert({
      story_id: storyId,
      user_id: userId
    }).select().maybeSingle(); // Use maybeSingle to suppress error on conflict if we handle it or just let it fail silently on duplicate
  },

  async getViewedStoryIds() {
    const userId = await getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      return [];
    }
    return data.map(d => d.story_id);
  },

  async getStoryViewers(storyId: string) {
    const userId = await getUserId();
    if (!userId) return [];

    // Verify ownership first (only creator can see viewers)
    const { data: storyData } = await supabase.from('stories').select('user_id').eq('id', storyId).single();
    if (storyData?.user_id !== userId) return [];

    const { data, error } = await supabase
      .from('story_views')
      .select('user_id')
      .eq('story_id', storyId);

    if (error || !data || data.length === 0) return [];
    
    // Get profiles for those users
    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds);
    
    return profiles || [];
  },

  // LEADERBOARD
  async getLeaderboard() {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('user_id, total_plays')
      .limit(10);
      
    if (error || !data) return [];
    
    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    return data.map(d => {
      const p = profiles?.find(prof => prof.id === d.user_id);
      return {
        ...d,
        name: p?.name || 'Pengguna',
        avatar_url: p?.avatar_url || null
      };
    }).sort((a, b) => b.total_plays - a.total_plays);
  },

  async getSavedStickers() {
    const userId = await getUserId();
    if (!userId) return [];
    const { data, error } = await supabase.from('saved_stickers').select('id, url').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async saveSticker(url: string) {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase.from('saved_stickers').insert({ user_id: userId, url }).select().single();
    if (error) return null;
    return data;
  },

  async deleteSavedSticker(id: string) {
    const { error } = await supabase.from('saved_stickers').delete().eq('id', id);
    return !error;
  }
};
