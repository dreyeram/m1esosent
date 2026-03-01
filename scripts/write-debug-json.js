const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    try {
        const orgs = await prisma.organization.findMany();
        const users = await prisma.user.findMany({
            include: { organization: true }
        });

        const data = {
            organizations: orgs,
            users: users.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role,
                orgId: u.organization?.id,
                orgName: u.organization?.name,
                logoPath: u.organization?.logoPath
            }))
        };

        fs.writeFileSync('e:\\mln\\endoscopy-suite\\scripts\\debug_data.json', JSON.stringify(data, null, 2));
        console.log('Data written to scripts/debug_data.json');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
