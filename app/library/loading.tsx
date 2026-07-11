export default function Loading() {
  return (
    <main className="min-h-screen pt-6 pb-24 animate-pulse">
      <div className="px-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="h-7 w-32 bg-white/10 rounded" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex overflow-x-hidden gap-3 mb-6 px-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-20 rounded-full bg-white/5 shrink-0" />
        ))}
      </div>

      {/* Playlist grid skeleton */}
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-14 h-14 rounded-lg bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
