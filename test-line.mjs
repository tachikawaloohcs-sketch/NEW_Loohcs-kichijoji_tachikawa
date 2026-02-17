import { sendLineMessage } from './src/lib/line.js';
import dotenv from 'dotenv';
dotenv.config();

const testId = process.argv[2];

if (!testId) {
    console.error('Please provide a LINE User ID as an argument.');
    console.log('Usage: node test-line.mjs Uxxxxxxxxxxxxxx');
    process.exit(1);
}

async function run() {
    console.log(`Attempting to send test message to: ${testId}`);
    await sendLineMessage(testId, 'テストメッセージです。このメッセージが届いていれば、トークンと送信機能は正常です。');
}

run();
