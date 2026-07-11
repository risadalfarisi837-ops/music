import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
const spotify = require('spotify-url-info')(fetch);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing Spotify URL parameter' }, { status: 400 });
  }

  try {
    const data = await spotify.getData(url);
    
    if (!data || data.type !== 'playlist') {
      return NextResponse.json({ error: 'URL yang dimasukkan bukan playlist publik.' }, { status: 400 });
    }

    const tracks = (data.trackList || []).map((item: any) => ({
      title: item.title,
      artist: item.subtitle || 'Unknown Artist',
      duration: item.duration,
      coverUrl: item.coverArt?.sources?.[0]?.url || ''
    }));

    return NextResponse.json({
      id: data.id || 'imported',
      name: data.name || data.title,
      description: data.subtitle || '',
      owner: data.subtitle || '',
      coverUrl: data.coverArt?.sources?.[0]?.url || '',
      tracks,
    });
  } catch (error: any) {
    console.error('Spotify Scraper Error:', error);
    return NextResponse.json({ error: 'Gagal membaca playlist. Pastikan playlist diset ke Publik.' }, { status: 500 });
  }
}
