/* eslint-disable */
const { PrismaClient } = require('@prisma/client');

async function checkLogo() {
    const prisma = new PrismaClient();
    try {
        const org = await prisma.organization.findFirst();
        console.log('Organization:', org?.name);
        console.log('Logo exists in DB:', !!org?.logoPath);
        console.log('Logo length:', org?.logoPath?.length || 0);
        if (org?.logoPath) {
            console.log('Logo starts with:', org.logoPath.substring(0, 30));
        }
    } finally {
        await prisma.$disconnect();
    }
}

checkLogo();
