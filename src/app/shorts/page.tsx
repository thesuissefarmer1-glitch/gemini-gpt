"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { Short } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import ShortPlayer from '@/components/shorts/ShortPlayer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function ShortsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'shorts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shortsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short));
      setShorts(shortsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shorts:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch shorts." });
      setLoading(false);
    });

    return () => unsubscribe();
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
        if (observer.current) {
            elements.forEach(el => observer.current!.unobserve(el));
        }
    };
  }, [shorts, handleIntersection]);
  
  const handleLikeToggle = async (shortId: string) => {
    if (!user) return;
    
    const shortRef = doc(db, 'shorts', shortId);
    const short = shorts.find(s => s.id === shortId);
    if (!short) return;

    const isLiked = short.likedBy?.includes(user.uid);
    try {
      if (isLiked) {
        await updateDoc(shortRef, { likedBy: arrayRemove(user.uid) });
      } else {
        await updateDoc(shortRef, { likedBy: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Error toggling like on short:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update like." });
    }
  };

  const handleAddComment = async (shortId: string, commentText: string) => {
    if (!user || !commentText.trim()) return;

    const shortRef = doc(db, 'shorts', shortId);
    const newComment = {
      id: uuidv4(),
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      text: commentText,
      createdAt: serverTimestamp(),
    };

    try {
      await updateDoc(shortRef, {
        comments: arrayUnion(newComment),
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add comment." });
    }
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
                onLikeToggle={handleLikeToggle}
                onAddComment={handleAddComment}
                isActive={index === currentShortIndex}
                currentUserId={user.uid}
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
