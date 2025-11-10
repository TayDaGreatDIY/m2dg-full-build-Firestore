
'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
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
            <Link
                href="/admin"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
                <Shield className="h-5 w-5" />
                <span>Admin</span>
            </Link>
        );
    }

    return null;
}
