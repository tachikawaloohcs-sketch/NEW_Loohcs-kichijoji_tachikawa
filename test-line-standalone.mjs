import { Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    channelAccessToken: process.env.LINE_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

const testId = process.argv[2];

if (!testId || !testId.startsWith('U')) {
    console.error('Error: Please provide a valid LINE User ID starting with "U".');
    process.exit(1);
}

async function run() {
    try {
        console.log(`Sending message to: ${testId}`);
        await client.pushMessage(testId, { type: 'text', text: '【接続テスト】このメッセージが届いていれば、LINEの通知設定（トークン）は100%正常です。' });
        console.log('Success! Message sent.');
    } catch (error) {
        console.error('Failed to send message.');
        if (error.originalError && error.originalError.response) {
            console.error('LINE API Response:', JSON.stringify(error.originalError.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

run();
