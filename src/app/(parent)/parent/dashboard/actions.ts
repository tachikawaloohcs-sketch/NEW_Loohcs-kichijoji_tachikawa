import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function getParentDashboardData() {
    const session = await auth();
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
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);

        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const twoMonthsAgoStart = startOfMonth(subMonths(now, 2));
        const twoMonthsAgoEnd = endOfMonth(subMonths(now, 2));

        const childrenData = (parent as any).children.map((child: any) => {
            const bookings = child.studentBookings;

            // 今月の予約数（CONFIRMED）
            const monthlyBookings = bookings.filter((b: any) =>
                b.status === "CONFIRMED" &&
                b.shift.start >= currentMonthStart &&
                b.shift.start <= currentMonthEnd
            );

            // 授業種別ごとの月合計：「個別・集団」と「特別パック」に分けて集計
            const regularTypes = ["INDIVIDUAL", "GROUP", "BEGINNER", "TRIAL"];
            const specialTypes = ["SPECIAL", "SPECIAL_PACK"];

            const getStatsForPeriod = (start: Date, end: Date) => {
                const periodBookings = bookings.filter((b: any) =>
                    b.status === "CONFIRMED" &&
                    b.shift.start >= start &&
                    b.shift.start <= end
                );
                const regularCount = periodBookings.filter((b: any) =>
                    regularTypes.includes(b.shift.type)
                ).length;
                const specialCount = periodBookings.filter((b: any) =>
                    specialTypes.includes(b.shift.type)
                ).length;
                return { regularCount, specialCount };
            };

            const stats = {
                currentMonth: getStatsForPeriod(currentMonthStart, currentMonthEnd),
                lastMonth: getStatsForPeriod(lastMonthStart, lastMonthEnd),
                twoMonthsAgo: getStatsForPeriod(twoMonthsAgoStart, twoMonthsAgoEnd),
            };

            // 授業履歴（完了したもの）
            const history = bookings.filter((b: any) => b.status === "CONFIRMED" && b.shift.end < now);

            // 今後の予定
            const upcoming = bookings.filter((b: any) => b.status === "CONFIRMED" && b.shift.start > now);

            return {
                id: child.id,
                name: child.name,
                email: child.email,
                monthlyCount: monthlyBookings.length,
                stats: stats,
                history: history.map((h: any) => ({
                    id: h.id,
                    start: h.shift.start,
                    end: h.shift.end,
                    instructor: h.shift.instructor.name,
                    type: h.shift.type,
                    location: h.shift.location,
                    meetingType: h.meetingType,
                    report: h.report ? { content: h.report.content, feedback: h.report.feedback } : null
                })),
                upcoming: upcoming.map((u: any) => ({
                    id: u.id,
                    start: u.shift.start,
                    end: u.shift.end,
                    instructor: u.shift.instructor.name,
                    type: u.shift.type,
                    location: u.shift.location,
                    meetingType: u.meetingType,
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
