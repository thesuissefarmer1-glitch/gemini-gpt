"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { Post } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/posts/PostCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

export default function PostsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
  
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));
      setPosts(loadedPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts with real-time updates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch posts.",
      });
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [user, toast]);

  const handleLikeToggle = async (postId: string) => {
    if (!user) return;
    
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likedBy?.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update like." });
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!user || !commentText.trim()) return;

    const postRef = doc(db, 'posts', postId);
    const newComment = {
      id: uuidv4(),
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      text: commentText,
      createdAt: Timestamp.fromDate(new Date()),
    };

    try {
      await updateDoc(postRef, {
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
    return null; // Auth guard will redirect
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-lg py-6 px-4">
        <h1 className="text-3xl font-bold mb-6 font-headline text-center">Feed</h1>
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikeToggle={handleLikeToggle}
                onAddComment={handleAddComment}
                currentUserId={user.uid}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No posts yet. Be the first to share something!</p>
            <Button asChild>
                <Link href="/create/post">Create Post</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
