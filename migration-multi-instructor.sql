-- CreateTable
CREATE TABLE IF NOT EXISTS "ShiftInstructor" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ShiftInstructor_shiftId_instructorId_key" ON "ShiftInstructor"("shiftId", "instructorId");

-- AddForeignKey
ALTER TABLE "ShiftInstructor" ADD CONSTRAINT "ShiftInstructor_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftInstructor" ADD CONSTRAINT "ShiftInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON UPDATE CASCADE;

-- AlterTable (Add maxCapacity to Shift)
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "maxCapacity" INTEGER;

-- Data Migration: Copy existing instructor relationships to ShiftInstructor
INSERT INTO "ShiftInstructor" ("id", "shiftId", "instructorId", "createdAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    "instructorId",
    CURRENT_TIMESTAMP
FROM "Shift"
ON CONFLICT ("shiftId", "instructorId") DO NOTHING;
