"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import Image from 'next/image';

interface Post {
  id: string;
  authorName: string;
  authorAvatar?: string | null;
  text: string;
  imageUrl?: string;
  createdAt: any;
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Post));
      setPosts(loadedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (posts.length === 0) {
    return <p className="text-center py-10 text-gray-500">No posts yet.</p>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <CardTitle>{post.authorName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{post.text}</p>
            {post.imageUrl && (
              <Image
                src={post.imageUrl}
                alt="Post image"
                width={500}
                height={500}
                className="rounded-md w-full max-h-96 object-cover"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}