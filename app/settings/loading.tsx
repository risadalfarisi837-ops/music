export default function Loading() {
  return (
    <main className="min-h-screen pt-6 pb-24 animate-pulse">
      <div className="px-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="h-7 w-32 bg-white/10 rounded" />
      </div>

      {/* Settings items skeleton */}
      <div className="px-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03]">
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
