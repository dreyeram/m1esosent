
/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("Users found:", users);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
