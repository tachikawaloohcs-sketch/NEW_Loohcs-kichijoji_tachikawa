import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StudentDashboardClient from "./StudentDashboardClient";
import { redirect } from "next/navigation";
import { getInstructors } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    const session = await auth();
    console.log("DEBUG PAGE: Session:", session?.user?.email, session?.user?.role, session?.user?.id, session?.user?.hasChangedParentPassword);

    if (!session?.user?.id) {
        redirect("/login");
    }
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, isProfileComplete: true, name: true, hasChangedParentPassword: true, lineUserId: true }
    });

    if (!dbUser || (dbUser.role !== "STUDENT" && dbUser.role !== "ADMIN")) {
        const { redirect } = await import("next/navigation");
        redirect("/api/force-logout");
    }

    const [instructors] = await Promise.all([
        getInstructors()
    ]);

    return (
        <StudentDashboardClient
            user={dbUser}
            instructors={instructors}
        />
    );
}
