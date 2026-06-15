import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const jobId = process.argv[2]
  if (!jobId) {
    console.log('Usage: npx ts-node script.js <jobId>')
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, acceptanceStatus: true }
    })
    console.log('Recent jobs:', jobs)
    return
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, status: true, acceptanceStatus: true }
  })
  console.log('Job info:', job)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
