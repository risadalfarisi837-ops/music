import { HomeSkeleton } from '@/components/HomeSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen pb-24">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
            <div>
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse mb-1" />
              <div className="h-5 w-28 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="flex overflow-x-hidden gap-2 px-5 pb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-16 rounded-full bg-white/5 animate-pulse shrink-0" />
          ))}
        </div>
      </div>
      <HomeSkeleton />
    </main>
  );
}
