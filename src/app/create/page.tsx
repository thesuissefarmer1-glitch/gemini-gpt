"use client";

import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video } from 'lucide-react';

export default function CreatePage() {
  const { user, loading } = useAuthGuard();

  if (loading) {
    return <FullScreenLoader />;
  }
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-lg py-6 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <h1 className="text-3xl font-bold mb-8 font-headline text-center">What do you want to create?</h1>
        <div className="w-full space-y-6">
          <Link href="/create/post" className="block">
            <Card className="hover:bg-secondary hover:border-primary transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <FileText className="w-10 h-10 text-primary" />
                <div>
                  <CardTitle>Create a Post</CardTitle>
                  <CardDescription>Share your thoughts with text and images.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/create/short" className="block">
            <Card className="hover:bg-secondary hover:border-primary transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Video className="w-10 h-10 text-accent" />
                <div>
                  <CardTitle>Upload a Short</CardTitle>
                  <CardDescription>Share a short video with your followers.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
