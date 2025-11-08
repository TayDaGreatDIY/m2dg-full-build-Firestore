
import { Medal, Target, CheckCircle, Trophy, LucideIcon } from "lucide-react";

export type Challenge = {
    id: string;
    title: string;
    description: string;
    badge: string;
    badgeVariant: 'gold' | 'secondary' | 'orange';
    icon: LucideIcon;
};

export const challenges: Challenge[] = [
  {
    id: '7-day-consistency',
    title: '7-Day Consistency',
    description: 'Hoop or train once per day for 7 straight days.',
    badge: 'ACTIVE',
    badgeVariant: 'gold',
    icon: CheckCircle
  },
  {
    id: 'free-throw-contest',
    title: 'Free Throw Contest',
    description: 'Make 10 free throws in a row. All net, no rim. Verified by video.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Medal
  },
  {
    id: '3-point-shooting',
    title: '5-Spot 3-Point Shooting',
    description: 'Make 5 three-pointers from each of the 5 main spots. We track percentage and time.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Target
  },
  {
    id: 'mid-range-shooting',
    title: '5-Spot Mid-Range',
    description: 'Make 5 shots from each spot, free-throw line extended. We track percentage and time.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Target
  },
  {
    id: 'half-court-shot',
    title: 'Half-Court Shot',
    description: 'How many attempts does it take you to make a half-court shot? Show us.',
    badge: 'PROVING GROUNDS',
    badgeVariant: 'orange',
    icon: Trophy
  },
  {
    id: 'full-court-heave',
    title: 'Full-Court Heave',
    description: 'The ultimate challenge. How many attempts for a full-court shot?',
    badge: 'PROVING GROUNDS',
    badgeVariant: 'orange',
    icon: Trophy
  }
];
