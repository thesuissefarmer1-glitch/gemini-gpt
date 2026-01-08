"use client";

import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post, Short } from '@/types';
import Image from 'next/image';
import { Video } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [posts, setPosts] = useState<Post[]>([]);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchContent = async () => {
        setLoadingContent(true);
        try {
          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', user.uid));
          const postsSnapshot = await getDocs(postsQuery);
          setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));

          const shortsQuery = query(collection(db, 'shorts'), where('authorId', '==', user.uid));
          const shortsSnapshot = await getDocs(shortsQuery);
          setShorts(shortsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short)));
        } catch (error) {
          console.error("Error fetching user content:", error);
        } finally {
          setLoadingContent(false);
        }
      };
      fetchContent();
    }
  }, [user]);
  
  if (authLoading) {
    return <FullScreenLoader />;
  }
  if (!user) {
    return null; // Auth guard will redirect
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl py-6 px-4">
        <header className="flex flex-col items-center gap-4 mb-8">
          <Avatar className="w-24 h-24 border-4 border-primary">
            <AvatarImage src={user.photoURL || undefined} data-ai-hint="person portrait" />
            <AvatarFallback className="text-4xl">{user.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">{user.displayName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="shorts">Shorts</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
             {loadingContent ? <p>Loading posts...</p> : posts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {posts.map(post => (
                        <Card key={post.id} className="overflow-hidden">
                           {post.imageUrl ? (
                             <div className="relative aspect-square">
                               <Image src={post.imageUrl} alt="Post" fill style={{ objectFit: 'cover' }} />
                             </div>
                           ) : (
                             <CardContent className="p-4 aspect-square flex items-center justify-center">
                               <p className="text-sm text-muted-foreground line-clamp-4">{post.text}</p>
                             </CardContent>
                           )}
                        </Card>
                    ))}
                </div>
             ) : (
                <p className="text-center text-muted-foreground mt-8">No posts yet.</p>
             )}
          </TabsContent>
          <TabsContent value="shorts">
            {loadingContent ? <p>Loading shorts...</p> : shorts.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                    {shorts.map(short => (
                        <Card key={short.id} className="overflow-hidden">
                           <div className="relative aspect-taller bg-black">
                             <video src={short.videoUrl} className="h-full w-full object-cover" />
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Video className="h-6 w-6 text-white/80" />
                             </div>
                           </div>
                        </Card>
                    ))}
                </div>
             ) : (
                <p className="text-center text-muted-foreground mt-8">No shorts yet.</p>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
