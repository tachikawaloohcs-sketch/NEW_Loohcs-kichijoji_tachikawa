import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createParent(parentName: string, parentEmail: string, parentPassword: string, studentEmails: string[]) {
    try {
        console.log(`Creating parent account for: ${parentName} (${parentEmail})`);

        // 1. 生徒の検索
        const students = await prisma.user.findMany({
            where: {
                email: { in: studentEmails },
                role: 'STUDENT'
            }
        });

        if (students.length === 0) {
            console.error('No students found with provided emails.');
            return;
        }

        console.log(`Found ${students.length} students to link.`);

        // 2. 保護者アカウントの作成（または取得）
        const hashedPassword = await bcrypt.hash(parentPassword, 10);

        let parent = await prisma.user.findUnique({
            where: { email: parentEmail }
        });

        if (!parent) {
            parent = await prisma.user.create({
                data: {
                    name: parentName,
                    email: parentEmail,
                    password: hashedPassword,
                    role: 'PARENT',
                    isActive: true,
                    isProfileComplete: true,
                }
            });
            console.log(`Created new parent account: ${parent.id}`);
        } else {
            console.log(`Parent account already exists: ${parent.id}. Updating role if needed.`);
            if (parent.role !== 'PARENT' && parent.role !== 'ADMIN') {
                await prisma.user.update({
                    where: { id: parent.id },
                    data: { role: 'PARENT' }
                });
            }
        }

        // 3. 生徒との紐付け
        for (const student of students) {
            await prisma.user.update({
                where: { id: student.id },
                data: { parentId: parent.id } as any
            });
            console.log(`Linked student ${student.name} (${student.email}) to parent.`);
        }

        console.log('Parent account created and linked successfully.');

    } catch (error) {
        console.error('Error creating parent account:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 使用例:
// ノード引数から取得するか、直接記述して実行
const parentEmail = process.argv[2];
const studentEmail = process.argv[3];

if (!parentEmail || !studentEmail) {
    console.log('Usage: npx tsx scripts/create-parent.ts <parent_email> <student_email>');
    console.log('Example: npx tsx scripts/create-parent.ts parent@example.com student@example.com');
} else {
    createParent('保護者様', parentEmail, 'password123', [studentEmail]);
}
