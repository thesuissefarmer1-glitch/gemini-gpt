"use client";

import type { Short, Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Play, Send } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface ShortPlayerProps {
  short: Short;
  currentUserId: string;
  onLikeToggle: (shortId: string) => void;
  onAddComment: (shortId: string, commentText: string) => void;
  isActive: boolean;
}

function CommentsSheet({ short, onAddComment }: { short: Short, onAddComment: (shortId: string, commentText: string) => void }) {
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(short.id, commentText);
      setCommentText('');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="text-white h-12 w-12 flex-col gap-1">
          <MessageCircle className="h-7 w-7" />
          <span className="text-xs">{short.comments?.length || 0}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col text-black bg-white rounded-t-2xl">
        <SheetHeader className="text-center pb-4 border-b">
          <SheetTitle>{short.comments?.length || 0} Comments</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 my-4">
          <div className="px-4 space-y-4">
            {short.comments?.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((comment: Comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={comment.authorAvatar || undefined} />
                  <AvatarFallback>{comment.authorName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">{comment.authorName}</p>
                  <p className="text-sm">{comment.text}</p>
                   <p className="text-xs text-muted-foreground">{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}</p>
                </div>
              </div>
            ))}
             {(!short.comments || short.comments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-10">Be the first to comment!</p>
             )}
          </div>
        </ScrollArea>
        <form onSubmit={handleCommentSubmit} className="flex w-full items-center space-x-2 p-4 border-t bg-white">
          <Input 
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="bg-gray-100"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function ShortPlayer({ short, currentUserId, onLikeToggle, onAddComment, isActive }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isLiked = short.likedBy?.includes(currentUserId);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikeToggle(short.id);
  };
  
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(error => console.error("Video play failed:", error));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);
  
  // Set initial play state based on isActive prop
  useEffect(() => {
      setIsPlaying(isActive);
  }, [isActive]);

  return (
    <div className="relative h-full w-full bg-black snap-start" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        className="w-full h-full object-cover"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 pointer-events-none">
          <Play className="w-20 h-20 text-white text-opacity-70" fill="currentColor" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Avatar>
            <AvatarImage src={short.authorAvatar || undefined} data-ai-hint="person portrait" />
            <AvatarFallback>{short.authorName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <p className="font-bold text-sm">@{short.authorName}</p>
        </div>
        <p className="text-sm">{short.caption}</p>
      </div>
      <div className="absolute right-2 bottom-24 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <Button size="icon" variant="ghost" onClick={handleLike} className="text-white h-12 w-12 flex-col gap-1">
          <Heart className={`h-7 w-7 transition-colors ${isLiked ? 'text-red-500 fill-current' : ''}`} />
          <span className="text-xs">{short.likedBy?.length || 0}</span>
        </Button>
        <div onClick={handleCommentClick}>
          <CommentsSheet short={short} onAddComment={onAddComment} />
        </div>
      </div>
    </div>
  );
}
