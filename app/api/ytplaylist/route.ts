import { NextResponse } from 'next/server';
import { getYTMusic } from '@/lib/ytmusic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');
  
  if (!rawId || rawId === 'undefined' || rawId === 'null') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  // Prepend VL to RD lists to prevent 400 bad request errors
  const id = rawId.startsWith('RD') ? `VL${rawId}` : rawId;

  try {
    const ytmusic = await getYTMusic();
    try {
      const playlist = await ytmusic.getPlaylist(id) as any;
      let videos = playlist.videos || [];
      if (videos.length === 0) {
        try {
          videos = await ytmusic.getPlaylistVideos(id);
        } catch (e) {
          console.error('Failed to get playlist videos:', e);
        }
      }
      return NextResponse.json({
        ...playlist,
        videos: videos
      });
    } catch (e: any) {
      if (e?.name === 'ZodError') {
        // Suppress ZodError logs
      } else if (e?.message?.includes('split')) {
        // Suppress known split error for invalid playlist IDs
      } else {
        console.error('getPlaylist error:', e);
      }
      
      const album = await ytmusic.getAlbum(id);
      // Map album to playlist format
      return NextResponse.json({
        playlistId: album.albumId,
        name: album.name,
        artist: album.artist,
        thumbnails: album.thumbnails,
        videos: album.songs.map((song: any) => ({
          videoId: song.videoId,
          name: song.name,
          artist: song.artist || [album.artist],
          duration: song.duration,
          thumbnails: song.thumbnails || album.thumbnails,
        }))
      });
    }
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'ZodError', details: error.issues }, { status: 500 });
    }
    
    // Suppress 400 errors as they just mean the ID is invalid
    if (error?.isAxiosError && error?.response?.status === 400) {
      return NextResponse.json({ error: 'Invalid playlist/album ID', videos: [] }, { status: 200 });
    }
    
    console.error(`Error fetching playlist/album for id ${id}:`, error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
