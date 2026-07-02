import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-helper'
import { z } from 'zod'
import { notifyApprovalApproved, notifyApprovalRejected, notifyAdminsOfApprovalResult } from '@/lib/notifications'
import { logAudit, AuditAction } from '@/lib/audit'

const updateApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional()
})

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth(req)
    if (!session || !['ADMIN', 'MANAGER', 'TEAM_LEAD'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await props.params
    const { id } = params
    const body = await req.json()
    const { status, notes } = updateApprovalSchema.parse(body)

    // Get approval
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        job: true,
        requester: true
      }
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    if (approval.status !== 'PENDING') {
      return NextResponse.json({ error: 'Approval already processed' }, { status: 400 })
    }

    // Update approval
    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        approverId: session.user.id,
        updatedAt: new Date()
      }
    })

    // Audit Logging
    try {
      await logAudit(session.user.id, status === 'APPROVED' ? AuditAction.APPROVAL_APPROVE : AuditAction.APPROVAL_REJECT, {
        jobId: approval.jobId,
        resourceId: approval.id,
        resourceName: approval.type === 'JOB_COMPLETION' ? 'İş Tamamlama Onayı' : approval.type,
        title: approval.job?.title || '',
        userName: session.user.name || 'Yönetici',
        notes: notes || undefined
      });
    } catch (auditErr) {
      console.error('[Job Approval Logging] Failed to write audit log:', auditErr);
    }

    // Update job status based on approval decision
    if (status === 'APPROVED') {
      const jobData: any = {
        status: 'COMPLETED',
        completedDate: new Date()
      }

      // If it's a job completion approval, also set acceptance status for customer
      if (approval.type === 'JOB_COMPLETION') {
        jobData.acceptanceStatus = 'ACCEPTED'
      }

      await prisma.job.update({
        where: { id: approval.jobId },
        data: jobData
      })

      // Notify requester
      await notifyApprovalApproved(approval.jobId, approval.requesterId)
    } else if (status === 'REJECTED') {
      const jobData: any = { status: 'IN_PROGRESS' }
      
      if (approval.type === 'JOB_COMPLETION') {
        jobData.acceptanceStatus = 'REJECTED'
      }

      await prisma.job.update({
        where: { id: approval.jobId },
        data: jobData
      })

      // Notify requester
      await notifyApprovalRejected(approval.jobId, approval.requesterId, notes)
    }

    // Notify all admins about the decision
    await notifyAdminsOfApprovalResult(approval.jobId, session.user.id, status, notes)

    return NextResponse.json({ success: true, approval: updatedApproval })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    console.error('Update approval error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
