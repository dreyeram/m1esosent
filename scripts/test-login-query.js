/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function loginTest() {
    console.log("Checking DB connection...");
    const username = "doctor@clinic.com";
    const passwordHash = "doc123";

    console.log(`Searching for: ${username}`);
    const user = await prisma.user.findUnique({
        where: { username },
        include: { organization: true },
    });

    if (!user) {
        console.error("User NOT found");
        return;
    }

    console.log(`User found: ${user.username}, Hash: ${user.passwordHash}`);
    if (user.passwordHash !== passwordHash) {
        console.error("Password Mismatch!");
    } else {
        console.log("✅ Credentials Valid. Login should succeed.");
    }
}

loginTest()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
