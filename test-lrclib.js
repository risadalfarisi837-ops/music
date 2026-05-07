async function run() {
  const q = new URLSearchParams({ track_name: 'Bohemian Rhapsody', artist_name: 'Queen' }).toString();
  const res = await fetch('https://lrclib.net/api/get?' + q);
  const data = await res.json();
  console.log(data);
}
run();
