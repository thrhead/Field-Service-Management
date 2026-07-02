const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const logs = await prisma.systemLog.findMany({
            where: { level: 'AUDIT' },
            orderBy: { createdAt: 'desc' },
            take: 2
        });
        console.log(JSON.stringify(logs, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
