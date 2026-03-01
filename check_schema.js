/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const prisma = new PrismaClient();

async function main() {
    try {
        const org = await prisma.organization.findFirst();
        console.log('Organization trial:', org);
        const user = await prisma.user.findFirst();
        console.log('User trial:', user);
    } catch (e) {
        console.error('Schema check failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
