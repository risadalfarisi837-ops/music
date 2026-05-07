async function run() {
  const q = new URLSearchParams({ track_name: 'How I Met My Ex', artist_name: 'Dave' }).toString();
  const res = await fetch('https://lrclib.net/api/get?' + q);
  const data = await res.json();
  console.log(data);
}
run();
