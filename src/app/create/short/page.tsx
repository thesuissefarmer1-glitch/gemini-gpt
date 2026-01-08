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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle, Camera, Upload, Video, Disc, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  caption: z.string().max(150, { message: "Caption can't exceed 150 characters."}).optional(),
  video: z.any().optional(),
});

export default function CreateShortPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState("upload");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { caption: '' },
  });

  useEffect(() => {
    if (activeTab !== 'camera') {
      return;
    }
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const blob = e.data;
            setRecordedBlob(blob);
            setRecordedVideo(URL.createObjectURL(blob));
          }
        };
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera/mic:', error);
        setHasCameraPermission(false);
         toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
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

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      setRecordedVideo(null);
      setRecordedBlob(null);
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    
    const videoFile = values.video?.[0];

    if (!videoFile && !recordedBlob) {
      toast({ variant: 'destructive', title: 'Error', description: 'No video file selected or recorded.' });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      let uploadBlob: Blob;
      let fileName: string;

      if (recordedBlob) {
        uploadBlob = recordedBlob;
        fileName = `${Date.now()}_capture.webm`;
      } else {
        uploadBlob = videoFile;
        fileName = `${Date.now()}_${videoFile.name}`;
      }
      
      const storageRef = ref(storage, `shorts/${user.uid}/${fileName}`);
      
      // Simulating progress for better UX as uploadBytes doesn't provide progress directly
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const uploadResult = await uploadBytes(storageRef, uploadBlob);
      
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload short. Check console for details.' });
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
                
                <Tabs defaultValue="upload" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload"><Upload className="mr-2"/> Upload</TabsTrigger>
                    <TabsTrigger value="camera"><Camera className="mr-2"/> Record</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                     <FormField
                        control={form.control}
                        name="video"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Video File</FormLabel>
                            <FormControl>
                              <Input type="file" accept="video/*" {...form.register('video')} onChange={(e) => { field.onChange(e.target.files); setRecordedBlob(null); setRecordedVideo(null); }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </TabsContent>
                  <TabsContent value="camera">
                    <div className="mt-4 space-y-4 text-center">
                       {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>Camera/Mic Access Required</AlertTitle>
                            <AlertDescription>
                              Please allow camera and microphone access to use this feature.
                            </AlertDescription>
                         </Alert>
                      )}
                      <div className="relative aspect-[9/16] w-full max-w-sm mx-auto rounded-md overflow-hidden bg-black">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      </div>
                      <Button type="button" onClick={isRecording ? stopRecording : startRecording} disabled={hasCameraPermission !== true} size="lg" className="rounded-full w-20 h-20">
                        {isRecording ? <Disc className="w-10 h-10 animate-spin" /> : <Video className="w-10 h-10" />}
                      </Button>
                      <p className="text-sm text-muted-foreground">{isRecording ? "Recording..." : "Tap to record"}</p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {(recordedVideo || form.watch('video')?.[0]) && (
                   <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Video Ready</p>
                      {recordedVideo && <video src={recordedVideo} controls className="w-full rounded-md" />}
                   </div>
                )}


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
                    <FormLabel>Uploading...</FormLabel>
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
