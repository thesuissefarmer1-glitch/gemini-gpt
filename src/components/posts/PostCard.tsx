"use client";

import { useState } from 'react';
import type { Post } from '@/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLikeToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

export default function PostCard({ post, currentUserId, onLikeToggle, onAddComment }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => onLikeToggle(post.id);
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  const timeAgo = post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'just now';
  const isLiked = post.likedBy?.includes(currentUserId);

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
      <CardFooter className="flex-col items-start gap-3 border-t pt-4">
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={handleLike} className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
            <span>{post.likedBy?.length || 0} Like(s)</span>
          </Button>
          <Button variant="ghost" onClick={() => setShowComments(!showComments)} className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments?.length || 0} Comment(s)</span>
          </Button>
        </div>
        {showComments && (
          <div className="w-full pt-4 space-y-4">
            <ScrollArea className="h-[200px] w-full pr-4">
              <div className="space-y-4">
                {post.comments?.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()).map(comment => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={comment.authorAvatar || undefined} />
                       <AvatarFallback>{comment.authorName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-secondary p-2 rounded-lg">
                      <p className="font-semibold text-sm">{comment.authorName}</p>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                   <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleCommentSubmit} className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
