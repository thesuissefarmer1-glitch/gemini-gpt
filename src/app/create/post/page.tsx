"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';

import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle } from 'lucide-react';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Post cannot be empty.' }).max(500, { message: "Post can't exceed 500 characters."}),
  image: z.any().optional(),
});

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    setIsLoading(true);

    try {
      let imageUrl: string | undefined = undefined;
      const imageFile = values.image?.[0];

      if (imageFile) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        text: values.text,
        imageUrl,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
      });

      toast({ title: 'Success', description: 'Your post has been published.' });
      router.push('/posts');

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create post.' });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (authLoading) return <FullScreenLoader />;
  if (!user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto max-w-lg py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's on your mind?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Share your thoughts..." {...field} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add an image (optional)</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" {...form.register('image')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Post
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
