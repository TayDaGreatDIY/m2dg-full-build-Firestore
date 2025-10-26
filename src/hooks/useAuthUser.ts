"use client";

import { demoUser } from '@/lib/authStub';
import type { User } from '@/lib/types';

export function useAuthUser() {
  const user: User = demoUser;
  return { user };
}
