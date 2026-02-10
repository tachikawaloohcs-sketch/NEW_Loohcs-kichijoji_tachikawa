import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
    try {
        console.log('Starting migration...');

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

        // Create unique index
        await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ShiftInstructor_shiftId_instructorId_key" 
      ON "ShiftInstructor"("shiftId", "instructorId");
    `);

        // Add foreign keys
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

        // Add maxCapacity column
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER;
    `);

        // Migrate existing data
        await prisma.$executeRawUnsafe(`
      INSERT INTO "ShiftInstructor" ("id", "shiftId", "instructorId", "createdAt")
      SELECT 
        gen_random_uuid()::text,
        "id",
        "instructorId",
        CURRENT_TIMESTAMP
      FROM "Shift"
      ON CONFLICT ("shiftId", "instructorId") DO NOTHING;
    `);

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
