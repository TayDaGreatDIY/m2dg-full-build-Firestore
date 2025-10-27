

import { Timestamp } from "firebase/firestore";

export type User = {
  uid: string;
  displayName: string;
  username: string;
  avatarURL: string; // Changed from photoURL
  aboutMe?: string;
  xp: number;
  winStreak: number;
  trainingStreak: number;
  homeCourt: string;
  homeCourtId?: string;
  city?: string;
};

export type TrainingLog = {
  id: string;
  userId: string;
  createdAt: Timestamp;
  location: string;
  workType: string;
  notes: string;
  mediaURL?: string;
};

export type Chat = {
  id:string;
  memberIds: string[];
  lastMessage: string;
  lastTimestamp: Timestamp;
  // This will be enriched client-side
  otherUser?: {
    username: string;
    avatarURL: string;
  };
};

export type Message = {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
};

export type Notification = {
    id: string;
    userId: string; // User who receives the notification
    fromId: string;
    fromName: string;
    type: 'new_message';
    link: string; // e.g., /messages/chatId
    read: boolean;
    createdAt: Timestamp;
}

export type Court = {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  img?: string; // Image is optional now
};

export type CheckIn = {
    id: string;
    userId: string;
    timestamp: Timestamp;
    user: {
        uid: string;
        displayName: string;
        avatarURL?: string;
    }
}

export type Run = {
    id: string;
    hostUid: string;
    hostName: string;
    time: string;
    note: string;
    createdAt: Timestamp;
}

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  status: 'ACTIVE' | 'COMPLETED' | 'NEW';
};


// These types were for demo data, keeping them for reference if needed but adapting to Firestore
export type FeedPost = {
  id: string;
  user: string;
  userId: string; // Added to link to player profile
  avatar: string;
  text: string;
  court: string;
  ts: string;
  streak?: number;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  username: string;
  city: string;
  xp: number;
  streak: number;
  avatar: string;
};

export type Conversation = {
  id: string;
  members: string[];
  lastMessage: string;
  timestamp: string;
  otherUser: {
    username: string;
    avatar: string;
  };
};

export type ChatMessage = {
  id: string;
  from: string; // username
  text: string;
  timestamp: string;
};

    