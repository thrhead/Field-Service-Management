const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Audit Loglarının Meta Verilerini İnceliyorum...");
    try {
        const logs = await prisma.systemLog.findMany({
            where: { level: 'AUDIT' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        logs.forEach(log => {
            console.log("---");
            console.log("ID:", log.id);
            console.log("Message:", log.message);
            console.log("Meta:", JSON.stringify(log.meta, null, 2));
        });
    } catch (e) {
        console.error("Hata:", e);
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
