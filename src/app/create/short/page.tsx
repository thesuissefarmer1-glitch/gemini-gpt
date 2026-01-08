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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  caption: z.string().max(150, { message: "Caption can't exceed 150 characters."}).optional(),
  video: z.any().refine(files => files?.length === 1, "A video file is required."),
});

export default function CreateShortPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { caption: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    setIsLoading(true);
    setUploadProgress(0);

    const videoFile = values.video?.[0];
    if (!videoFile) {
        toast({ variant: 'destructive', title: 'Error', description: 'No video file selected.' });
        setIsLoading(false);
        return;
    }

    try {
      // Dummy progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const storageRef = ref(storage, `shorts/${user.uid}/${Date.now()}_${videoFile.name}`);
      const uploadResult = await uploadBytes(storageRef, videoFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const videoUrl = await getDownloadURL(uploadResult.ref);
      
      await addDoc(collection(db, 'shorts'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        caption: values.caption || '',
        videoUrl,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
      });

      toast({ title: 'Success', description: 'Your short has been uploaded.' });
      router.push('/shorts');

    } catch (error: any) {
      console.error('Error uploading short:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload short.' });
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
            <CardTitle>Upload a New Short</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video File</FormLabel>
                      <FormControl>
                        <Input type="file" accept="video/*" {...form.register('video')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caption (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe your short..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isLoading && (
                  <div className="space-y-2">
                    <Label>Uploading...</Label>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Short
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
