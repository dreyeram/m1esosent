import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const org = await prisma.organization.findFirst()
    console.log('ORGANIZATION_DATA:', JSON.stringify(org, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
