"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInstructors() {
    return await prisma.user.findMany({
        where: { role: "INSTRUCTOR", isActive: true },
        select: { id: true, name: true, bio: true }
    });
}

export async function updateParentLogin(parentId: string, newEmail: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARENT") {
        return { error: "Unauthorized" };
    }

    if (session.user.id !== parentId) {
        return { error: "Unauthorized" };
    }

    try {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: parentId },
            data: {
                email: newEmail,
                password: hashedPassword,
                hasChangedParentPassword: true
            }
        });

        revalidatePath("/parent/dashboard");
        revalidatePath("/student/dashboard"); // Revalidate both just in case
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint failed on email
            return { error: "このメールアドレスは既に登録されています" };
        }
        return { error: "更新に失敗しました" };
    }
}

export async function updateStudentName(newName: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: newName }
        });

        // Since name is in session, we might need to instruct the user to re-login, or simply revalidate
        revalidatePath("/student/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update student name:", error);
        return { error: "Failed to update profile" };
    }
}
