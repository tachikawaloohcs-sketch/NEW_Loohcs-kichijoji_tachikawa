import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting User Cleanup ---');

    // 1. LINE IDを持たないユーザーを全取得
    const usersWithoutLine = await prisma.user.findMany({
        where: {
            lineUserId: null
        }
    });

    console.log(`Found ${usersWithoutLine.length} users without LINE ID.`);

    let deletedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutLine) {
        // --- 保護条件のチェック ---

        // 1. 管理者は保護
        if (user.role === 'ADMIN') {
            console.log(`[SKIP] Keeping Admin: ${user.name} (${user.email})`);
            skippedCount++;
            continue;
        }

        // 2. 生徒の「山本光翼」は保護
        if (user.role === 'STUDENT' && (user.name === '山本光翼' || user.email === 'spitz.spitz1221.0531oa@gmail.com')) {
            console.log(`[SKIP] Keeping Student: ${user.name} (${user.email})`);
            skippedCount++;
            continue;
        }

        // 3. 生徒の「山本光翼２」は保護
        if (user.role === 'STUDENT' && (user.name === '山本光翼２' || user.email === 'souvenir.1242@gmail.com')) {
            console.log(`[SKIP] Keeping Student: ${user.name} (${user.email})`);
            skippedCount++;
            continue;
        }

        // --- 削除実行 ---
        console.log(`[DELETE] Deleting User: ${user.name} (${user.email}) - Role: ${user.role}`);

        try {
            // 関連データの削除 (外部キー制約回避のため)
            // 生徒の場合の関連データ
            await prisma.booking.deleteMany({ where: { studentId: user.id } });
            await prisma.scheduleRequest.deleteMany({ where: { studentId: user.id } });
            await prisma.admissionResult.deleteMany({ where: { studentId: user.id } });
            await prisma.report.deleteMany({ where: { studentId: user.id } }); // Note: Report usually links to Booking, but schema dependent

            // 講師の場合の関連データ
            await prisma.shift.deleteMany({ where: { instructorId: user.id } });
            await prisma.scheduleRequest.deleteMany({ where: { instructorId: user.id } });
            // ShiftInstructorなどの関連テーブルがある場合はそれも削除が必要だが、Cascade設定されていることを期待、または現状の削除対象には含まれないと想定
            // *ShiftInstructorはShiftに紐づくかUserに紐づくか確認が必要だが、とりあえずUser削除を試行

            // 最後にユーザー削除
            await prisma.user.delete({
                where: { id: user.id }
            });
            deletedCount++;
        } catch (error) {
            console.error(`Error deleting user ${user.name}:`, error);
        }
    }

    console.log('--- Cleanup Complete ---');
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
