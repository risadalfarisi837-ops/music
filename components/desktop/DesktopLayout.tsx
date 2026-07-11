'use client';

import { ReactNode } from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { ChatList } from '@/components/ChatList';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '@/lib/store';

export function DesktopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRightSidebarOpen = usePlayerStore((state) => state.isRightSidebarOpen);
  
  // Hide desktop shell on auth and admin pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <>
      {/* 
        Mobile View: 
        We just render the children normally. 
        The layout uses standard scrolling on mobile. 
      */}
      <div className="lg:hidden h-full">
        {children}
      </div>

      {/* 
        Desktop View (lg: and above): 
        Spotify-like 3 panel layout 
      */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-90px)] w-full overflow-hidden bg-black p-2 gap-2">
        {/* Top Area (Navbar) */}
        <div className="h-16 shrink-0 rounded-lg relative z-50">
          <TopBar />
        </div>

        {/* Main 3-Panel Area */}
        <div className="flex flex-1 gap-2 overflow-hidden min-h-0">
          
          {/* Left Sidebar (Library or Chat) */}
          <div className="w-[320px] shrink-0 xl:w-[380px] flex flex-col min-h-0">
            {pathname.startsWith('/messages') ? <ChatList /> : <LeftSidebar />}
          </div>

          {/* Center Main Content */}
          <main className={`flex-1 bg-zinc-900 rounded-lg relative min-w-0 flex flex-col ${pathname.startsWith('/messages') ? '' : 'overflow-y-auto'}`}>
            <div className={pathname.startsWith('/messages') ? 'flex-1 min-h-0 h-full' : 'pb-10'}>
              {children}
            </div>
          </main>

          {/* Right Sidebar (Now Playing) */}
          {isRightSidebarOpen && (
            <div className="w-[320px] shrink-0 xl:w-[380px] hidden xl:flex flex-col min-h-0">
              <RightSidebar />
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}
