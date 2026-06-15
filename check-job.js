const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const jobs = await prisma.job.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, status: true, acceptanceStatus: true }
  })
  console.log('Recent jobs:', JSON.stringify(jobs, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
