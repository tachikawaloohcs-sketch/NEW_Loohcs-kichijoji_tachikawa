import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLineMessage } from '@/lib/line';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
    // 認証（簡易的なAPIキーチェックなどを後で追加可能）
    const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });

    const tomorrow = addDays(new Date(), 1);
    const start = startOfDay(tomorrow);
    const end = endOfDay(tomorrow);

    // 明日の授業をすべて取得
    const shifts = await prisma.shift.findMany({
        where: {
            start: { gte: start, lte: end }
        },
        include: {
            instructor: true,
            bookings: {
                where: { status: 'CONFIRMED' },
                include: { student: true }
            },
            shiftInstructors: {
                include: { instructor: true }
            }
        }
    });

    // 講師のリマインド用マップ
    const instructorMessages = new Map<string, string[]>();
    // 生徒のリマインド用マップ
    const studentMessages = new Map<string, string[]>();

    for (const shift of shifts) {
        const timeStr = `${shift.start.getHours()}:${String(shift.start.getMinutes()).padStart(2, '0')}〜${shift.end.getHours()}:${String(shift.end.getMinutes()).padStart(2, '0')}`;
        const dateStr = `${shift.start.getMonth() + 1}/${shift.start.getDate()}`;

        const locText = shift.location === 'TACHIKAWA' ? '立川校舎' : shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';
        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === 'GROUP' ? '集団授業' : '特別授業';

        // 講師へのメッセージ作成
        const instructors = [shift.instructor, ...shift.shiftInstructors.map(si => si.instructor)].filter(Boolean);
        for (const inst of instructors) {
            if (inst?.lineUserId) {
                const msg = `${dateStr} ${locText} ${typeText} ${timeStr} (${shift.bookings.length}名の予約あり)`;
                if (!instructorMessages.has(inst.lineUserId)) instructorMessages.set(inst.lineUserId, []);
                instructorMessages.get(inst.lineUserId)!.push(msg);
            }
        }

        // 生徒へのメッセージ作成
        for (const booking of shift.bookings) {
            if (booking.student?.lineUserId) {
                const msg = `${dateStr} ${locText} ${typeText} ${timeStr} 講師: ${shift.instructor.name}`;
                if (!studentMessages.has(booking.student.lineUserId)) studentMessages.set(booking.student.lineUserId, []);
                studentMessages.get(booking.student.lineUserId)!.push(msg);
            }
        }
    }

    // 送信
    console.log(`[Reminder] Processing ${instructorMessages.size} instructors and ${studentMessages.size} students`);
    for (const [lineUserId, msgs] of instructorMessages) {
        console.log(`[Reminder] Sending to instructor LINE ID: ${lineUserId}`);
        await sendLineMessage(lineUserId, `明日の授業の一覧です。\n${msgs.join('\n')}`);
    }
    for (const [lineUserId, msgs] of studentMessages) {
        console.log(`[Reminder] Sending to student LINE ID: ${lineUserId}`);
        await sendLineMessage(lineUserId, `明日の授業の一覧です。\n${msgs.join('\n')}`);
    }

    return NextResponse.json({ processed: instructorMessages.size + studentMessages.size });
}
