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
    if (!process.env.LINE_ACCESS_TOKEN) {
        console.warn('LINE_ACCESS_TOKEN is not set. Skipping LINE message.');
        console.log(`[Mock LINE] To: ${userId}, Text: ${text}`);
        return;
    }

    try {
        await client.pushMessage(userId, { type: 'text', text: text });
        console.log(`LINE message sent to ${userId}`);
    } catch (error: any) {
        console.error('Error sending LINE message:', error);
        if (error.originalError && error.originalError.response) {
            console.error(error.originalError.response.data);
        }
    }
};
