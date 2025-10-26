import type { FeedPost, Court, LeaderboardEntry, Conversation, ChatMessage } from './types';

export const demoFeed: FeedPost[] = [
  { id: '1', user: 'taym2dg', avatar: 'https://i.pravatar.cc/100?img=15', text: 'Dropped 21 at The Cage. Who’s next?', court: 'The Cage • NYC', ts: '2h ago' },
  { id: '2', user: 'queenbuckets', avatar: 'https://i.pravatar.cc/100?img=32', text: '5-game win streak 🔥 somebody stop me.', court: 'Venice Beach • LA', ts: '4h ago', streak: 5 },
  { id: '3', user: 'downtown_don', avatar: 'https://i.pravatar.cc/100?img=52', text: 'That new court on 5th is clean. Solid runs all afternoon.', court: '5th Ave Hoops • CHI', ts: '8h ago' },
  { id: '4', user: 'sky_walker', avatar: 'https://i.pravatar.cc/100?img=45', text: 'Practice doesn\'t make perfect. Perfect practice makes perfect.', court: 'Home Gym', ts: '1d ago' },
];

export const demoCourts: Court[] = [
  { id: 'court1', name: 'The Cage', city: 'New York, NY', status: 'Runs tonight', img: 'https://images.unsplash.com/photo-1579303384242-4b65219b52b8?q=80&w=800&h=400&fit=crop' },
  { id: 'court2', name: 'Venice Beach', city: 'Los Angeles, CA', status: 'Always busy', img: 'https://images.unsplash.com/photo-1606833958043-a403a55806b8?q=80&w=800&h=400&fit=crop' },
  { id: 'court3', name: 'Goat Park', city: 'Chicago, IL', status: 'Pickup at 5pm', img: 'https://images.unsplash.com/photo-1561335979-c5c559816e87?q=80&w=800&h=400&fit=crop' },
];

export const demoLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Tay Admin', username: 'taym2dg', city: 'NYC', xp: 242, streak: 5, avatar: 'https://i.pravatar.cc/100?img=15' },
  { rank: 2, name: 'Queen Buckets', username: 'queenbuckets', city: 'LA', xp: 199, streak: 4, avatar: 'https://i.pravatar.cc/100?img=32' },
  { rank: 3, name: 'Downtown Don', username: 'downtown_don', city: 'CHI', xp: 178, streak: 2, avatar: 'https://i.pravatar.cc/100?img=52' },
  { rank: 4, name: 'Sky Walker', username: 'sky_walker', city: 'MIA', xp: 150, streak: 0, avatar: 'https://i.pravatar.cc/100?img=45' },
  { rank: 5, name: 'Ankle Bully', username: 'ankle_bully', city: 'OAK', xp: 121, streak: 1, avatar: 'https://i.pravatar.cc/100?img=21' },
];

export const demoConversations: Conversation[] = [
  { 
    id: 'chat1', 
    members: ['taym2dg', 'queenbuckets'], 
    lastMessage: 'Pull up to Venice tonight.', 
    timestamp: '3h ago',
    otherUser: {
      username: 'queenbuckets',
      avatar: 'https://i.pravatar.cc/100?img=32'
    }
  },
  { 
    id: 'chat2', 
    members: ['taym2dg', 'downtown_don'], 
    lastMessage: 'Good game today bro.', 
    timestamp: '1d ago',
    otherUser: {
      username: 'downtown_don',
      avatar: 'https://i.pravatar.cc/100?img=52'
    }
  },
];

export const demoChatMessagesById: Record<string, ChatMessage[]> = {
  chat1: [
    { id: 'm1', from: 'queenbuckets', text: 'Yo, you in LA?', timestamp: '4h ago' },
    { id: 'm2', from: 'taym2dg', text: 'Yessir, just landed. What\'s good?', timestamp: '4h ago' },
    { id: 'm3', from: 'queenbuckets', text: 'Pull up to Venice tonight.', timestamp: '3h ago' },
  ],
  chat2: [
    { id: 'm4', from: 'downtown_don', text: 'Good game today bro.', timestamp: '1d ago' },
  ]
};
