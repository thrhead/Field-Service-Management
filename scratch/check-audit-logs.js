const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Son 5 Audit Log Kaydı:");
    const logs = await prisma.systemLog.findMany({
        where: { level: 'AUDIT' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(logs, null, 2));
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
