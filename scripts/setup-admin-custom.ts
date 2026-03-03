import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'tachikawa.loohcs@gmail.com';
    const password = 'Yamamoto_Hasegawa2525';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            // Ensure these fields exist or are valid for your schema
            isActive: true,
            isProfileComplete: true,
        },
        create: {
            email,
            name: '管理者',
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
            isProfileComplete: true,
        },
    });

    console.log('Successfully created/updated admin user:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
