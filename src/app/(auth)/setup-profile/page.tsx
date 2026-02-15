import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SetupProfileClient from "./SetupProfileClient";
import { prisma } from "@/lib/prisma";

export default async function SetupProfilePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) redirect("/login");
    if (user.isProfileComplete) {
        // Redirect to dashboard based on role
        if (user.role === "ADMIN") redirect("/admin/dashboard");
        if (user.role === "INSTRUCTOR") redirect("/instructor/dashboard");
        redirect("/student/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <SetupProfileClient user={user} />
        </div>
    );
}
