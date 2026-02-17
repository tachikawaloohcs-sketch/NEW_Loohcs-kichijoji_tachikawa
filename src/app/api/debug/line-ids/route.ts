import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        // Get all users with their LINE IDs
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                lineUserId: true,
                isActive: true
            }
        });

        const stats = {
            total: users.length,
            withLineId: users.filter(u => u.lineUserId).length,
            withoutLineId: users.filter(u => !u.lineUserId).length,
            byRole: {
                STUDENT: users.filter(u => u.role === 'STUDENT').length,
                INSTRUCTOR: users.filter(u => u.role === 'INSTRUCTOR').length,
                ADMIN: users.filter(u => u.role === 'ADMIN').length
            },
            studentsWithLine: users.filter(u => u.role === 'STUDENT' && u.lineUserId).length,
            instructorsWithLine: users.filter(u => u.role === 'INSTRUCTOR' && u.lineUserId).length,
            usersWithoutLine: users.filter(u => !u.lineUserId).map(u => ({
                name: u.name,
                email: u.email,
                role: u.role
            }))
        };

        return NextResponse.json({
            stats,
            users: users.map(u => ({
                name: u.name,
                email: u.email,
                role: u.role,
                hasLineId: !!u.lineUserId,
                lineUserId: u.lineUserId ? `${u.lineUserId.substring(0, 10)}...` : null
            }))
        });
    } catch (error) {
        console.error('[Debug Line IDs Error]', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}
