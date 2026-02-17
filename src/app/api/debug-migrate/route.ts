
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple protection
    if (secret !== 'loohcs-admin-fix-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting RAW SQL migration...");

        // 1. Get a valid user ID to backfill (The admin we just fixed)
        const admin = await prisma.user.findUnique({
            where: { email: 'tachikawa@loohcs.co.jp' }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin user not found, cannot backfill data.' }, { status: 400 });
        }

        const fallbackId = admin.id;
        const logs: string[] = [];

        // 2. Add column as NULLABLE first
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "instructorId" TEXT;`);
            logs.push("Added column instructorId (nullable)");
        } catch (e) {
            logs.push(`Column add failed (might exist): ${e}`);
        }

        // 3. Backfill data
        // Explicitly cast to text to avoid parameter type issues if any
        const updateCount = await prisma.$executeRawUnsafe(`UPDATE "Shift" SET "instructorId" = '${fallbackId}' WHERE "instructorId" IS NULL;`);
        logs.push(`Updated ${updateCount} shifts with default instructor ID`);

        // 4. Make NOT NULL
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Shift" ALTER COLUMN "instructorId" SET NOT NULL;`);
            logs.push("Altered column instructorId to NOT NULL");
        } catch (e) {
            logs.push(`Set NOT NULL failed: ${e}`);
        }

        // ==========================================
        // NEW: Fix other potentially missing columns
        // ==========================================

        // ScheduleRequest.location
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "ScheduleRequest" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT 'ONLINE';`);
            logs.push("Fixed: ScheduleRequest.location");
        } catch (e) { logs.push(`ScheduleRequest.location fix error: ${e}`); }

        // ScheduleRequest.type
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "ScheduleRequest" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'INDIVIDUAL';`);
            logs.push("Fixed: ScheduleRequest.type");
        } catch (e) { logs.push(`ScheduleRequest.type fix error: ${e}`); }

        // ScheduleRequest.status
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "ScheduleRequest" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING';`);
            logs.push("Fixed: ScheduleRequest.status");
        } catch (e) { logs.push(`ScheduleRequest.status fix error: ${e}`); }

        // Booking.meetingType
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "meetingType" TEXT NOT NULL DEFAULT 'ONLINE';`);
            logs.push("Fixed: Booking.meetingType");
        } catch (e) { logs.push(`Booking.meetingType fix error: ${e}`); }

        // Shift.location
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT 'ONLINE';`);
            logs.push("Fixed: Shift.location");
        } catch (e) { logs.push(`Shift.location fix error: ${e}`); }


        // 5. Add Foreign Key (Optional but good)
        try {
            // Check if constraint exists first to avoid error? roughly
            // We'll just try to add it, if it fails it likely exists
            await prisma.$executeRawUnsafe(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Shift_instructorId_fkey') THEN
                        ALTER TABLE "Shift"
                        ADD CONSTRAINT "Shift_instructorId_fkey"
                        FOREIGN KEY ("instructorId") REFERENCES "User"("id")
                        ON DELETE RESTRICT ON UPDATE CASCADE;
                    END IF;
                END $$;
             `);
            logs.push("Added Foreign Key constraint");
        } catch (e) {
            logs.push(`FK creation failed (simple check): ${e}`);
            // Fallback for simple query if DO block fails (e.g. insufficient privs or transaction block issues)
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "Shift" ADD CONSTRAINT "Shift_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`);
            } catch (e2) {
                logs.push(`Fallback FK creation failed: ${e2}`);
            }
        }

        return NextResponse.json({
            success: true,
            logs,
            adminId: fallbackId
        });

    } catch (error) {
        console.error("Raw SQL Migration failed:", error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}
