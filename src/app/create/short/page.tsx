"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { uploadFile } from '@/lib/uploadHelper';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useToast } from '@/hooks/use-toast';

import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle, Camera, Upload, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  caption: z.string().max(150, { message: "Caption can't exceed 150 characters." }).optional(),
  video: z.any().optional(),
});

export default function CreateShortPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

  // Chiede permessi alla camera solo se tab camera è attivo
  useEffect(() => {
    if (activeTab !== 'camera') return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedBlob(e.data);
            setRecordedVideo(URL.createObjectURL(e.data));
          }
        };
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Camera/mic error:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Enable camera and microphone permissions to record a video.',
        });
      }
    };

    getCameraPermission();

    // Cleanup video stream
    return () => {
      if (videoRef.current?.srcObject) {
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }

    const videoFile = values.video?.[0];
    if (!videoFile && !recordedBlob) {
      toast({ variant: 'destructive', title: 'Error', description: 'No video selected or recorded.' });
      return;
    }

    setIsLoading(true);

    try {
      let videoUrl: string | undefined;

      if (recordedBlob) {
        const file = new File([recordedBlob], `${Date.now()}_capture.webm`, { type: 'video/webm' });
        videoUrl = await uploadFile(file, 'shorts', user.uid);
      } else if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'shorts', user.uid);
      }

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

    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload short.' });
    } finally {
      setIsLoading(false);
    }
  };

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
                            <Input type="file" accept="video/*" {...form.register('video')} 
                              onChange={(e) => { field.onChange(e.target.files); setRecordedBlob(null); setRecordedVideo(null); }}
                            />
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
                            Please allow camera and microphone access to record a video.
                          </AlertDescription>
                        </Alert>
                      )}

                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />

                      <div className="flex gap-2 justify-center mt-2">
                        {!isRecording && <Button onClick={startRecording}><Camera className="mr-1"/> Start</Button>}
                        {isRecording && <Button variant="destructive" onClick={stopRecording}>Stop</Button>}
                      </div>

                      {recordedVideo && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <video src={recordedVideo} controls className="w-full rounded-md" />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Upload Short
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
