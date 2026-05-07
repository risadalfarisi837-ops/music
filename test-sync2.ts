import YTMusic from 'ytmusic-api';
import fs from 'fs';
const ytmusic = new YTMusic();
async function run() {
  await ytmusic.initialize();
  const id = 'yl3TsqL0ZPw'; 
  const watchPlaylistData = await (ytmusic as any).constructRequest('next', { videoId: id });
  
  let lyricsId = null;
  const tabs = watchPlaylistData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
  
  if (tabs) {
    for (const tab of tabs) {
      if (tab.tabRenderer?.endpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === "MUSIC_PAGE_TYPE_TRACK_LYRICS") {
        lyricsId = tab.tabRenderer.endpoint.browseEndpoint.browseId;
        break;
      }
    }
  }

  if (lyricsId) {
    const lyricsData = await (ytmusic as any).constructRequest('browse', { browseId: lyricsId });
    fs.writeFileSync('synced-lyrics-yl.json', JSON.stringify(lyricsData, null, 2));
    console.log("Saved to synced-lyrics-yl.json");
  } else {
    console.log("No lyrics tab found");
  }
}
run();
