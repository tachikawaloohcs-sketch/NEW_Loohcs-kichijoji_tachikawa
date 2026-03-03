import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import InstructorDashboardClient from "./InstructorDashboardClient";
import { redirect } from "next/navigation";
import { getStudentsForInstructor, getGlobalSettings, getLicensedArchivedStudents } from "./actions";

export const dynamic = "force-dynamic";

export default async function InstructorDashboardPage() {
    const session = await auth();
    console.log("DEBUG PAGE: Session:", session?.user?.email, session?.user?.role, session?.user?.id);

    if (!session?.user || session.user.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, isProfileComplete: true, name: true, email: true, lineUserId: true, bio: true }
    });

    if (!dbUser || dbUser.role !== "INSTRUCTOR") {
        const { redirect } = await import("next/navigation");
        redirect("/api/force-logout");
    }

    const [allStudents, deadlineSetting, licensedStudents] = await Promise.all([
        getStudentsForInstructor(),
        getGlobalSettings("CARTE_DEADLINE_EXTENSION_HOURS"),
        getLicensedArchivedStudents()
    ]);

    const extensionHours = parseInt(deadlineSetting.value || "0", 10);

    return (
        <InstructorDashboardClient
            user={dbUser}
            allStudents={allStudents as any}
            initialDeadlineExtension={extensionHours}
            licensedArchivedStudents={licensedStudents as any}
        />
    );
}
