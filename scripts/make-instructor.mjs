
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'tachikawa.loohcs@gmail.com'; // Target email
    console.log(`Updating role for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'INSTRUCTOR' },
        });

        console.log(`Success! User ${updatedUser.name} (${updatedUser.email}) is now an INSTRUCTOR.`);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
