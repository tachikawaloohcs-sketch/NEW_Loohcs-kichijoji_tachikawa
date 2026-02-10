import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
    try {
        console.log('Starting multi-instructor migration...');

        // Create ShiftInstructor table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ShiftInstructor" (
        "id" TEXT NOT NULL,
        "shiftId" TEXT NOT NULL,
        "instructorId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ShiftInstructor_pkey" PRIMARY KEY ("id")
      );
    `);

        console.log('ShiftInstructor table created');

        // Create unique index
        await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ShiftInstructor_shiftId_instructorId_key" 
      ON "ShiftInstructor"("shiftId", "instructorId");
    `);

        console.log('Unique index created');

        // Add foreign key constraints safely
        await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'ShiftInstructor_shiftId_fkey'
        ) THEN
          ALTER TABLE "ShiftInstructor" 
          ADD CONSTRAINT "ShiftInstructor_shiftId_fkey" 
          FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END$$;
    `);

        await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'ShiftInstructor_instructorId_fkey'
        ) THEN
          ALTER TABLE "ShiftInstructor" 
          ADD CONSTRAINT "ShiftInstructor_instructorId_fkey" 
          FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON UPDATE CASCADE;
        END IF;
      END$$;
    `);

        console.log('Foreign key constraints added');

        // Add maxCapacity column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER;
    `);

        console.log('maxCapacity column added to Shift');

        // Migrate existing data - copy main instructor to ShiftInstructor
        const result = await prisma.$executeRawUnsafe(`
      INSERT INTO "ShiftInstructor" ("id", "shiftId", "instructorId", "createdAt")
      SELECT 
        gen_random_uuid()::text,
        "id",
        "instructorId",
        CURRENT_TIMESTAMP
      FROM "Shift"
      ON CONFLICT ("shiftId", "instructorId") DO NOTHING;
    `);

        console.log('Data migration completed:', result);

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
            steps: [
                'Created ShiftInstructor table',
                'Created unique index',
                'Added foreign key constraints',
                'Added maxCapacity column',
                'Migrated existing instructor data'
            ]
        });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
