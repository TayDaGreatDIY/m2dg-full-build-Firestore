
import { Timestamp } from "firebase/firestore";

export type UserRole = 'player' | 'coach' | 'moderator' | 'admin';

export type Badge = {
  id: string;
  name: string;
  icon: string;
  dateEarned: Timestamp;
}

export type MatchHistory = {
  id: string;
  date: Timestamp;
  opponent: string;
  result: 'W' | 'L';
  score: string;
}

export type User = {
  uid: string;
  displayName: string;
  username: string;
  email?: string;
  avatarURL: string; 
  aboutMe?: string;
  role?: UserRole;
  status?: 'active' | 'suspended';
  xp: number;
  winStreak: number;
  trainingStreak: number;
  homeCourt: string;
  homeCourtId?: string;
  city?: string;
  createdAt?: Timestamp;
  lastCheckIn?: Timestamp;
  badges?: Badge[];
};

export type UserWithId = User & { id: string };

export type TrainingLog = {
  id: string;
  userId: string;
  createdAt: Timestamp;
  location: string;
  workType: string;
  notes: string;
  mediaURL?: string;
  youtubeConsent?: boolean;
};

export type Chat = {
  id:string;
  memberIds: string[];
  lastMessage: string;
  lastTimestamp: Timestamp;
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
    userId: string; 
    fromId: string;
    fromName: string;
    type: 'new_message';
    link: string; 
    read: boolean;
    createdAt: Timestamp;
}

export type AdminNotification = {
    id: string;
    type: 'court_submission' | 'challenge_submission' | 'report';
    message: string;
    createdAt: Timestamp;
    read: boolean;
    link?: string;
}

export type Court = {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  statusTag: string;
  img?: string;
  verified?: boolean;
  flagCount?: number;
  latitude?: number;
  longitude?: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  approved: boolean;
  featured: boolean;
  createdBy: string; 
  createdAt?: Timestamp;
};

export type Competition = {
  id: string;
  title: string;
  date: Timestamp;
  description: string;
  courtId: string;
  organizerId: string;
  approved: boolean;
  prize: string;
  participants: string[];
  status?: 'Pending' | 'Approved' | 'Completed';
  city?: string;
}

export type AdminLog = {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    performedBy: string;
    timestamp: Timestamp;
}


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

export type Video = {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  imageHint: string;
};

// Demo data types, retained for reference
export type FeedPost = {
  id: string;
  user: string;
  userId: string; 
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

    