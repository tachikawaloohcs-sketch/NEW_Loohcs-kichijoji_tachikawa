"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ユーザー管理: 全ユーザー取得
export async function getUsers() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    return await prisma.user.findMany({
        where: { archivedAt: null },
        orderBy: { name: 'asc' },
        include: {
            admissionResults: true,
            dedicatedInstructor: { select: { id: true, name: true } }
        }
    });
}

// ユーザー管理: アーカイブ済みユーザー検索
export async function getArchivedUsers(filters: { role: string; year: string; school: string; status: string }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    // Base query
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
        }
    });
}

// ユーザー管理: アーカイブ（論理削除）
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
                await tx.archiveAccess.deleteMany({ where: { instructorId: userId } });
                await tx.user.delete({ where: { id: userId } });
            });

            revalidatePath("/admin/dashboard");
            return { success: true, message: "講師データを完全に削除しました" };
        } else {
            // Soft Delete for Student (Archive)
            const now = new Date();
            const currentYear = now.getFullYear();

            await prisma.user.update({
                where: { id: userId },
                data: {
                    archivedAt: now,
                    archiveYear: currentYear,
                    isActive: false
                }
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
        await prisma.user.update({
            where: { id: userId },
            data: {
                archivedAt: null,
                archiveYear: null,
                isActive: true
            }
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "Failed to unarchive user" };
    }
}

// アーカイブアクセス権限管理: 取得
export async function getArchiveAccesses(studentId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return [];

    try {
        const accesses = await prisma.archiveAccess.findMany({
            where: { studentId },
            include: { instructor: { select: { id: true, name: true } } }
        });
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
        await prisma.archiveAccess.create({
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
        await prisma.archiveAccess.deleteMany({
            where: { instructorId, studentId }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "権限の剥奪に失敗しました" };
    }
}

// システム設定: 取得
export async function getGlobalSettings(key: string) {
    try {
        const setting = await prisma.globalSettings.findUnique({
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
        await prisma.globalSettings.upsert({
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
export async function updateAdmissionResults(studentId: string, results: any[]) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        // Transaction to replace all results
        await prisma.$transaction(async (tx) => {
            await tx.admissionResult.deleteMany({ where: { studentId } });

            if (results.length > 0) {
                await tx.admissionResult.createMany({
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

export async function permanentDeleteUser(userId: string, passwordConfirm: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") return { error: "Unauthorized" };

    if (userId === session.user.id) {
        return { error: "自分自身を削除することはできません" };
    }

    try {
        // 1. Verify Admin Password
        const admin = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        });

        if (!admin || !admin.password) return { error: "管理者認証に失敗しました" };

        const isMatch = await bcrypt.compare(passwordConfirm, admin.password);
        if (!isMatch) return { error: "管理者パスワードが正しくありません" };

        // 2. Comprehensive Hard Delete
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");

            // Nullify self-referencing relations pointing to this user
            await tx.user.updateMany({
                where: { parentId: userId },
                data: { parentId: null }
            });
            await tx.user.updateMany({
                where: { dedicatedInstructorId: userId },
                data: { dedicatedInstructorId: null }
            });

            // Common for all roles: remove ArchiveAccess, AdmissionResult, ScheduleRequests
            await tx.admissionResult.deleteMany({ where: { studentId: userId } });
            await tx.archiveAccess.deleteMany({
                where: { OR: [{ studentId: userId }, { instructorId: userId }] }
            });

            // Finally delete the user
            await tx.user.delete({ where: { id: userId } });
        });

        revalidatePath("/admin/dashboard");
        return { success: true, message: "データを完全に削除しました" };
    } catch (e) {
        console.error("Permanent delete transaction error:", e);
        return { error: "完全削除に失敗しました: " + (e instanceof Error ? e.message : String(e)) };
    }
}

export async function updateLineUserId(userId: string, lineUserId: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { lineUserId }
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "LINE IDの更新に失敗しました" };
    }
}

export async function updateUserRole(userId: string, role: string) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: {
                    admissionResults: true
                }
            });

            if (!user) throw new Error("User not found");

            if (user.role === "STUDENT" && role === "INSTRUCTOR") {
                const hasBasicInfo = !!(user.schoolName || user.grade || user.researchTheme || user.gpa || user.qualifications);
                const hasAdmission = user.admissionResults.length > 0;

                if (hasBasicInfo || hasAdmission) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    // Email & Line IDs must be safely unique
                    const archivedEmail = user.email ? `archived_${Date.now()}_${user.email}` : null;
                    const archivedLineId = user.lineUserId ? `archived_${Date.now()}_${user.lineUserId}` : null;
                    const archivedUser = await tx.user.create({
                        data: {
                            name: `${user.name} (アーカイブ)`,
                            email: archivedEmail,
                            lineUserId: archivedLineId,
                            role: "STUDENT",
                            isActive: false,
                            archivedAt: now,
                            archiveYear: currentYear,
                            schoolName: user.schoolName,
                            grade: user.grade,
                            researchTheme: user.researchTheme,
                            gpa: user.gpa,
                            qualifications: user.qualifications,
                            canInternalUpgrade: user.canInternalUpgrade,
                            dedicatedInstructorId: user.dedicatedInstructorId,
                        }
                    });

                    if (hasAdmission) {
                        await tx.admissionResult.updateMany({
                            where: { studentId: userId },
                            data: { studentId: archivedUser.id }
                        });
                    }
                }
            }

            await tx.user.update({
                where: { id: userId },
                data: {
                    role,
                    schoolName: role === "INSTRUCTOR" ? null : undefined,
                    grade: role === "INSTRUCTOR" ? null : undefined,
                    researchTheme: role === "INSTRUCTOR" ? null : undefined,
                    gpa: role === "INSTRUCTOR" ? null : undefined,
                    qualifications: role === "INSTRUCTOR" ? null : undefined,
                    canInternalUpgrade: role === "INSTRUCTOR" ? null : undefined,
                    dedicatedInstructorId: role === "INSTRUCTOR" ? null : undefined,
                }
            });
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Failed to update user role:", e);
        return { error: "権限の更新に失敗しました" };
    }
}
