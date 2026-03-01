// Use a dynamic import or tsx relative path
import { prisma } from './lib/prisma';

async function main() {
    const data = {
        fullName: 'RAMKUMAR DIAG',
        age: 23,
        gender: 'Male',
        mobile: '7339286711',
        email: 'ram.dreye.diag@gmail.com',
        address: 'Chennai'
    };

    try {
        console.log('Starting diagnostic with APP PRISMA instance...');

        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        const mrn = `DIAG-${timestamp}${random}`;

        console.log('Executing prisma.patient.create with explicit fields...');
        // We use (any) to bypass TS errors if we are testing runtime failure
        const patient = await (prisma.patient as any).create({
            data: {
                fullName: data.fullName,
                mrn: mrn,
                gender: data.gender,
                mobile: data.mobile,
                email: data.email,
                address: data.address,
            },
        });

        console.log('SUCCESS! Application Prisma client is IN SYNC.');
        console.log('Result:', patient);
    } catch (e: any) {
        console.error('DIAGNOSTIC FAILURE WITH APP PRISMA:', e);
        if (e.message && e.message.includes('Unknown arg')) {
            console.error('CONFIRMED: Prisma client is OUT OF SYNC. Columns like "mobile" are unknown arg.');
        }
    } finally {
        await prisma.$disconnect()
    }
}

main()
