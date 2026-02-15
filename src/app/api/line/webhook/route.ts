import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextEventMessage } from '@line/bot-sdk';
import { prisma } from '@/lib/prisma';
import { sendLineMessage } from '@/lib/line';

const client = new Client({
    channelAccessToken: process.env.LINE_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const events: WebhookEvent[] = body.events;

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            await handleTextEvent(event.source.userId!, event.message);
        }
    }

    return NextResponse.json({ status: 'ok' });
}

async function handleTextEvent(lineUserId: string, message: TextEventMessage) {
    const text = message.text.trim();

    // 承認・拒否の判定
    if (text === '承認' || text === '拒否') {
        // LINEユーザーIDから講師を特定
        const instructor = await prisma.user.findUnique({
            where: { lineUserId },
            include: {
                instructorShifts: {
                    where: { status: 'PENDING' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        shift: true,
                        student: true
                    }
                }
            }
        });

        if (!instructor || instructor.role !== 'INSTRUCTOR' || instructor.instructorShifts.length === 0) {
            await sendLineMessage(lineUserId, '処理可能な待機中のリクエストが見つかりませんでした。');
            return;
        }

        const request = instructor.instructorShifts[0];
        const shift = request.shift;

        if (text === '承認') {
            await prisma.booking.update({
                where: { id: request.id },
                data: { status: 'CONFIRMED' }
            });

            const successMsg = `【承認完了】\n${shift.start.getMonth() + 1}/${shift.start.getDate()} ${shift.campus}校 ${shift.type === 'GROUP' ? 'グループ' : '個別'}\n${shift.start.getHours()}:${String(shift.start.getMinutes()).padStart(2, '0')}〜${shift.end.getHours()}:${String(shift.end.getMinutes()).padStart(2, '0')}\nにて授業を行います。`;

            await sendLineMessage(lineUserId, successMsg);
            if (request.studentId && request.student?.lineUserId) {
                await sendLineMessage(request.student.lineUserId, `【授業確定】\n${instructor.name}講師との授業が確定しました。\n${successMsg}`);
            }
        } else {
            await prisma.booking.update({
                where: { id: request.id },
                data: { status: 'CANCELLED' }
            });

            await sendLineMessage(lineUserId, 'リクエストを拒否しました。');
            if (request.studentId && request.student?.lineUserId) {
                await sendLineMessage(request.student.lineUserId, `${instructor.name}講師から${shift.start.getMonth() + 1}/${shift.start.getDate()} ${shift.start.getHours()}:${String(shift.start.getMinutes()).padStart(2, '0')}のリクエストは拒否されました。別日程をリクエストしてください。`);
            }
        }
    }
}
