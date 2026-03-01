const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    try {
        const users = await prisma.user.findMany({
            include: { organization: true }
        });

        const data = {
            users: users.map(u => ({
                id: u.id,
                username: u.username,
                fullName: u.fullName,
                profilePicturePath: u.profilePicturePath,
                orgName: u.organization?.name,
                orgLogoPath: u.organization?.logoPath
            }))
        };

        fs.writeFileSync('e:\\mln\\endoscopy-suite\\scripts\\debug_users.json', JSON.stringify(data, null, 2));
        console.log('Data written to scripts/debug_users.json');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
