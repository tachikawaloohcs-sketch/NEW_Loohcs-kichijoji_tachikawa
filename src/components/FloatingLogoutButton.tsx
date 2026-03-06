"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function FloatingLogoutButton() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-800 dark:border-slate-200 transition-all hover:-translate-y-1 font-bold text-sm"
        >
            <LogOut size={18} />
            <span className="hidden sm:inline">ログアウト</span>
        </button>
    );
}
