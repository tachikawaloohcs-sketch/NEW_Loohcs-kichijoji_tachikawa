"use server";

import { auth, signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function authenticate(prevState: string | undefined, formData: FormData) {
    const email = formData.get("email") as string;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Let signIn handle the password validation failure, but if user implies role...
        // Actually, better to just redirect to root and let middleware handle it if we can't find user
        // But here we want explicit redirect.

        // Check isActive
        if (user && user.isActive === false) {
            return "このアカウントは現在無効化されています。管理者に連絡してください。";
        }

        const redirectUrl = "/";
        // if (user) {
        //     switch (user.role) {
        //         case "ADMIN": redirectUrl = "/admin/dashboard"; break;
        //         case "INSTRUCTOR": redirectUrl = "/instructor/dashboard"; break;
        //         case "STUDENT": redirectUrl = "/student/dashboard"; break;
        //     }
        // }

        await signIn("credentials", formData, { redirectTo: redirectUrl });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "メールアドレスまたはパスワードが間違っています。"; // Japanese error message
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string; // STUDENT, INSTRUCTOR, ADMIN
    const bio = formData.get("bio") as string;
    const imageFile = formData.get("image") as File;

    if (!email || !password || !name) {
        return "Missing fields";
    }

    // Admin Registration Restriction
    if (role === "ADMIN") {
        if (email !== "tachikawa@loohcs.co.jp") {
            return "このメールアドレスでは管理者登録できません";
        }
        if (password !== "Yamamoto_Hasegawa2525") {
            return "管理者パスワードが違います";
        }
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        try {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const ext = path.extname(imageFile.name) || ".jpg";
            const fileName = `${randomUUID()}${ext}`;
            const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

            await writeFile(uploadPath, buffer);
            imageUrl = `/uploads/${fileName}`;
        } catch (e) {
            console.error("Image upload failed", e);
            // Optionally return error or proceed without image
        }
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "STUDENT",
                bio: bio || null,
                imageUrl: imageUrl || null,
                isProfileComplete: true // Form registration completes it
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return "User already exists or database error";
    }

    return "success";
}

export async function completeProfile(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return "Unauthorized";

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const role = formData.get("role") as string;
    const campus = formData.get("campus") as string;

    const parentEmail = formData.get("parentEmail") as string;
    const parentPassword = formData.get("parentPassword") as string;

    let parentId: string | undefined;

    if (role === "STUDENT" && parentEmail) {
        if (!parentPassword || parentPassword.length < 6) return "保護者パスワードは6文字以上で入力してください";
        try {
            const hashedPassword = await bcrypt.hash(parentPassword, 10);
            let parent = await prisma.user.findUnique({ where: { email: parentEmail } });

            if (!parent) {
                parent = await prisma.user.create({
                    data: {
                        name: "保護者",
                        email: parentEmail,
                        password: hashedPassword,
                        role: "PARENT",
                        isActive: true,
                        isProfileComplete: true
                    }
                });
            } else {
                if (parent.role !== 'ADMIN' && parent.role !== 'INSTRUCTOR' && parent.role !== 'STUDENT' && parent.role !== 'PARENT') {
                    await prisma.user.update({
                        where: { id: parent.id },
                        data: { role: 'PARENT' }
                    });
                }
            }
            parentId = parent.id;
        } catch (e) {
            console.error("Parent creation failed", e);
            return "保護者アカウントの作成に失敗しました";
        }
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                bio: role === "INSTRUCTOR" ? (bio || null) : null,
                role: (role === "INSTRUCTOR" || role === "STUDENT") ? role : undefined,
                campus: campus || null,
                isProfileComplete: true,
                parentId: parentId || undefined
            } as any
        });

        // Return the role so client can redirect appropriately
        return { success: true, role: updatedUser.role };
    } catch (error) {
        console.error("Profile complete error:", error);
        return "データベースエラーが発生しました";
    }
}

export async function logout() {
    await signOut();
}

export async function lineLogin() {
    await signIn("line");
}
