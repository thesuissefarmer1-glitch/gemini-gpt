import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  coverImageUrl?: string | null;
  bio?: string;
  createdAt: Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  imageUrl?: string;
  createdAt: Timestamp;
  likedBy: string[]; // Array of user UIDs
  comments: Comment[];
}

export interface Short {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  videoUrl: string;
  caption: string;
  createdAt: Timestamp;
  likedBy: string[]; // Array of user UIDs
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  text: string;
  createdAt: Timestamp;
}
