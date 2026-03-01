/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE CHECK ---');

    const patientCount = await prisma.patient.count();
    console.log('Total Patients:', patientCount);

    const patients = await prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fullName: true,
            mrn: true,
            age: true,
            dateOfBirth: true,
            deletedAt: true
        }
    });

    console.log('Recent Patients:', JSON.stringify(patients, null, 2));

    const deletedCount = await prisma.patient.count({
        where: { NOT: { deletedAt: null } }
    });
    console.log('Soft Deleted Patients:', deletedCount);

    console.log('--- END CHECK ---');
}

main()
    .catch(e => {
        console.error('ERROR during check:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
