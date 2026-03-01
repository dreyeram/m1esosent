
/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log("--- Seeding Demo User ---");

    // 1. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: "Demo Clinic",
            type: "CLINIC",
            logoPath: null,
            letterheadConfig: "{}"
        }
    });
    console.log(`✅ Org Created: ${org.name}`);

    // 2. Create Admin
    const admin = await prisma.user.create({
        data: {
            username: "demo@clinic.com",
            passwordHash: "demo123", // In real app, hash this!
            fullName: "Demo Admin",
            role: "ADMIN",
            organizationId: org.id
        }
    });
    console.log(`✅ User Created: ${admin.username} / demo123`);

    // 3. Create Doctor
    const doctor = await prisma.user.create({
        data: {
            username: "doctor@clinic.com",
            passwordHash: "doc123",
            fullName: "Dr. Sarah",
            role: "DOCTOR",
            organizationId: org.id
        }
    });
    console.log(`✅ Doctor Created: ${doctor.username} / doc123`);

    // 4. Create Assistant
    const assistant = await prisma.user.create({
        data: {
            username: "assist@clinic.com",
            passwordHash: "assist123",
            fullName: "Nurse Joy",
            role: "ASSISTANT",
            organizationId: org.id
        }
    });
    console.log(`✅ Assistant Created: ${assistant.username} / assist123`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
