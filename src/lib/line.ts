import { Client } from '@line/bot-sdk';

const client = new Client({
    channelAccessToken: process.env.LINE_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

/**
 * Send a simple text message to a user via LINE
 * @param userId - THe LINE User ID (U...)
 * @param text - The message text
 */
export const sendLineMessage = async (userId: string, text: string) => {
    console.log(`[LINE Message Attempt] To: ${userId}`);

    if (!process.env.LINE_ACCESS_TOKEN) {
        console.warn('LINE_ACCESS_TOKEN is not set. Skipping LINE message.');
        console.log(`[Mock LINE] To: ${userId}, Text: ${text}`);
        return;
    }

    if (!userId) {
        console.warn('userId is missing. Skipping LINE message.');
        return;
    }

    try {
        await client.pushMessage(userId, { type: 'text', text: text });
        console.log(`[LINE Message Sent] To: ${userId}`);
    } catch (error: any) {
        console.error('[LINE Message Error] To:', userId, 'Error:', error);
        if (error.originalError && error.originalError.response) {
            console.error('LINE Response Data:', error.originalError.response.data);
        }
    }
};
