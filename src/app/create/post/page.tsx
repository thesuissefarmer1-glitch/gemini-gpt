"use client";

import { useState, useRef, useEffect } from 'react';
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
import { LoaderCircle, Camera, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  text: z.string().min(1, { message: 'Post cannot be empty.' }).max(500, { message: "Post can't exceed 500 characters."}),
  image: z.any().optional(),
});

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: '' },
  });

  useEffect(() => {
    if (activeTab !== 'camera') {
      return;
    }
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    getCameraPermission();
    
    // Cleanup function to stop video stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, toast]);

  const takePhoto = () => {
    const video = videoRef.current;
    const photo = photoRef.current;
    if (!video || !photo) return;

    const context = photo.getContext('2d');
    if (!context) return;
    
    photo.width = video.videoWidth;
    photo.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const dataUrl = photo.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    form.setValue('image', undefined);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    setIsLoading(true);

    try {
      let imageUrl: string | undefined = undefined;
      const imageFile = values.image?.[0];

      if (capturedImage) {
        const blob = await (await fetch(capturedImage)).blob();
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_capture.jpg`);
        const uploadResult = await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(uploadResult.ref);
      } else if (imageFile) {
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create post. Check console for details.' });
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
                
                <Tabs defaultValue="upload" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload"><Upload className="mr-2"/> Upload</TabsTrigger>
                    <TabsTrigger value="camera"><Camera className="mr-2"/> Camera</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                     <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Upload an image (optional)</FormLabel>
                            <FormControl>
                              <Input type="file" accept="image/*" {...form.register('image')} onChange={(e) => { field.onChange(e.target.files); setCapturedImage(null); }}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TabsContent>
                  <TabsContent value="camera">
                    <div className="mt-4 space-y-4">
                      {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                              Please allow camera access to use this feature.
                            </AlertDescription>
                         </Alert>
                      )}
                      <div className="relative">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                        <canvas ref={photoRef} className="hidden" />
                      </div>
                      <Button type="button" onClick={takePhoto} disabled={hasCameraPermission !== true} className="w-full">
                        <Camera className="mr-2"/> Take Photo
                      </Button>
                      {capturedImage && (
                        <div>
                          <p className="text-sm font-medium mb-2">Captured Image:</p>
                          <img src={capturedImage} alt="Captured" className="rounded-md w-full" />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

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
