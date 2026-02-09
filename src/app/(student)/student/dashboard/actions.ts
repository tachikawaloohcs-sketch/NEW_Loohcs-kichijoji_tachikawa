"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// Mock Email Function
import { sendEmail } from "@/lib/mail";

export async function getInstructors() {
    const instructors = await prisma.user.findMany({
        where: { role: "INSTRUCTOR", isActive: true },
        select: { id: true, name: true, email: true, bio: true, imageUrl: true }, // Force TS re-check
    });
    return instructors;
}

export async function getDetailedShifts(instructorId: string) {
    const shifts = await prisma.shift.findMany({
        where: {
            instructorId,
            start: {
                gte: new Date(),
            },
            isPublished: true,
            bookings: {
                none: { status: "CONFIRMED" } // Only unbooked slots for Individual?
                // Simply: findMany and filter in client or here.
                // Let's filter here if type is INDIVIDUAL.
            }
        },
        include: {
            bookings: true,
        },
        orderBy: {
            start: 'asc'
        }
    });

    return shifts.filter(s => {
        if (s.type === "INDIVIDUAL" && s.bookings.some(b => b.status === "CONFIRMED")) return false;
        return true;
    });
}

export async function createBooking(shiftId: string, meetingType: string = "ONLINE") {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { instructor: true }
    });

    if (!shift) return { error: "Shift not found" };

    const now = new Date();
    const shiftStart = new Date(shift.start);
    const timeDiff = shiftStart.getTime() - now.getTime();
    const hoursUntilStart = timeDiff / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
        return { error: "予約期限切れです（授業開始24時間前まで予約可能）" };
    }

    const existingBooking = await prisma.booking.findFirst({
        where: {
            shiftId: shiftId,
            status: "CONFIRMED"
        }
    });

    if (existingBooking && shift.type === "INDIVIDUAL") {
        return { error: "この枠は既に予約されています" };
    }

    try {
        const booking = await prisma.booking.create({
            data: {
                studentId: session.user.id,
                shiftId: shiftId,
                status: "CONFIRMED",
                meetingType: meetingType,
            },
        });

        // 4. 予約確定 (双方) 
        // 件名: 予約確定しました。 
        // 本文: [時間] [授業場所] [授業種別] [講師名] 講師
        // 予約が確定しました。
        // キャンセルは授業1日前までできます。

        const dateStr = format(shift.start, "MM/dd", { locale: ja });
        const timeStr = `${format(shift.start, "HH:mm", { locale: ja })} - ${format(shift.end, "HH:mm", { locale: ja })}`;

        // Location logic for Booking might be slightly different as Shift has location
        // Shift location is simplified (ONLINE/TACHIKAWA/KICHIJOJI).
        // If booking overrides location? No, booking has meetingType.
        // Let's use shift location + meetingType context if needed, but User Request says [授業場所].
        // Let's assume shift.location is the primary source.
        const locationText = shift.location === 'ONLINE' ? 'オンライン' :
            shift.location === 'TACHIKAWA' ? '立川校舎' :
                shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';

        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === 'GROUP' ? '集団授業' : '特別授業';

        const body = `${dateStr} ${timeStr} ${locationText} ${typeText} ${shift.instructor.name} 講師\n予約が確定しました。\nキャンセルは授業1日前までできます。`;

        // To Student
        await sendEmail(session.user.email!, "予約確定しました。", body);
        // To Instructor
        await sendEmail(shift.instructor.email, "予約確定しました。", body); // Same body? "Request" says (Both).

        revalidatePath("/student/dashboard");
        return { success: true, booking };
    } catch {
        return { error: "Database error" };
    }
}

export async function getStudentBookings() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return [];
    }

    const bookings = await prisma.booking.findMany({
        where: {
            studentId: session.user.id,
            status: "CONFIRMED" // Include Cancelled? Maybe separate list.
        },
        include: {
            shift: {
                include: { instructor: { select: { name: true } } }
            },
            report: true
        },
        orderBy: {
            shift: { start: 'desc' }
        }
    });

    return bookings;
    return bookings;
}

export async function createRequest(instructorId: string, date: Date, startTime: string, endTime: string, location: string, type: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Simple validation: End must be after Start
    if (endDateTime <= startDateTime) {
        return { error: "終了時間は開始時間より後である必要があります" };
    }

    try {
        const request = await prisma.scheduleRequest.create({
            data: {
                studentId: session.user.id,
                instructorId: instructorId,
                start: startDateTime,
                end: endDateTime,
                location: location,
                type: type,
                status: "PENDING"
            },
            include: { instructor: { select: { email: true, name: true } }, student: { select: { name: true } } }
        });

        // Notify Instructor
        // 1. 日程リクエスト受信 (講師宛)
        // 件名: 新しい日程リクエストが届きました
        // 本文: 生徒 [生徒名] から [日付] [時間] [授業場所] [授業種別] の日程リクエストが届きました。
        // ダッシュボードから承認・却下を行ってください。
        // ＜ここにダッシュボードURL貼って。＞

        const dateStr = format(startDateTime, "MM/dd", { locale: ja });
        const timeStr = format(startDateTime, "HH:mm", { locale: ja });
        const locationText = getLocationLabel(location);
        const typeText = getTypeLabel(type);
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/instructor/dashboard`;

        await sendEmail(
            request.instructor.email,
            "新しい日程リクエストが届きました",
            `生徒 ${request.student.name} から ${dateStr} ${format(startDateTime, "HH:mm", { locale: ja })} - ${format(endDateTime, "HH:mm", { locale: ja })} ${locationText} ${typeText} の日程リクエストが届きました。\nダッシュボードから承認・却下を行ってください。\n\n${dashboardUrl}`
        );

        revalidatePath("/student/dashboard");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "リクエスト送信に失敗しました" };
    }
}

function getLocationLabel(loc: string) {
    if (loc === 'KICHIJOJI') return '吉祥寺校舎';
    if (loc === 'TACHIKAWA') return '立川校舎';
    if (loc === 'ONLINE') return 'オンライン';
    if (loc.includes('ONLINE_TACHIKAWA')) return 'オンライン・立川校舎は講師の都合に合わせます。（推奨）';
    if (loc.includes('ONLINE_KICHIJOJI')) return 'オンライン・吉祥寺校舎はどちらか講師の都合に合わせます。（推奨）'; // User text says "Online/Kichijoji" but let's stick to their text request if possible or closest match
    // Actually user requested text:
    // オンライン・立川校舎は講師の都合に合わせます。（推奨）
    // オンライン・どちらの校舎かは講師の都合に合わせます。（推奨） -> meant for Kichijoji/Tachikawa or just "Both schools"?
    // Let's assume the keys I will stick to are: 'ONLINE_TACHIKAWA', 'ONLINE_KICHIJOJI', 'ONLINE_ANY'
    if (loc === 'ONLINE_ANY') return 'オンライン・どちらの校舎かは講師の都合に合わせます。（推奨）';

    return 'オンライン';
}

function getTypeLabel(type: string) {
    if (type === 'INDIVIDUAL') return '個別指導';
    if (type === 'GROUP') return '集団授業';
    if (type === 'SPECIAL') return '特別授業';
    return '個別指導';
}
