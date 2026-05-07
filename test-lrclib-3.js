async function run() {
  const q = new URLSearchParams({ track_name: 'No Time To Die', artist_name: 'Billie Eilish' }).toString();
  const res = await fetch('https://lrclib.net/api/get?' + q);
  const data = await res.json();
  console.log(data);
}
run();
