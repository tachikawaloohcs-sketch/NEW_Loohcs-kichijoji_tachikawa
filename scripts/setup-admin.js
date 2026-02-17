
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    const email = 'tachikawa@loohcs.co.jp';
    const password = 'Yamamoto_Hasegawa2525';

    console.log(`Setting up Admin user: ${email}`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                isProfileComplete: true
            },
            create: {
                email: email,
                name: 'System Admin',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                isProfileComplete: true
            }
        });

        console.log(`SUCCESS: Admin user ${user.email} has been updated/created with role ADMIN.`);
    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
