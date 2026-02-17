
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const bookings = await prisma.booking.findMany({
        where: { status: 'CONFIRMED' },
        include: {
            student: { select: { id: true, name: true, lineUserId: true } },
            shift: { select: { id: true, start: true } }
        }
    });

    const studentShiftMap = new Map();
    const duplicates = [];

    for (const b of bookings) {
        const key = `${b.studentId}-${b.shiftId}`;
        if (studentShiftMap.has(key)) {
            duplicates.push(b);
        } else {
            studentShiftMap.set(key, b);
        }
    }

    console.log('Duplicate bookings found:', duplicates.length);
    for (const d of duplicates) {
        console.log(`Student: ${d.student.name} (${d.student.id}), Shift: ${d.shiftId} at ${d.shift.start}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
