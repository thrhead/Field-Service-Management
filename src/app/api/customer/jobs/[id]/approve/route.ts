import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-helper'
import { logAudit, AuditAction } from '@/lib/audit'
import { sendNotificationToUsers } from '@/lib/notification-helper'

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params
    const { notes } = await req.json().catch(() => ({ notes: '' }))

    // Get customer profile
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
    }

    // Get job and verify ownership
    const job = await prisma.job.findFirst({
      where: {
        id,
        customerId: customer.id
      },
      include: {
        creator: true,
        assignments: { include: { team: { include: { members: true } } } }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // A job is approvable by customer if it's COMPLETED (already approved by admin)
    if (job.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Bu iş henüz onaylanmaya hazır değil.' }, { status: 400 })
    }

    // Start transaction to update job and create approval record
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Update job status
      const updated = await tx.job.update({
        where: { id },
        data: {
          status: 'ACCEPTED', // Customer final approval
          acceptanceStatus: 'ACCEPTED'
        }
      })

      // Create approval record
      await tx.approval.create({
        data: {
          jobId: id,
          requesterId: job.creatorId,
          approverId: session.user.id,
          status: 'APPROVED',
          type: 'CUSTOMER_FINAL_APPROVAL',
          notes: notes || 'Müşteri tarafından onaylandı.'
        }
      })

      return updated
    })

    await logAudit(session.user.id, AuditAction.JOB_CUSTOMER_ACCEPT, {
      jobId: id,
      title: job.title,
      userName: session.user.name || 'Müşteri'
    })

    // Send notifications to workers, job lead, creator, and admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MANAGER', 'TEAM_LEAD'] }, isActive: true },
      select: { id: true }
    });
    
    const recipientIds = new Set(admins.map(a => a.id));
    recipientIds.add(job.creatorId);
    if (job.jobLeadId) recipientIds.add(job.jobLeadId);
    job.assignments.forEach(a => {
        if (a.workerId) recipientIds.add(a.workerId);
        a.team?.members?.forEach(m => recipientIds.add(m.userId));
    });

    await sendNotificationToUsers(
        Array.from(recipientIds),
        'İş Onaylandı ✅',
        `"${job.title}" işi müşteri tarafından onaylanmıştır.`,
        'SUCCESS',
        `/admin/jobs/${id}`
    );

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error('Job approval error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
