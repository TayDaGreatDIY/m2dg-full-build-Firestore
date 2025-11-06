
'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Shield } from 'lucide-react';

export default function AdminSidebarMenu() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
      }, [firestore, authUser]);
    
    const { data: user } = useDoc<AppUser>(userDocRef);

    if (user?.role === 'admin') {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton href="/admin" left={<Shield />}>Admin</SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return null;
}
