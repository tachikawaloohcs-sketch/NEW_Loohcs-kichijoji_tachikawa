import { getInstructorShifts, getInstructorRequests, getStudentsForInstructor, getGlobalSettings, getLicensedArchivedStudents } from "./actions";
import InstructorDashboardClient from "./InstructorDashboardClient";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions";

import { auth } from "@/auth"; // Import auth

export default async function InstructorDashboardPage() {
    console.log("----------------------------------------------------------------");
    console.log("SERVER SIDE RENDERING: InstructorDashboardPage START");
    try {
        const session = await auth();
        console.log("Session User:", session?.user?.email);

        const [shifts, requests, students, archivedStudents, deadlineSetting] = await Promise.all([
            getInstructorShifts(),
            getInstructorRequests(),
            getStudentsForInstructor(),
            getLicensedArchivedStudents(),
            getGlobalSettings("CARTE_DEADLINE_EXTENSION_HOURS")
        ]);
        const extensionHours = parseInt(deadlineSetting.value || "0", 10);

        // Sanitize user object to avoid serialization errors
        const safeUser = session?.user ? {
            email: session.user.email,
            role: session.user.role,
            id: session.user.id
        } : undefined;

        return (
            <div className="p-8 space-y-8 max-w-5xl mx-auto">
                <header className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">講師ダッシュボード</h1>
                        <p className="text-muted-foreground">シフト管理と生徒カルテ</p>
                    </div>
                    <div className="flex gap-2">
                        <form action={logout}>
                            <Button variant="outline">ログアウト</Button>
                        </form>
                    </div>
                </header>

                <InstructorDashboardClient
                    initialShifts={shifts}
                    initialRequests={requests}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    students={students as any}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    archivedStudents={archivedStudents as any}
                    deadlineExtensionHours={extensionHours}
                    currentUser={safeUser}
                />
            </div>
        );
    } catch (error) {
        console.error("FATAL ERROR in InstructorDashboardPage:", error);
        return (
            <div className="p-8 text-red-500">
                <h1 className="text-2xl font-bold">システムエラーが発生しました</h1>
                <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {error instanceof Error ? error.message : String(error)}
                </pre>
            </div>
        );
    }
}
