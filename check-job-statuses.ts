
import { prisma } from "./src/lib/db";

async function checkJobStatuses() {
    const jobs = await prisma.job.groupBy({
        by: ['status'],
        _count: true
    });
    console.log("Job status distribution:", jobs);
}

checkJobStatuses()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
