import sgMail from '@sendgrid/mail';

export const sendEmail = async (to: string | string[], subject: string, text: string, html?: string) => {
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
        console.warn("SENDGRID_API_KEY is not set. Email will not be sent.");
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}, Body: ${text}`);
        return;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
        console.warn("SENDGRID_FROM_EMAIL is not set. Email will not be sent.");
        return;
    }

    const msg = {
        to,
        from: fromEmail,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${to}`);
    } catch (error: any) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        throw new Error('Failed to send email');
    }
};
