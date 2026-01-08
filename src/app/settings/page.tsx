"use client";

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import FullScreenLoader from '@/components/layout/FullScreenLoader';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
      });
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null; // Auth guard will redirect
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-lg py-6 px-4">
        <h1 className="text-3xl font-bold mb-6 font-headline text-center">Settings</h1>
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
