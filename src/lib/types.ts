export type User = {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  homeCourt: string;
  xp: number;
  trainingStreak: number;
  winStreak: number;
};

export type FeedPost = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  court: string;
  ts: string;
  streak?: number;
};

export type Court = {
  id: string;
  name: string;
  city: string;
  status: string;
  img: string;
};

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  status: 'ACTIVE' | 'COMPLETED' | 'NEW';
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
