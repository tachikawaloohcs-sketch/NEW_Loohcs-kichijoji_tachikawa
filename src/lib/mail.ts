// Email is deprecated. Using LINE instead.
// import { sendLineMessage } from './line';
// To send LINE message, we need lineUserId, not email. 
// So this function is now a stub or should be replaced at call sites.

export const sendEmail = async (to: string | string[], subject: string, text: string, html?: string) => {
    console.log(`[Email Deprecated] Would send to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    // No-op for SendGrid
};
