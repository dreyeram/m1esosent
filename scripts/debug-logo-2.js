const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const orgs = await prisma.organization.findMany();
        console.log('--- ORGANIZATIONS ---');
        console.log(JSON.stringify(orgs, null, 2));

        const users = await prisma.user.findMany({
            include: { organization: true }
        });
        console.log('\n--- USERS ---');
        console.log(JSON.stringify(users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            orgName: u.organization?.name,
            logoPath: u.organization?.logoPath
        })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
