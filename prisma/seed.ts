
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'livoranger@gmail.com';
    const password = 'Raghu@0412';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.admin.findUnique({
        where: { email }
    });

    if (!existing) {
        await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                name: 'Super Admin'
            }
        });
        console.log(`Created admin user: ${email}`);
    } else {
        console.log(`Admin user already exists: ${email}. resetting password.`);
        await prisma.admin.update({
            where: { email },
            data: { password: hashedPassword }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
