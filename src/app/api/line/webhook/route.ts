import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextEventMessage } from '@line/bot-sdk';
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

    // IDを確認する機能
    if (text.toUpperCase() === 'ID') {
        await sendLineMessage(lineUserId, `あなたのLINE User IDは:\n${lineUserId}\nです。このIDをコピーして、管理画面の「IDを手動設定」に入力してください。`);
        return;
    }
}
