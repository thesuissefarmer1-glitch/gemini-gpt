"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateProfile } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { uploadFile } from '@/lib/uploadHelper';
import type { Post, Short, UserProfile } from '@/types';

import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Video, LoaderCircle, Edit } from 'lucide-react';

const profileFormSchema = z.object({
  displayName: z.string().min(3, 'Username must be at least 3 characters.').max(50, "Username can't exceed 50 characters."),
  bio: z.string().max(160, "Bio can't exceed 160 characters.").optional(),
  photoURL: z.any().optional(),
  coverImageUrl: z.any().optional(),
});

function EditProfileModal({ user, userProfile, onProfileUpdate }: { user: any, userProfile: UserProfile, onProfileUpdate: (data: UserProfile) => void }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userProfile.displayName || '',
      bio: userProfile.bio || '',
    },
  });

  const photoFileRef = form.register('photoURL');
  const coverFileRef = form.register('coverImageUrl');

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    setIsSaving(true);
    try {
      let photoUrl = userProfile.photoURL;
      let coverUrl = userProfile.coverImageUrl;

      const photoFile = values.photoURL?.[0];
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, 'avatars', user.uid);
      }

      const coverFile = values.coverImageUrl?.[0];
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'covers', user.uid);
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, {
        displayName: values.displayName,
        photoURL: photoUrl,
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = {
        displayName: values.displayName,
        bio: values.bio,
        photoURL: photoUrl,
        coverImageUrl: coverUrl,
      };
      await updateDoc(userDocRef, updatedData);

      onProfileUpdate({
        ...userProfile,
        ...updatedData
      });
      
      toast({ title: "Success", description: "Profile updated successfully." });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about yourself" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...photoFileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...coverFileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthGuard();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setLoadingContent(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          }

          const postsQuery = query(collection(db, 'posts'), where('authorId', '==', user.uid));
          const postsSnapshot = await getDocs(postsQuery);
          setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));

          const shortsQuery = query(collection(db, 'shorts'), where('authorId', '==', user.uid));
          const shortsSnapshot = await getDocs(shortsQuery);
          setShorts(shortsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Short)));
        } catch (error) {
          console.error("Error fetching user content:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data.' });
        } finally {
          setLoadingContent(false);
        }
      };
      fetchUserData();
    }
  }, [user, toast]);
  
  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  if (authLoading || !user || !userProfile) {
    return <FullScreenLoader />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl py-6 px-4">
        <header className="mb-8">
          <div className="relative h-48 w-full rounded-lg bg-secondary mb-[-48px]">
            {userProfile.coverImageUrl && (
              <Image src={userProfile.coverImageUrl} alt="Cover image" fill style={{ objectFit: 'cover' }} className="rounded-lg" data-ai-hint="background landscape" />
            )}
          </div>
          <div className="flex items-end px-4">
             <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background bg-background">
                  <AvatarImage src={userProfile.photoURL || undefined} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-4xl">{userProfile.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
             </div>
             <div className="ml-4 mb-2 flex-grow">
                <h1 className="text-3xl font-bold font-headline">{userProfile.displayName}</h1>
                <p className="text-muted-foreground">{userProfile.email}</p>
             </div>
             <div className="mb-2">
                <EditProfileModal user={user} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />
             </div>
          </div>
          <div className="mt-4 px-4">
            <p className="text-sm text-foreground">{userProfile.bio || "No bio yet."}</p>
          </div>
        </header>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="shorts">Shorts</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
             {loadingContent ? <div className="text-center py-10"><LoaderCircle className="animate-spin h-8 w-8 mx-auto" /></div> : posts.length > 0 ? (
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
            {loadingContent ? <div className="text-center py-10"><LoaderCircle className="animate-spin h-8 w-8 mx-auto" /></div> : shorts.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
                    {shorts.map(short => (
                        <Card key={short.id} className="overflow-hidden">
                           <div className="relative aspect-[9/16] bg-black">
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

    