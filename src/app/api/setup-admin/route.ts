import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const email = "tachikawa.loohcs@gmail.com";
        const password = "Yamamoto_Hasegawa2525";
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: "ADMIN",
                isActive: true,
                isProfileComplete: true,
            },
            create: {
                email,
                name: "管理者",
                password: hashedPassword,
                role: "ADMIN",
                isActive: true,
                isProfileComplete: true,
            },
        });

        return NextResponse.json({
            status: "success",
            message: "Admin created successfully",
            email: admin.email,
        });
    } catch (error) {
        console.error("Admin setup error:", error);
        return NextResponse.json({ status: "error", message: "Failed to setup admin" }, { status: 500 });
    }
}
