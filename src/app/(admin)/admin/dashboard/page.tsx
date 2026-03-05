import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";
import { redirect } from "next/navigation";
import { getUsers, getGlobalSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        const { redirect } = await import("next/navigation");
        redirect("/api/force-logout");
    }

    // Fetch all students with reports directly using studentReports now
    const [studentsWithReports, allUsers, deadlineSetting] = await Promise.all([
        prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                studentReports: {
                    include: {
                        instructor: { select: { name: true } }
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                admissionResults: true,
                dedicatedInstructor: { select: { id: true, name: true } }
            },
            orderBy: { name: 'asc' }
        }),
        getUsers(),
        getGlobalSettings("CARTE_DEADLINE_EXTENSION_HOURS")
    ]);

    const extensionHours = parseInt(deadlineSetting.value || "0", 10);

    return <AdminDashboardClient students={studentsWithReports} allUsers={allUsers as any} initialDeadlineExtension={extensionHours} />;
}
