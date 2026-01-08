"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, PlusCircle, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/posts', icon: Home, label: 'Posts' },
  { href: '/shorts', icon: Video, label: 'Shorts' },
  { href: '/create', icon: PlusCircle, label: 'Create' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-t-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = (item.href === '/posts' && pathname === '/') || pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center flex-1">
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                    "text-xs mt-1",
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                )}>
                    {item.label}
                </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
