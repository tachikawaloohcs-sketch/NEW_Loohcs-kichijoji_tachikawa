import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, isSameMonth } from "date-fns";

export async function getParentDashboardData() {
    const session = await auth();
    // ロールチェック: "PARENT" または "ADMIN" も一旦許可するか、ログイン制限なしにするか
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const parent = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                children: {
                    include: {
                        studentBookings: {
                            include: {
                                shift: {
                                    include: {
                                        instructor: true
                                    }
                                },
                                report: true
                            },
                            orderBy: {
                                shift: {
                                    start: 'desc'
                                }
                            }
                        }
                    }
                }
            } as any
        });

        if (!parent || !(parent as any).children || (parent as any).children.length === 0) {
            return { error: "No children found", children: [] };
        }

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const childrenData = (parent as any).children.map((child: any) => {
            const bookings = child.studentBookings;

            // 今月の予約数（CONFIRMED）
            const monthlyBookings = bookings.filter((b: any) =>
                b.status === "CONFIRMED" &&
                b.shift.start >= start &&
                b.shift.start <= end
            );

            // 授業種別ごとの予約数
            const bookingStats: Record<string, number> = {};
            bookings.forEach((b: any) => {
                if (b.status === "CONFIRMED") {
                    const type = b.shift.type;
                    bookingStats[type] = (bookingStats[type] || 0) + 1;
                }
            });

            // 授業履歴（完了したもの）
            const history = bookings.filter((b: any) => b.status === "CONFIRMED" && b.shift.end < now);

            // 今後の予定
            const upcoming = bookings.filter((b: any) => b.status === "CONFIRMED" && b.shift.start > now);

            return {
                id: child.id,
                name: child.name,
                email: child.email,
                monthlyCount: monthlyBookings.length,
                stats: bookingStats,
                history: history.map((h: any) => ({
                    id: h.id,
                    date: h.shift.start,
                    instructor: h.shift.instructor.name,
                    type: h.shift.type,
                    location: h.shift.location,
                    report: h.report ? { content: h.report.content, feedback: h.report.feedback } : null
                })),
                upcoming: upcoming.map((u: any) => ({
                    id: u.id,
                    date: u.shift.start,
                    instructor: u.shift.instructor.name,
                    type: u.shift.type,
                    location: u.shift.location,
                }))
            };
        });

        return {
            error: null,
            children: childrenData
        };
    } catch (error) {
        console.error("Failed to fetch parent dashboard data:", error);
        return { error: "Failed to fetch data", children: [] };
    }
}
