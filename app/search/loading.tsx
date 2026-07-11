import { SearchSkeleton } from '@/components/SearchSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen pt-6 pb-24">
      <div className="px-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
        <div className="flex-1 h-10 bg-[#2A2A2A] rounded-full animate-pulse" />
      </div>
      <div className="flex overflow-x-hidden gap-3 mb-6 px-4">
        {['Semua', 'Lagu', 'Video', 'Album', 'Artis'].map(tab => (
          <div key={tab} className="h-9 w-16 rounded-full bg-white/5 animate-pulse shrink-0" />
        ))}
      </div>
      <div className="px-4">
        <SearchSkeleton />
      </div>
    </main>
  );
}
