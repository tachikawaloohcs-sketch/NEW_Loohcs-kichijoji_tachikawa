
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'tachikawa@loohcs.co.jp';
    const password = 'Yamamoto_Hasegawa2525';

    console.log(`Verifying login for: ${email}`);

    try {
        const user = await prisma.user.findUnique({ where: { email: email } });

        if (!user) {
            console.log('USER NOT FOUND IN DB');
            return;
        }

        console.log('User found:', { email: user.email, role: user.role, hasPassword: !!user.password });

        if (!user.password) {
            console.log('USER HAS NO PASSWORD');
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        console.log('Password match:', match);

        if (user.role === "ADMIN" && user.email !== "tachikawa@loohcs.co.jp") {
            console.log('ADMIN LOGIN RESTRICTION FAILED');
        } else {
            console.log('ADMIN LOGIN RESTRICTION PASSED (or not admin)');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
