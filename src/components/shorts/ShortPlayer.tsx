"use client";

import type { Short } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface ShortPlayerProps {
  short: Short;
  onLike: (shortId: string) => void;
  onComment: (shortId: string) => void;
  isActive: boolean;
}

export default function ShortPlayer({ short, onLike, onComment, isActive }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = () => onLike(short.id);
  const handleComment = () => onComment(short.id);

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
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  return (
    <div className="relative h-full w-full bg-black snap-start" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={short.videoUrl}
        loop
        className="w-full h-full object-cover"
        playsInline
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
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
      <div className="absolute right-2 bottom-24 flex flex-col gap-4">
        <Button size="icon" variant="ghost" onClick={handleLike} className="text-white h-12 w-12 flex-col gap-1">
          <Heart className="h-7 w-7" />
          <span className="text-xs">{short.likes}</span>
        </Button>
        <Button size="icon" variant="ghost" onClick={handleComment} className="text-white h-12 w-12 flex-col gap-1">
          <MessageCircle className="h-7 w-7" />
          <span className="text-xs">{short.comments.length}</span>
        </Button>
      </div>
    </div>
  );
}
