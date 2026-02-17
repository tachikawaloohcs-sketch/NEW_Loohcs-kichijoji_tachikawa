"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { format, startOfDay, subDays, isBefore } from "date-fns";
import { ja } from "date-fns/locale";

// Mock Email Function
import { sendEmail } from "@/lib/mail";
import { sendLineMessage } from "@/lib/line";

// Get all instructors for multi-select UI
export async function getAllInstructors() {
    return await prisma.user.findMany({
        where: {
            role: "INSTRUCTOR",
            isActive: true
        },
        select: {
            id: true,
            name: true,
            email: true
        },
        orderBy: {
            name: 'asc'
        }
    });
}


export async function getInstructorShifts() {
    const session = await auth();
    console.log("DEBUG: getInstructorShifts Session:", session?.user?.email, session?.user?.role, session?.user?.id);

    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        console.log("DEBUG: Unauthorized or not INSTRUCTOR");
        return [];
    }

    const shifts = await prisma.shift.findMany({
        where: {
            OR: [
                { instructorId: session.user.id },
                {
                    shiftInstructors: {
                        some: {
                            instructorId: session.user.id
                        }
                    }
                }
            ]
        },
        include: {
            bookings: {
                include: {
                    student: { select: { name: true } },
                    report: true
                }
            },
            shiftInstructors: {
                include: {
                    instructor: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
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
            admissionResults: true,
            dedicatedInstructor: {
                select: {
                    id: true,
                    name: true
                }
            }
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
    const maxCapacityStr = formData.get("maxCapacity") as string;
    const maxCapacity = maxCapacityStr ? parseInt(maxCapacityStr, 10) : null;

    if (!dateStr || !startTime || !endTime || !type) {
        return { error: "Missing fields" };
    }

    // Parse the date and time components
    // User inputs time in JST, but Date constructor interprets based on server timezone
    // We need to manually construct UTC time from JST input
    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create UTC date by treating input as JST and converting to UTC
    // JST is UTC+9, so we subtract 9 hours
    const startDateTimeUTC = new Date(Date.UTC(year, month - 1, day, startHour - 9, startMinute));
    const endDateTimeUTC = new Date(Date.UTC(year, month - 1, day, endHour - 9, endMinute));

    try {
        // Check for overlapping shifts (double booking prevention)
        const overlappingShifts = await prisma.shift.findMany({
            where: {
                instructorId: session.user.id,
                start: { lt: endDateTimeUTC },
                end: { gt: startDateTimeUTC }
            }
        });

        if (overlappingShifts.length > 0) {
            return { error: "この時間帯には既にシフトが登録されています" };
        }

        const isPublished = formData.get("isPublished") === "true";

        const shift = await prisma.shift.create({
            data: {
                instructorId: session.user.id,
                start: startDateTimeUTC,
                end: endDateTimeUTC,
                type: type.toUpperCase(),
                className: className || null,
                location: formData.get("location") as string || "ONLINE",
                maxCapacity: maxCapacity,
                isPublished: isPublished,
            },
        });

        // Create ShiftInstructor records for main instructor and additional instructors
        const additionalInstructorsStr = formData.get("additionalInstructors") as string;
        const additionalInstructorIds: string[] = additionalInstructorsStr ? JSON.parse(additionalInstructorsStr) : [];

        // Always add main instructor
        const instructorIds = [session.user.id, ...additionalInstructorIds];

        await prisma.shiftInstructor.createMany({
            data: instructorIds.map(instructorId => ({
                shiftId: shift.id,
                instructorId: instructorId
            })),
            skipDuplicates: true
        });

        revalidatePath("/instructor/dashboard");
        return { success: true, shift };
    } catch (e: any) {
        console.error("createShift error:", e);
        return { error: `Database error (create): ${e.message || "Unknown error"}` };
    }
}

export async function toggleShiftPublish(shiftId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") return { error: "Unauthorized" };

    try {
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
        if (!shift) return { error: "Shift not found" };
        if (shift.instructorId !== session.user.id) return { error: "Unauthorized" };

        await prisma.shift.update({
            where: { id: shiftId },
            data: { isPublished: !shift.isPublished }
        });

        revalidatePath("/instructor/dashboard");
        return { success: true, isPublished: !shift.isPublished };
    } catch {
        return { error: "Failed to toggle status" };
    }
}

// Add instructor to existing shift (no time restrictions)
export async function addInstructorToShift(shiftId: string, instructorId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    try {
        // Check if shift exists
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!shift) {
            return { error: "シフトが見つかりません" };
        }

        // Check if instructor is already assigned
        const existingAssignment = await prisma.shiftInstructor.findFirst({
            where: {
                shiftId: shiftId,
                instructorId: instructorId
            }
        });

        if (existingAssignment) {
            return { error: "この講師は既に割り当てられています" };
        }

        // Add instructor to shift
        await prisma.shiftInstructor.create({
            data: {
                shiftId: shiftId,
                instructorId: instructorId
            }
        });

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch {
        return { error: "Database error" };
    }
}

// Get instructors for a shift
export async function getShiftInstructors(shiftId: string) {
    try {
        const shiftInstructors = await prisma.shiftInstructor.findMany({
            where: { shiftId },
            include: {
                instructor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return shiftInstructors.map(si => si.instructor);
    } catch {
        return [];
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

    // Check if submission is late
    const shiftEnd = new Date(booking.shift.end);
    const isLate = now > shiftEnd;

    let warning = null;
    if (isLate) {
        warning = "遅れて提出します。以降このようなことが多発する場合は厳しく対処する可能性があります。";
    }

    try {
        await prisma.report.upsert({
            where: { bookingId: bookingId },
            update: {
                content,
                logUrl,
                homework,
                feedback,
                submittedLate: isLate,
                updatedAt: new Date()
            },
            create: {
                bookingId: bookingId,
                content,
                logUrl,
                homework,
                feedback,
                submittedLate: isLate
            }
        });
        revalidatePath("/instructor/dashboard");
        return { success: true, warning };
    } catch {
        return { error: "Failed to submit report" };
    }
}

export async function updateReport(reportId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN")) {
        return { error: "Unauthorized" };
    }

    const content = formData.get("content") as string;
    const logUrl = formData.get("logUrl") as string;
    const homework = formData.get("homework") as string;
    const feedback = formData.get("feedback") as string;

    if (!content) {
        return { error: "Content is required" };
    }

    try {
        await prisma.report.update({
            where: { id: reportId },
            data: {
                content,
                logUrl: logUrl || null,
                homework: homework || null,
                feedback: feedback || null,
                updatedAt: new Date()
            }
        });

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update report:", error);
        return { error: "Failed to update report" };
    }
}

export async function deleteShift(shiftId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: {
            bookings: {
                include: { student: true }
            },
            shiftInstructors: { include: { instructor: true } }
        }
    });

    if (!shift) return { error: "Shift not found" };
    if (shift.instructorId !== session.user.id) return { error: "Not your shift" };

    const now = new Date();
    const lessonDate = startOfDay(new Date(shift.start));
    const deadline = subDays(lessonDate, 1); // 0:00 of the day before
    const hasConfirmedBookings = shift.bookings.some(b => b.status === "CONFIRMED");

    if (hasConfirmedBookings && isBefore(deadline, now)) {
        return { error: "予約が入っている授業の期限（授業日前日の0:00）を過ぎているため削除できません。本部へ連絡してください。" };
    }

    try {
        const bookingsToNotify = shift.bookings.filter(b => b.status === "CONFIRMED");

        await prisma.$transaction(async (tx) => {
            await tx.booking.deleteMany({
                where: { shiftId: shiftId }
            });

            await tx.shift.delete({
                where: { id: shiftId }
            });
        });

        const dateStr = format(new Date(shift.start), "MM/dd", { locale: ja });
        const timeStr = `${format(new Date(shift.start), "HH:mm", { locale: ja })} - ${format(new Date(shift.end), "HH:mm", { locale: ja })}`;

        // Need to refetch or assume shift structure. shift variable has bookings, but we need instructor name etc.
        // `shift` from `findUnique` above has `bookings` but shift itself has `instructorId`.
        // We need instructor name.
        const instructor = await (prisma.user as any).findUnique({ where: { id: session.user.id }, select: { name: true, email: true, lineUserId: true } });
        const instructorName = instructor?.name || "講師";
        const instructorEmail = instructor?.email;

        const locationText = shift.location === 'ONLINE' ? 'オンライン' :
            shift.location === 'TACHIKAWA' ? '立川校舎' :
                shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';
        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === 'GROUP' ? '集団授業' : '特別授業';

        const studentBody = `${dateStr} ${timeStr} ${locationText} ${typeText} ${instructorName} 講師の授業がキャンセルされました。`;
        const studentNames = Array.from(new Set(bookingsToNotify.map(b => (b.student as any)?.name || "生徒"))).join(", ");
        const instructorBody = `${dateStr} ${timeStr} ${locationText} ${typeText} の授業がキャンセルされました（生徒: ${studentNames}）`;

        // Notify Students (Unique by Line ID)
        const studentRecipients = new Map<string, string>();
        for (const booking of bookingsToNotify) {
            const lineId = (booking.student as any)?.lineUserId;
            if (lineId) studentRecipients.set(lineId, studentBody);
        }
        for (const [lineId, msg] of studentRecipients) {
            await sendLineMessage(lineId, msg);
        }

        // Notify All Instructors (Unique by Line ID)
        const instructorRecipients = new Map<string, string>();
        const allInstructors = [instructor, ...(shift as any).shiftInstructors?.map((si: any) => si.instructor) || []].filter(Boolean);
        for (const inst of allInstructors) {
            if (inst.lineUserId) instructorRecipients.set(inst.lineUserId, instructorBody);
        }
        for (const [lineId, msg] of instructorRecipients) {
            await sendLineMessage(lineId, msg);
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

        const studentBody = `${dateStr} ${timeStr} ${locationText} ${typeText} のリクエストが ${request.instructor.name} 講師により承認されました。`;
        const instructorBody = `${dateStr} ${timeStr} ${locationText} ${typeText} のリクエストを承認しました（生徒: ${request.student.name} さん）`;

        // Unique recipients
        const recipients = new Map<string, string>();
        console.log(`[Request Approved] Student: ${request.student.name}, LINE ID: ${(request.student as any).lineUserId || 'NOT SET'}`);
        console.log(`[Request Approved] Instructor: ${request.instructor.name}, LINE ID: ${(request.instructor as any).lineUserId || 'NOT SET'}`);
        if ((request.student as any).lineUserId) recipients.set((request.student as any).lineUserId, studentBody);
        if ((request.instructor as any).lineUserId) recipients.set((request.instructor as any).lineUserId, instructorBody);

        for (const [lineId, msg] of recipients) {
            await sendLineMessage(lineId, msg);
        }

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
        include: { student: true, instructor: true }
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

        const body = "リクエストされた日程は都合により承認されませんでした。別の日程で再度ご検討ください。";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const studentAny = request.student as any;
        console.log(`[Request Rejected] Student: ${request.student.name}, LINE ID: ${studentAny.lineUserId || 'NOT SET'}`);
        if (studentAny.lineUserId) {
            await sendLineMessage(studentAny.lineUserId, body);
        } else {
            console.warn(`[Reject Notification Skipped] Student ${request.student.name} has no LINE ID`);
        }

        // Notify Instructor (Newly added)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instructorAny = (request as any).instructor;
        console.log(`[Request Rejected] Instructor: ${request.instructor.name}, LINE ID: ${instructorAny?.lineUserId || 'NOT SET'}`);
        if (instructorAny?.lineUserId) {
            await sendLineMessage(instructorAny.lineUserId, body);
        } else {
            console.warn(`[Reject Notification Skipped] Instructor ${request.instructor.name} has no LINE ID`);
        }

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
            console.log("Looking for instructor with name:", data.dedicatedInstructorName.trim());
            // Find instructor by name
            const instructor = await prisma.user.findFirst({
                where: {
                    name: data.dedicatedInstructorName.trim(),
                    role: "INSTRUCTOR"
                }
            });

            console.log("Found instructor:", instructor);
            if (instructor) {
                updateData.dedicatedInstructorId = instructor.id;
            } else {
                // If instructor not found, set to null
                console.log("Instructor not found, setting to null");
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

// Force book a student to a shift (instructor only)
export async function forceBookStudent(shiftId: string, studentId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
        return { error: "Unauthorized" };
    }

    try {
        // Check if shift exists and belongs to instructor
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: {
                bookings: true,
                instructor: true,
                shiftInstructors: { include: { instructor: true } }
            }
        });

        if (!shift || shift.instructorId !== session.user.id) {
            return { error: "Shift not found or unauthorized" };
        }

        // Check if shift already has a confirmed booking (for INDIVIDUAL type)
        if (shift.type === "INDIVIDUAL" && shift.bookings.some(b => b.status === "CONFIRMED")) {
            return { error: "このシフトには既に予約があります" };
        }

        // Check if student exists
        const student = await prisma.user.findUnique({
            where: { id: studentId, role: "STUDENT" }
        });

        if (!student) {
            return { error: "Student not found" };
        }

        // Create booking
        await prisma.booking.create({
            data: {
                shiftId,
                studentId,
                status: "CONFIRMED",
                meetingType: shift.location || "ONLINE"
            }
        });

        // LINE Notification
        const dateStr = format(shift.start, "MM/dd", { locale: ja });
        const timeStr = `${format(shift.start, "HH:mm", { locale: ja })} - ${format(shift.end, "HH:mm", { locale: ja })}`;
        const locationText = shift.location === 'ONLINE' ? 'オンライン' :
            shift.location === 'TACHIKAWA' ? '立川校舎' :
                shift.location === 'KICHIJOJI' ? '吉祥寺校舎' : 'オンライン';
        const typeText = shift.type === 'INDIVIDUAL' ? '個別指導' : shift.type === "GROUP" ? "集団授業" : "特別授業";

        const instructor = await prisma.user.findUnique({ where: { id: session.user.id } });
        const instructorName = instructor?.name || "講師";
        const studentName = (student as any)?.name || "生徒";
        const studentBody = `【予約確定通知（講師代行）】\n${dateStr} ${timeStr} ${locationText} ${typeText} ${instructorName} 講師\n予約が確定しました。`;
        const instructorBody = `【予約確定通知（講師代行）】\n${dateStr} ${timeStr} ${locationText} ${typeText} ${studentName} さん\n予約が確定しました。`;

        // Unique recipients
        const recipients = new Map<string, string>();
        if ((student as any).lineUserId) recipients.set((student as any).lineUserId, studentBody);

        const allInstructors = [shift.instructor, ...(shift as any).shiftInstructors?.map((si: any) => si.instructor) || []].filter(Boolean);
        for (const inst of allInstructors) {
            if ((inst as any).lineUserId) recipients.set((inst as any).lineUserId, instructorBody);
        }

        for (const [lineId, msg] of recipients) {
            await sendLineMessage(lineId, msg);
        }

        revalidatePath("/instructor/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to force book student:", error);
        return { error: "Failed to book student" };
    }
}
