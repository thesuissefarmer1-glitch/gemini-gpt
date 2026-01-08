"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/posts/PostCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PostsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchPosts = async () => {
        try {
          const postsCollection = collection(db, 'posts');
          const q = query(postsCollection, orderBy('createdAt', 'desc'));
          const postSnapshot = await getDocs(q);
          const postsList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
          setPosts(postsList);
        } catch (error) {
          console.error("Error fetching posts:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch posts.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchPosts();
    }
  }, [user, toast]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    } catch (error) {
      console.error("Error liking post:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not like post." });
    }
  };

  const handleComment = (postId: string) => {
    toast({ title: "Coming Soon!", description: "Commenting feature is under development." });
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
              <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No posts yet. Be the first to share something!</p>
            <Button asChild>
                <Link href="/create">Create Post</Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
