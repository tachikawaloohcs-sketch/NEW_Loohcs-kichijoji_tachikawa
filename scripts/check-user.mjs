
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'tachikawa.loohcs@gmail.com';
    console.log(`Checking user: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`FOUND: ${user.email} Role: ${user.role}`);
        } else {
            console.log(`NOT FOUND: ${email}`);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
