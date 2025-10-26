
import type { FeedPost, Court, LeaderboardEntry, Conversation, ChatMessage } from './types';

// This data is now for placeholder/fallback use only.
// The app will primarily use live data from Firestore.

export const demoFeed: FeedPost[] = [
  { id: '1', user: 'taym2dg', avatar: 'https://i.pravatar.cc/100?img=15', text: 'Dropped 21 at The Cage. Who’s next?', court: 'The Cage • NYC', ts: '2h ago' },
  { id: '2', user: 'queenbuckets', avatar: 'https://i.pravatar.cc/100?img=32', text: '5-game win streak 🔥 somebody stop me.', court: 'Venice Beach • LA', ts: '4h ago', streak: 5 },
];

export const demoCourts: Court[] = [
  { id: 'court1', name: 'The Cage', city: 'New York, NY', statusTag: 'Runs tonight', img: 'https://images.unsplash.com/photo-1579303384242-4b65219b52b8?q=80&w=800&h=400&fit=crop' },
  { id: 'court2', name: 'Venice Beach', city: 'Los Angeles, CA', statusTag: 'Always busy', img: 'https://images.unsplash.com/photo-1606833958043-a403a55806b8?q=80&w=800&h=400&fit=crop' },
];

export const demoLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Tay Admin', username: 'taym2dg', city: 'NYC', xp: 242, streak: 5, avatar: 'https://i.pravatar.cc/100?img=15' },
  { rank: 2, name: 'Queen Buckets', username: 'queenbuckets', city: 'LA', xp: 199, streak: 4, avatar: 'https://i.pravatar.cc/100?img=32' },
];

export const demoConversations: Conversation[] = [];

export const demoChatMessagesById: Record<string, ChatMessage[]> = {};
