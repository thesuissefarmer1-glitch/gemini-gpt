"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Short } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import ShortPlayer from '@/components/shorts/ShortPlayer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ShortsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchShorts = async () => {
        try {
          const shortsCollection = collection(db, 'shorts');
          const q = query(shortsCollection, orderBy('createdAt', 'desc'));
          const shortSnapshot = await getDocs(q);
          const shortsList = shortSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short));
          setShorts(shortsList);
        } catch (error) {
          console.error("Error fetching shorts:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not fetch shorts." });
        } finally {
          setLoading(false);
        }
      };
      fetchShorts();
    }
  }, [user, toast]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
        setCurrentShortIndex(index);
      }
    });
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.6,
    });
    
    const elements = document.querySelectorAll('[data-index]');
    elements.forEach(el => observer.current?.observe(el));

    return () => {
      elements.forEach(el => observer.current?.unobserve(el));
    };
  }, [shorts, handleIntersection]);
  
  const handleLike = async (shortId: string) => {
    if (!user) return;
    try {
      const shortRef = doc(db, 'shorts', shortId);
      await updateDoc(shortRef, { likes: increment(1) });
      setShorts(shorts.map(s => s.id === shortId ? { ...s, likes: s.likes + 1 } : s));
    } catch (error) {
      console.error("Error liking short:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not like short." });
    }
  };

  const handleComment = (shortId: string) => {
    toast({ title: "Coming Soon!", description: "Commenting feature is under development." });
  };
  
  if (authLoading || loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] md:h-screen w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden bg-black">
        {shorts.length > 0 ? (
          shorts.map((short, index) => (
            <div key={short.id} data-index={index} className="h-full w-full">
              <ShortPlayer
                short={short}
                onLike={handleLike}
                onComment={handleComment}
                isActive={index === currentShortIndex}
              />
            </div>
          ))
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center text-white p-4">
            <p className="text-muted-foreground mb-4">No shorts yet. Be the first to upload one!</p>
            <Button asChild>
                <Link href="/create">Upload Short</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
