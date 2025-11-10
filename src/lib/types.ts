
import { Timestamp } from "firebase/firestore";

export type User = {
    uid: string;
    email: string;
    displayName: string;
    username: string;
    avatarURL: string;
    role: 'admin' | 'player';
    status: 'active' | 'suspended';
    xp: number;
    winStreak: number;
    trainingStreak: number;
    homeCourt: string;
    homeCourtId: string;
    city: string;
    createdAt: Timestamp;
    lastCheckIn?: Timestamp;
    lastCheckInTime?: string; // ISO String for cooldown
    currentCourtId?: string;
    aboutMe?: string;
    badges?: { id: string; name: string; tier: 'bronze' | 'silver' | 'gold' }[];
};

export type UserWithId = User & { id: string };


export type Court = {
  id: string;
  name: string;
  city: string;
  address: string;
  statusTag: string;
  img: string;
  verified: boolean;
  flagCount: number;
  latitude?: number;
  longitude?: number;
  createdAt?: Timestamp;
  status?: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  approved: boolean;
  featured: boolean;
  createdBy: string;
  createdAt: Timestamp;
};

export type Competition = {
    id: string;
    title: string;
    description: string;
    prize: string;
    courtId: string;
    city: string;
    date: Timestamp;
    approved: boolean;
    status: 'Pending' | 'Approved' | 'Completed';
    organizerId: string;
    participants: string[];
};

export type CheckIn = {
    id: string;
    userId: string;
    timestamp: Timestamp;
    user: {
        uid: string;
        displayName: string;
        avatarURL: string;
    }
};

export type Run = {
    id: string;
    hostUid: string;
    hostName: string;
    time: string;
    note?: string;
    createdAt: Timestamp;
};

export type TrainingLog = {
    id: string;
    userId: string;
    createdAt: Timestamp;
    location: string;
    workType: string;
    notes?: string;
    mediaURL?: string;
};

export type MatchHistory = {
    id: string;
    opponent: string;
    result: 'W' | 'L';
    score: string;
    date: Timestamp;
}

export type FeedPost = {
  id: string;
  user: string;
  userId?: string;
  avatar: string;
  text: string;
  court: string;
  ts: string;
  streak?: number;
};

export type Chat = {
    id: string;
    participants: string[];
    lastMessage: string;
    lastTimestamp: Timestamp;
    otherUser?: {
        username: string;
        avatarURL: string;
    }
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
    title: string,
    body: string,
    fromId?: string;
    fromName?: string;
    type: string;
    link: string;
    read: boolean;
    createdAt: Timestamp;
    meta?: Record<string, any>;
}

export type AdminLog = {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    performedBy: string;
    timestamp: Timestamp;
};

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MissionStatus = 'todo' | 'in_progress' | 'completed' | 'expired';

export interface Goal {
  id: string;
  title: string;                 // "Improve off-hand dribble"
  description?: string;
  focusArea: 'handles' | 'shooting' | 'conditioning' | 'iq' | 'defense' | 'vertical' | 'other';
  targetMetric?: { key: string; target: number; unit?: string }; // {key:'freeThrows', target:200, unit:'shots'}
  dueAt?: number;                // ms epoch
  status: GoalStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Mission {
  id: string;
  goalId: string;
  title: string;                 // "3×(10) weak-hand crossovers at game pace"
  description?: string;
  difficulty: 1 | 2 | 3;         // 1 easy, 3 hard
  type: 'reps' | 'time' | 'checkin' | 'skill' | 'video';
  xp: number;                    // 25 / 50 / 100
  status: MissionStatus;
  progress?: { current: number; target: number; unit?: string };
  createdAt: number;
  completedAt?: number;
  expiresAt?: number;
}
