"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// Mock Email Function
import { sendEmail } from "@/lib/mail";

export async function getInstructorShifts() {
    const session = await auth();
    console.log("DEBUG: getInstructorShifts Session:", session?.user?.email, session?.user?.role, session?.user?.id);

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        console.log("DEBUG: Unauthorized or not INSTRUCTOR");
        return [];
    }

    const shifts = await prisma.shift.findMany({
        where: {
            instructorId: session.user.id,
        },
        include: {
            bookings: {
                include: {
                    student: { select: { name: true } },
                    report: true
                }
            }
        },
        orderBy: {
            start: 'asc',
        },
    });

    return shifts;
}

export async function getInstructorRequests() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") return [];

    return await prisma.scheduleRequest.findMany({
        where: {
            instructorId: session.user.id,
            status: "PENDING"
        },
        include: {
            student: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

// New function for Report Management
export async function getStudentsForInstructor() {
    const session = await auth();
    if (session?.user?.role !== "INSTRUCTOR") return [];

    // Instructors should see all students to view their past reports history
    return await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
            studentBookings: {
                include: {
                    shift: {
                        include: {
                            instructor: { select: { name: true } }
                        }
                    },
                    report: true
                },
                orderBy: { shift: { start: 'desc' } }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            admissionResults: true
        } as any,
        orderBy: { name: 'asc' }
    });
}

export async function createShift(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    const dateStr = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const type = formData.get("type") as string;
    const className = formData.get("className") as string;

    if (!dateStr || !startTime || !endTime || !type) {
        return { error: "Missing fields" };
    }

    const startDateTime = new Date(`${dateStr}T${startTime}:00`);
    const endDateTime = new Date(`${dateStr}T${endTime}:00`);

    try {
        const shift = await prisma.shift.create({
            data: {
                instructorId: session.user.id,
                start: startDateTime,
                end: endDateTime,
                type: type.toUpperCase(),
                className: className || null,
                location: formData.get("location") as string || "ONLINE",
                isPublished: true,
            },
        });

        revalidatePath("/instructor/dashboard");
        return { success: true, shift };
    } catch {
        return { error: "Database error" };
    }
}

export async function submitReport(bookingId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    const content = formData.get("content") as string;
    const logUrl = formData.get("logUrl") as string;
    const homework = formData.get("homework") as string;
    const feedback = formData.get("feedback") as string;

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { shift: true }
    });

    if (!booking) return { error: "Booking not found" };

    const now = new Date();
    const shiftStart = new Date(booking.shift.start);

    if (now < shiftStart) {
        return { error: "授業開始前です。まだカルテは記入できません。" };
    }

    const deadline = new Date(shiftStart);
    deadline.setHours(23, 59, 59, 999);

    // Get extension hours setting
    const setting = await prisma.globalSettings.findUnique({
        where: { key: "CARTE_DEADLINE_EXTENSION_HOURS" }
    });
    const extensionHours = parseInt(setting?.value || "0", 10);
    deadline.setHours(deadline.getHours() + extensionHours);

    let warning = null;
    if (now > deadline) {
        warning = "提出期限を過ぎています。遅延提出として記録されました。次回からは期限内に提出するようにしてください。";
    }

    try {
        await prisma.report.upsert({
            where: { bookingId: bookingId },
            update: {
                content,
                logUrl,
                homework,
                feedback
            },
            create: {
                bookingId: bookingId,
                content,
                logUrl,
                homework,
                feedback
            }
        });
        revalidatePath("/instructor/dashboard");
        return { success: true, warning };
    } catch {
        return { error: "Failed to submit report" };
    }
}

export async function deleteShift(shiftId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { bookings: true }
    });

    if (!shift) return { error: "Shift not found" };
    if (shift.instructorId !== session.user.id) return { error: "Not your shift" };

    // Check if 24h before
    const now = new Date();
    const shiftStart = new Date(shift.start);
    const timeDiff = shiftStart.getTime() - now.getTime();
    const hoursUntilStart = timeDiff / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
        return { error: "授業開始24時間前を切っているため削除できません。" };
    }

    try {
        // Collect bookings to notify before deleting
        const bookingsToNotify = shift.bookings.filter(b => b.status === "CONFIRMED");

        await prisma.$transaction(async (tx) => {
            // Delete bookings first (cascade manually)
            await tx.booking.deleteMany({
                where: { shiftId: shiftId }
            });

            await tx.shift.delete({
                where: { id: shiftId }
            });
        });

        // 4. 予約キャンセル確定 (双方)
        // 件名: 予約がキャンセルされました。
        // 本文: [時間] [授業場所] [授業種別] [講師名] 講師の予約がキャンセルされました。

        const dateStr = format(shiftStart, "MM/dd", { locale: ja });
        const timeStr = `${format(shiftStart, "HH:mm", { locale: ja })} - ${format(new Date(shift.end), "HH:mm", { locale: ja })}`;

        // Need to refetch or assume shift structure. shift variable has bookings, but we need instructor name etc.
        // `shift` from `findUnique` above has `bookings` but shift itself has `instructorId`.
        // We need instructor name.
        const instructor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });
        const instructorName = instructor?.name || "講師";
        const instructorEmail = instructor?.email;

        const locationText = shift.location === 'ONLINE' ? 'オンライン' :
            shift.location === 'TACHIKAWA' ? '立川校舎' :
                shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';
        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === 'GROUP' ? '集団授業' : '特別授業';

        const body = `${dateStr} ${timeStr} ${locationText} ${typeText} ${instructorName} 講師の予約がキャンセルされました。`;

        // Notify Students
        for (const booking of bookingsToNotify) {
            const student = await prisma.user.findUnique({ where: { id: booking.studentId } });
            if (student?.email) {
                await sendEmail(student.email, "予約がキャンセルされました。", body);
            }
        }

        // Notify Instructor (Confirmation)
        if (instructorEmail) {
            await sendEmail(instructorEmail, "予約がキャンセルされました。", body);
        }

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Delete shift error:", e);
        return { error: "Failed to delete shift" };
    }
}

export async function approveRequest(requestId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") return { error: "Unauthorized" };

    const request = await prisma.scheduleRequest.findUnique({
        where: { id: requestId },
        include: { student: true, instructor: true }
    });

    if (!request) return { error: "Request not found" };

    try {
        await prisma.$transaction(async (tx) => {
            const shift = await tx.shift.create({
                data: {
                    instructorId: session.user.id as string,
                    start: request.start,
                    end: request.end,
                    type: request.type, // Use request type
                    location: request.location, // Use request location
                    isPublished: true,
                }
            });

            await tx.booking.create({
                data: {
                    studentId: request.studentId,
                    shiftId: shift.id,
                    status: "CONFIRMED",
                    meetingType: request.location === 'ONLINE' ? 'ONLINE' : 'IN_PERSON' // Infer meeting type
                }
            });

            await tx.scheduleRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED" }
            });
        });

        // 2. リクエスト承認 (生徒宛)
        // 件名: 日程リクエストが承認されました
        // 本文: [日付] [時間] [授業場所] [授業種別] のリクエストが [講師名] 講師により承認されました。

        const dateStr = format(request.start, "MM/dd", { locale: ja });
        const timeStr = format(request.start, "HH:mm", { locale: ja });
        const locationText = getLocationLabel(request.location); // Helper needed in this file too? Or assume standard string if already saved. 
        // We added columns to ScheduleRequest, so they are available (TS might complain if schema not generated, but runtime is fine).
        // getLocationLabel helper needs to be duplicated or imported. Let's simplify or duplicate for now.
        const typeText = getTypeLabel(request.type);

        await sendEmail(
            request.student.email,
            "日程リクエストが承認されました",
            `${dateStr} ${timeStr} ${locationText} ${typeText} のリクエストが ${request.instructor.name} 講師により承認されました。`
        );

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to approve request" };
    }
}

function getLocationLabel(loc: string) {
    if (loc === 'KICHIJOJI') return '吉祥寺校舎';
    if (loc === 'TACHIKAWA') return '立川校舎';
    if (loc === 'ONLINE') return 'オンライン（推奨）';
    return 'オンライン（推奨）';
}

function getTypeLabel(type: string) {
    if (type === 'INDIVIDUAL') return '個別指導';
    if (type === 'GROUP') return '集団授業';
    if (type === 'SPECIAL') return '特別授業';
    return '個別指導';
}

export async function rejectRequest(requestId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") return { error: "Unauthorized" };

    const request = await prisma.scheduleRequest.findUnique({
        where: { id: requestId },
        include: { student: true }
    });

    if (!request) return { error: "Request not found" };

    try {
        await prisma.scheduleRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" }
        });

        // 3. リクエスト却下 (生徒宛)
        // 件名: 日程リクエストが却下されました
        // 本文: リクエストされた日程は都合により承認されませんでした。別の日程で再度ご検討ください。

        await sendEmail(
            request.student.email,
            "日程リクエストが却下されました",
            `リクエストされた日程は都合により承認されませんでした。別の日程で再度ご検討ください。`
        );

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch {
        return { error: "Failed to reject request" };
    }
}

// 合否・志望校管理: 取得
export async function getAdmissionResults(studentId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return [];
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = await (prisma as any).admissionResult.findMany({
            where: { studentId },
            orderBy: { rank: 'asc' }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return results as any[];
    } catch (e) {
        return [];
    }
}

// 合否・志望校管理: 更新（または作成）
export async function updateAdmissionResult(studentId: string, results: { schoolName: string, department?: string, rank: number, status: string }[]) {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Delete existing and recreate (simplest for list management)
            // Or upsert. Since we pass full list, delete all for student and insert is easier but loses history if we tracked it (we track status updatedBy?).
            // Let's use deleteMany + createMany for simplicity as per requirement "constantly editable".
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).admissionResult.deleteMany({
                where: { studentId }
            });

            if (results.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (tx as any).admissionResult.createMany({
                    data: results.map(r => ({
                        studentId,
                        schoolName: r.schoolName,
                        department: r.department,
                        rank: r.rank,
                        status: r.status
                    }))
                });
            }
        });
        revalidatePath("/instructor/dashboard");
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (e) {
        return { error: "Failed to update admission results" };
    }
}

// アーカイブ閲覧: 許可されたアーカイブ生徒の取得
export async function getLicensedArchivedStudents() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") return [];

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accesses = await (prisma as any).archiveAccess.findMany({
            where: { instructorId: session.user.id },
            include: {
                student: {
                    include: {
                        studentBookings: {
                            include: {
                                shift: { include: { instructor: true } },
                                report: true
                            },
                            orderBy: { shift: { start: "desc" } }
                        },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        admissionResults: true
                    }
                }
            }
        });

        // Also fetch their admission results
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return accesses.map((a: any) => a.student);
    } catch (e) {
        return [];
    }
}

export async function getGlobalSettings(key: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setting = await (prisma as any).globalSettings.findUnique({
            where: { key }
        });
        return { value: setting?.value ?? null };
    } catch (e) {
        return { value: null };
    }
}

// Update Student Profile
export async function updateStudentProfile(
    studentId: string,
    data: {
        schoolName?: string;
        grade?: string;
        researchTheme?: string;
        gpa?: number | null;
        qualifications?: string;
        canInternalUpgrade?: boolean | null;
        dedicatedInstructorName?: string | null;
    }
) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        // Prepare update data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            schoolName: data.schoolName || null,
            grade: data.grade || null,
            researchTheme: data.researchTheme || null,
            gpa: data.gpa,
            qualifications: data.qualifications || null,
            canInternalUpgrade: data.canInternalUpgrade,
        };

        // Handle dedicated instructor by name
        if (data.dedicatedInstructorName && data.dedicatedInstructorName.trim() !== "") {
            // Find instructor by name
            const instructor = await prisma.user.findFirst({
                where: {
                    name: data.dedicatedInstructorName.trim(),
                    role: "INSTRUCTOR"
                }
            });

            if (instructor) {
                updateData.dedicatedInstructorId = instructor.id;
            } else {
                // If instructor not found, set to null
                updateData.dedicatedInstructorId = null;
            }
        } else {
            updateData.dedicatedInstructorId = null;
        }

        await prisma.user.update({
            where: { id: studentId },
            data: updateData
        });

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update student profile:", error);
        return { error: "Failed to update student profile" };
    }
}
