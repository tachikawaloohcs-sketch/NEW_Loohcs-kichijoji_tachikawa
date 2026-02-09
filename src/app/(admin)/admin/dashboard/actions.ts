"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ユーザー管理: 全ユーザー取得
export async function getUsers() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    return await prisma.user.findMany({
        where: { archivedAt: null },
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { studentBookings: true, instructorShifts: true }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            admissionResults: true,
            dedicatedInstructor: { select: { id: true, name: true } }
        } as any
    });
}

// ユーザー管理: アーカイブ済みユーザー検索
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getArchivedUsers(filters: { role: string; year: string; school: string; status: string }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    // Base query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
        archivedAt: { not: null }
    };

    // Role Filter
    if (filters.role !== "ALL") {
        where.role = filters.role;
    }

    // Year Filter
    if (filters.year !== "ALL") {
        where.archiveYear = parseInt(filters.year);
    }

    // School and Status Filters (require joining AdmissionResult)
    if (filters.school || filters.status !== "ALL") {
        const admissionWhere: any = {};

        if (filters.school) {
            admissionWhere.schoolName = { contains: filters.school };
        }

        if (filters.status !== "ALL") {
            if (filters.status === "PASSED") {
                admissionWhere.status = { in: ["PASSED_FIRST", "PASSED_FINAL"] };
            } else {
                admissionWhere.status = filters.status;
            }
        }

        where.admissionResults = {
            some: admissionWhere
        };
    }

    return await prisma.user.findMany({
        where,
        orderBy: { archivedAt: 'desc' },
        include: {
            admissionResults: true
        } as any
    });
}

// ユーザー管理: アーカイブ（論理削除）
// ユーザー管理: アーカイブ（論理削除/物理削除）
export async function archiveUser(userId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    if (userId === session.user.id) {
        return { error: "自分自身をアーカイブすることはできません" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "User not found" };

        if (user.role === "INSTRUCTOR") {
            // Hard Delete for Instructor
            await prisma.$transaction(async (tx) => {
                // 1. Delete ArchiveAccess
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (tx as any).archiveAccess.deleteMany({ where: { instructorId: userId } });

                // 2. Delete ScheduleRequests
                await tx.scheduleRequest.deleteMany({ where: { instructorId: userId } });

                // 3. Delete Shifts and related Bookings/Reports
                const shifts = await tx.shift.findMany({ where: { instructorId: userId }, select: { id: true } });
                const shiftIds = shifts.map(s => s.id);

                if (shiftIds.length > 0) {
                    // Find bookings to delete reports
                    const bookings = await tx.booking.findMany({ where: { shiftId: { in: shiftIds } }, select: { id: true } });
                    const bookingIds = bookings.map(b => b.id);

                    if (bookingIds.length > 0) {
                        await tx.report.deleteMany({ where: { bookingId: { in: bookingIds } } });
                        await tx.booking.deleteMany({ where: { shiftId: { in: shiftIds } } });
                    }
                    await tx.shift.deleteMany({ where: { instructorId: userId } });
                }

                // 4. Delete the User
                await tx.user.delete({ where: { id: userId } });
            });

            revalidatePath("/admin/dashboard");
            return { success: true, message: "講師データを完全に削除しました" };
        } else {
            // Soft Delete for Student (Archive)
            const now = new Date();
            const currentYear = now.getFullYear();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await prisma.user.update({
                where: { id: userId },
                data: {
                    archivedAt: now,
                    archiveYear: currentYear,
                    isActive: false // Also deactivate
                } as any
            });

            revalidatePath("/admin/dashboard");
            return { success: true, message: "ユーザーをアーカイブしました" };
        }
    } catch (e) {
        console.error(e);
        return { error: "Failed to archive/delete user" };
    }
}

// ユーザー管理: 復活（アーカイブ解除）
export async function unarchiveUser(userId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.user.update({
            where: { id: userId },
            data: {
                archivedAt: null,
                archiveYear: null,
                isActive: true
            } as any
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "Failed to unarchive user" };
    }
}

// 授業管理: 全講師取得（シフト表示用）
export async function getAllInstructors() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    return await prisma.user.findMany({
        where: { role: "INSTRUCTOR" },
        select: { id: true, name: true }
    });
}

// 授業管理: 全体シフト取得（カレンダー用）
export async function getMasterSchedule() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    return await prisma.shift.findMany({
        where: {
            // For now, fetch all or maybe limit to recent/future?
            // Let's fetch +/- 3 months or just all for simplicity first
            start: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) // From 1 month ago
            }
        },
        include: {
            instructor: { select: { name: true } },
            bookings: {
                include: {
                    student: { select: { name: true } }
                }
            }
        },
        orderBy: { start: 'asc' }
    });
}


// 授業管理: 特権シフト作成（制限なし）
export async function adminCreateShift(instructorId: string, date: Date, time: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    const [hours, minutes] = time.split(":").map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 1); // Default 1 hour

    try {
        await prisma.shift.create({
            data: {
                instructorId,
                start: startDateTime,
                end: endDateTime,
                type: "INDIVIDUAL",
                isPublished: true,
                location: "ONLINE" // Default
            }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "シフト作成に失敗しました" };
    }
}

// 授業管理: 特権シフト削除（予約があっても削除）
export async function adminDeleteShift(shiftId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // Bookings are cascaded? Usually not by default in prisma unless configured but let's check or do manual delete
        // Schema doesn't specify cascade. Need to delete bookings first.

        await prisma.booking.deleteMany({
            where: { shiftId }
        });

        await prisma.shift.delete({
            where: { id: shiftId }
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "シフト削除に失敗しました" };
    }
}

// アーカイブアクセス権限管理: 取得
export async function getArchiveAccesses(studentId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accesses = await (prisma as any).archiveAccess.findMany({
            where: { studentId },
            include: { instructor: { select: { id: true, name: true } } }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return accesses.map((a: any) => a.instructor);
    } catch (e) {
        return [];
    }
}

// アーカイブアクセス権限管理: 付与
export async function grantArchiveAccess(instructorId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).archiveAccess.create({
            data: { instructorId, studentId }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "権限の付与に失敗しました" };
    }
}

// アーカイブアクセス権限管理: 剥奪
export async function revokeArchiveAccess(instructorId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).archiveAccess.deleteMany({
            where: { instructorId, studentId }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "権限の剥奪に失敗しました" };
    }
}

// 授業管理: 特権予約作成（強制予約）
export async function adminCreateBooking(shiftId: string, studentId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { bookings: { where: { status: "CONFIRMED" } } }
    });

    if (!shift) return { error: "Shift not found" };

    if (shift.type === "INDIVIDUAL" && shift.bookings.length > 0) {
        return { error: "既に予約が入っています" };
    }

    try {
        await prisma.booking.create({
            data: {
                shiftId,
                studentId,
                status: "CONFIRMED",
                meetingType: "ONLINE"
            }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "予約作成に失敗しました" };
    }
}

// システム設定: 取得
export async function getGlobalSettings(key: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setting = await (prisma as any).globalSettings.findUnique({
            where: { key }
        });
        return { value: setting?.value ?? null };
    } catch (e) {
        return { value: null };
    }
}

// システム設定: 更新
export async function updateGlobalSettings(key: string, value: string, description?: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).globalSettings.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });
        revalidatePath("/admin/dashboard");
        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "設定の更新に失敗しました" };
    }
}




// 生徒プロフィール更新
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStudentProfile(
    studentId: string,
    data: {
        schoolName?: string;
        grade?: string;
        researchTheme?: string;
        gpa?: number;
        qualifications?: string;
        canInternalUpgrade?: boolean;
        dedicatedInstructorId?: string | null;
    }
) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: studentId },
            data: {
                schoolName: data.schoolName,
                grade: data.grade,
                researchTheme: data.researchTheme,
                gpa: data.gpa,
                qualifications: data.qualifications,
                canInternalUpgrade: data.canInternalUpgrade,
                dedicatedInstructorId: data.dedicatedInstructorId === "None" ? null : data.dedicatedInstructorId
            }
        });
        revalidatePath("/admin/dashboard");
        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "更新に失敗しました" };
    }
}

// 志望校・合否情報更新
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAdmissionResults(studentId: string, results: any[]) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // Transaction to replace all results
        await prisma.$transaction(async (tx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).admissionResult.deleteMany({ where: { studentId } });

            if (results.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (tx as any).admissionResult.createMany({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data: results.map((r: any) => ({
                        studentId,
                        schoolName: r.schoolName,
                        department: r.department,
                        rank: r.rank,
                        status: r.status
                    }))
                });
            }
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "更新に失敗しました" };
    }
}
