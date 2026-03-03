
"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionRefresher({ serverRole }: { serverRole: string }) {
    const { data: session, update } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!session) return;

        // If the session role in browser (cookie) differs from what the server says (DB),
        // trigger an update to refresh the cookie.
        if (session.user.role !== serverRole) {
            console.log("Refresher: Role mismatch detected. Client:", session.user.role, "Server:", serverRole);

            // Calling update() without arguments triggers the JWT callback with trigger="update"
            // dependent on the next-auth version, but usually we need to pass data or just call it.
            // In my auth.ts I check trigger === "update".
            // Let's force it.
            update().then(() => {
                console.log("Refresher: Session updated");
                router.refresh(); // Refresh server components
            });
        }
    }, [session, serverRole, update, router]);

    return null;
}
