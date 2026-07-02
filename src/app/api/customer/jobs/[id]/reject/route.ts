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
    const { notes, reason } = await req.json().catch(() => ({ notes: '', reason: '' }))

    if (!reason && !notes) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

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

    if (job.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Only completed jobs can be rejected' }, { status: 400 })
    }

    const rejectionMsg = reason || notes;

    // Start transaction
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Revert job status to IN_PROGRESS or a special REJECTED status
      const updated = await tx.job.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS', // Back to progress so workers can fix issues
          acceptanceStatus: 'REJECTED',
          rejectionReason: rejectionMsg
        }
      })

      // Create approval record (with REJECTED status)
      await tx.approval.create({
        data: {
          jobId: id,
          requesterId: job.creatorId,
          approverId: session.user.id,
          status: 'REJECTED',
          type: 'CUSTOMER_FINAL_APPROVAL',
          notes: rejectionMsg
        }
      })

      return updated
    })

    await logAudit(session.user.id, AuditAction.JOB_CUSTOMER_REJECT, {
      jobId: id,
      title: job.title,
      userName: session.user.name || 'Müşteri',
      rejectionReason: rejectionMsg
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
        'İş Reddedildi ❌',
        `"${job.title}" işi müşteri tarafından reddedilmiştir. (Sebep: ${rejectionMsg})`,
        'ERROR',
        `/admin/jobs/${id}`
    );

    return NextResponse.json({ success: true, job: updatedJob })
  } catch (error) {
    console.error('Job rejection error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
