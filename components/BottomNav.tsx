'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth and admin pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return null;


  const navItems = [
    { name: 'Beranda', href: '/', icon: Home },
    { name: 'Mencari', href: '/search', icon: Search },
    { name: 'Pustaka', href: '/library', icon: Library },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden">
      {/* Gradient fade above nav */}
      <div className="absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      
      {/* Main nav container */}
      <div className="relative bg-[#0A0A0A]/90 backdrop-blur-2xl border-t border-white/[0.06]">
        <div className="flex justify-around items-center h-[68px] px-4 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className="relative flex flex-col items-center justify-center w-16 h-full group"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-[1px] w-12 h-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-white/[0.08]" 
                    : "group-hover:bg-white/[0.04]"
                )}>
                  {/* Active glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-white/10 blur-sm" />
                  )}
                  <item.icon 
                    className={cn(
                      "relative w-[22px] h-[22px] transition-all duration-300",
                      isActive 
                        ? "text-white" 
                        : "text-white/40 group-hover:text-white/70"
                    )} 
                    strokeWidth={isActive ? 2.5 : 1.8} 
                  />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] mt-0.5 font-medium tracking-wide transition-all duration-300",
                  isActive 
                    ? "text-white" 
                    : "text-white/35 group-hover:text-white/60"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
