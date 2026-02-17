import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        console.log('--- Starting User Cleanup via API ---');

        // 1. LINE IDを持たないユーザーを全取得
        const usersWithoutLine = await prisma.user.findMany({
            where: {
                lineUserId: null
            }
        });

        console.log(`Found ${usersWithoutLine.length} users without LINE ID.`);

        let deletedCount = 0;
        let skippedCount = 0;
        const deletedUsers = [];
        const skippedUsers = [];

        for (const user of usersWithoutLine) {
            // --- 保護条件のチェック ---

            // 1. 管理者は保護
            if (user.role === 'ADMIN') {
                console.log(`[SKIP] Keeping Admin: ${user.name}`);
                skippedUsers.push(`Admin: ${user.name}`);
                skippedCount++;
                continue;
            }

            // 2. 生徒の「山本光翼」は保護
            if ((user.name === '山本光翼' || user.email === 'spitz.spitz1221.0531oa@gmail.com') && user.role === 'STUDENT') {
                console.log(`[SKIP] Keeping Student: ${user.name}`);
                skippedUsers.push(`Student: ${user.name}`);
                skippedCount++;
                continue;
            }

            // 3. 生徒の「山本光翼２」は保護
            if ((user.name === '山本光翼２' || user.email === 'souvenir.1242@gmail.com') && user.role === 'STUDENT') {
                console.log(`[SKIP] Keeping Student: ${user.name}`);
                skippedUsers.push(`Student: ${user.name}`);
                skippedCount++;
                continue;
            }

            // --- 削除実行 ---
            console.log(`[DELETE] Deleting User: ${user.name} (${user.email}) - Role: ${user.role}`);

            try {
                // 関連データの削除 (単純化: Bookings/Reports/Shift などはCascade設定または下記で対応)

                // 生徒の場合
                await prisma.booking.deleteMany({ where: { studentId: user.id } });
                await prisma.scheduleRequest.deleteMany({ where: { studentId: user.id } });
                await prisma.admissionResult.deleteMany({ where: { studentId: user.id } });
                // Report is tricky if user is student vs instructor. Usually Report links Booking which we just deleted.

                // 講師の場合
                // Instructor shifts need to be deleted carefully.
                // Shift has bookings linking to it. Can't delete Shift if bookings exist.
                // First delete Bookings on instructor's shifts
                const instructorShifts = await prisma.shift.findMany({
                    where: { instructorId: user.id },
                    select: { id: true }
                });

                const shiftIds = instructorShifts.map(s => s.id);
                if (shiftIds.length > 0) {
                    await prisma.booking.deleteMany({
                        where: { shiftId: { in: shiftIds } }
                    });
                    await prisma.shiftInstructor.deleteMany({
                        where: { shiftId: { in: shiftIds } }
                    });
                    await prisma.shift.deleteMany({
                        where: { instructorId: user.id }
                    });
                }

                // Delete user - let's see if it works. If foreign key constraint fails, we catch error.
                await prisma.user.delete({
                    where: { id: user.id }
                });

                deletedUsers.push(`${user.name} (${user.role})`);
                deletedCount++;
            } catch (error) {
                console.error(`Error deleting user ${user.name}:`, error);
                skippedUsers.push(`ERROR: ${user.name} (${error.message})`);
            }
        }

        return NextResponse.json({
            message: 'Cleanup Complete',
            deletedCount,
            skippedCount,
            deletedUsers,
            skippedUsers
        });

    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
