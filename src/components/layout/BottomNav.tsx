"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, PlusCircle, User, Settings, FileText, Camera, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { href: '/profile', icon: User, label: 'Profilo' },
  { href: '/shorts', icon: Video, label: 'Shorts' },
  { href: '/create', icon: PlusCircle, label: 'Crea' },
  { href: '/posts', icon: FileText, label: 'Post' },
  { href: '/settings', icon: Settings, label: 'Impostazioni' },
];

function CreateModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col items-center justify-center flex-1 cursor-pointer">
          <PlusCircle className="h-7 w-7 text-primary" strokeWidth={2.5} />
          <span className="text-xs mt-1 text-primary font-bold">Crea</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Crea</DialogTitle>
          <DialogDescription className="text-center">
            Cosa vuoi condividere oggi?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Link href="/create/short" className="block">
            <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-secondary transition-colors">
              <Camera className="w-8 h-8 text-accent" />
              <div>
                <p className="font-semibold">Crea uno Short</p>
                <p className="text-sm text-muted-foreground">Registra o carica un video.</p>
              </div>
            </div>
          </Link>
          <Link href="/create/post" className="block">
            <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-secondary transition-colors">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">Crea un Post</p>
                <p className="text-sm text-muted-foreground">Condividi un testo e una foto.</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4 p-4 rounded-lg opacity-50 cursor-not-allowed">
            <Radio className="w-8 h-8" />
            <div>
              <p className="font-semibold">Vai in Live</p>
              <p className="text-sm text-muted-foreground">Coming soon!</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-t-lg z-50 md:hidden">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          if (item.href === '/create') {
            return <CreateModal key={item.href} />;
          }

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
