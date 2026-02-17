
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple protection
    if (secret !== 'loohcs-admin-fix-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const email = 'tachikawa@loohcs.co.jp';
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
