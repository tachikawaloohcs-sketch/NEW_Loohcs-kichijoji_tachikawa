"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// New function for Report Management
export async function getStudentsForInstructor() {
    const session = await auth();
    if (session?.user?.role !== "INSTRUCTOR" && session?.user?.role !== "ADMIN") return [];

    // Instructors should see all students to view their past reports history
    return await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            admissionResults: true,
            dedicatedInstructor: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });
}

// 合否・志望校管理: 取得
export async function getAdmissionResults(studentId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return [];
    }

    try {
        const results = await prisma.admissionResult.findMany({
            where: { studentId },
            orderBy: { rank: 'asc' }
        });
        return results;
    } catch (e) {
        return [];
    }
}

// 合否・志望校管理: 更新（または作成）
export async function updateAdmissionResult(studentId: string, results: { schoolName: string, department?: string, rank: number, status: string }[]) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Delete existing and recreate (simplest for list management)
            await tx.admissionResult.deleteMany({
                where: { studentId }
            });

            if (results.length > 0) {
                await tx.admissionResult.createMany({
                    data: results.map(r => ({
                        studentId,
                        schoolName: r.schoolName,
                        department: r.department,
                        rank: r.rank,
                        status: r.status
                    }))
                });
            }
        });
        revalidatePath("/instructor/dashboard");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "Failed to update admission results" };
    }
}

// アーカイブ閲覧: 許可されたアーカイブ生徒の取得
export async function getLicensedArchivedStudents() {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) return [];

    try {
        const accesses = await prisma.archiveAccess.findMany({
            where: { instructorId: session.user.id },
            include: {
                student: {
                    include: {
                        admissionResults: true
                    }
                }
            }
        });

        return accesses.map((a: any) => a.student);
    } catch (e) {
        return [];
    }
}

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

// Update Student Profile
export async function updateStudentProfile(
    studentId: string,
    data: {
        schoolName?: string;
        grade?: string;
        researchTheme?: string;
        gpa?: number | null;
        qualifications?: string;
        canInternalUpgrade?: boolean | null;
        dedicatedInstructorId?: string | null;
    }
) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        // Prepare update data
        const updateData: any = {
            schoolName: data.schoolName || null,
            grade: data.grade || null,
            researchTheme: data.researchTheme || null,
            gpa: data.gpa,
            qualifications: data.qualifications || null,
            canInternalUpgrade: data.canInternalUpgrade,
            dedicatedInstructorId: data.dedicatedInstructorId === "None" ? null : data.dedicatedInstructorId
        };

        await prisma.user.update({
            where: { id: studentId },
            data: updateData
        });

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update student profile:", error);
        return { error: "Failed to update student profile" };
    }
}

// Update Instructor Profile
export async function updateInstructorProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                bio: bio || null,
            }
        });

        revalidatePath("/instructor/dashboard");
        revalidatePath("/student/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update instructor profile:", error);
        return { error: "Failed to update profile" };
    }
}
