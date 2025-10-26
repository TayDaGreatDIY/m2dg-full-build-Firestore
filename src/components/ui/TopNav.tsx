"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import UserAvatar from "./UserAvatar";

type TopNavProps = {
  pageTitle: string;
};

export default function TopNav({ pageTitle }: TopNavProps) {
  const { user } = useAuthUser();

  const handleLogout = () => {
    // In a real app, this would call Firebase sign-out
    alert("Logged out (demo)");
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <div className="text-gold font-extrabold text-xl font-headline">🏀 M2DG</div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-lg font-bold tracking-tight text-white/90 font-headline">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        <UserAvatar src={user.photoURL} name={user.displayName} size={32} />
        <button 
          onClick={handleLogout}
          className="text-[11px] bg-white/10 text-white/80 px-2 py-1 rounded-md border border-white/20 hover:bg-white/20"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
