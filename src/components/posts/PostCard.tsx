"use client";

import type { Post } from '@/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment }: PostCardProps) {
  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    onComment(post.id);
  };
  
  const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now';

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarImage src={post.authorAvatar || undefined} data-ai-hint="person portrait" />
          <AvatarFallback>{post.authorName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.authorName}</p>
          <p className="text-sm text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{post.text}</p>
        {post.imageUrl && (
          <div className="relative aspect-square w-full rounded-lg overflow-hidden border">
            <Image src={post.imageUrl} alt="Post image" fill style={{ objectFit: 'cover' }} data-ai-hint="abstract social"/>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="ghost" onClick={handleLike} className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          <span>{post.likes} Like</span>
        </Button>
        <Button variant="ghost" onClick={handleComment} className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments.length} Comment</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
