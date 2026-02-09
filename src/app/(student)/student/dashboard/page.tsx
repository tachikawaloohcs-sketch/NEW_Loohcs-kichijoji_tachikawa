import { getInstructors, getStudentBookings } from "./actions";
import StudentDashboardClient from "./StudentDashboardClient";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
    try {
        const instructors = await getInstructors();
        const bookings = await getStudentBookings();

        return (
            <div className="p-8 space-y-8 max-w-6xl mx-auto">
                <header className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">生徒マイページ</h1>
                        <p className="text-muted-foreground">授業の予約と履歴確認</p>
                    </div>
                    <div className="flex gap-2">
                        <form action={logout}>
                            <Button variant="outline">ログアウト</Button>
                        </form>
                    </div>
                </header>

                <StudentDashboardClient instructors={instructors} initialBookings={bookings} />
            </div>
        );
    } catch (error) {
        console.error("Error loading StudentDashboard:", error);
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
                <p>現在、データを読み込めません。しばらく経ってから再度お試しください。</p>
            </div>
        );
    }
}
