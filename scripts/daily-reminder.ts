import { prisma } from "../src/lib/prisma";
import { sendLineMessage } from "../src/lib/line";
import { format, startOfDay, addDays } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * Tomorrow's reminder script (to be run at 0:00 every day)
 */
async function sendReminders() {
    const tomorrow = startOfDay(addDays(new Date(), 1));
    const dayAfterTomorrow = startOfDay(addDays(new Date(), 2));

    console.log(`Checking for shifts between ${tomorrow} and ${dayAfterTomorrow}`);

    const shifts = await prisma.shift.findMany({
        where: {
            start: {
                gte: tomorrow,
                lt: dayAfterTomorrow
            },
            bookings: {
                some: {
                    status: "CONFIRMED"
                }
            }
        },
        include: {
            bookings: {
                where: { status: "CONFIRMED" },
                include: { student: true }
            },
            instructor: true
        }
    });

    console.log(`Found ${shifts.length} shifts to notify.`);

    for (const shift of shifts) {
        const dateStr = format(shift.start, "MM/dd", { locale: ja });
        const timeStr = `${format(shift.start, "HH:mm", { locale: ja })} - ${format(shift.end, "HH:mm", { locale: ja })}`;
        const locationText = shift.location === 'ONLINE' ? 'オンライン' :
            shift.location === 'TACHIKAWA' ? '立川校舎' :
                shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';
        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === 'GROUP' ? '集団授業' : '特別授業';

        const body = `【明日の授業リマインド】\n明日 ${dateStr} ${timeStr} に授業があります。\n場所: ${locationText}\n種別: ${typeText}\n講師: ${shift.instructor.name} 講師\n\n遅れないようにお願いします。`;

        // Notify Students
        for (const booking of shift.bookings) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const student = booking.student as any;
            if (student.lineUserId) {
                console.log(`Sending reminder to student: ${student.name}`);
                await sendLineMessage(student.lineUserId, body);
            }
        }

        // Notify Instructor
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instructor = shift.instructor as any;
        if (instructor.lineUserId) {
            console.log(`Sending reminder to instructor: ${instructor.name}`);
            await sendLineMessage(instructor.lineUserId, body);
        }
    }
}

sendReminders()
    .then(() => console.log("Reminders sent successfully"))
    .catch(err => console.error("Error sending reminders:", err))
    .finally(() => process.exit(0));
