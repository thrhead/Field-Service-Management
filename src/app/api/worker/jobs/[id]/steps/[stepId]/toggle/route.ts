import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-helper'
import { checkConflict } from '@/lib/conflict-check'
import { publishToJob } from '@/lib/ably'
import { logAudit, AuditAction, getDeviceInfo } from '@/lib/audit'

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string; stepId: string }> }
) {
  const params = await props.params
  try {
    const session = await verifyAuth(req)
    if (!session || !['WORKER', 'TEAM_LEAD', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const step = await prisma.jobStep.findUnique({
      where: { id: params.stepId },
      include: { job: { select: { updatedAt: true, title: true } } }
    })

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Check Access
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      const hasAccess = await prisma.jobAssignment.findFirst({
        where: {
          jobId: step.jobId,
          OR: [
            { workerId: session.user.id },
            { team: { members: { some: { userId: session.user.id } } } }
          ]
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Seviye 3: Ebeveyn iş üzerinden çakışma kontrolü
    const conflict = await checkConflict(req, step.job.updatedAt)
    if (conflict) return conflict

    // 1. Check if previous steps are completed
    if (!step.isCompleted && step.order > 1) {
      const previousStep = await prisma.jobStep.findFirst({
        where: {
          jobId: step.jobId,
          order: step.order - 1
        }
      })

      if (previousStep && !previousStep.isCompleted) {
        return NextResponse.json(
          { error: 'Önceki adımı tamamlamadan bu adıma geçemezsiniz.' },
          { status: 400 }
        )
      }
    }

    // MANDATORY PHOTO CHECK FOR MAIN STEP
    // User requested that the main step requires its own photo to be completed.
    // If we are marking as completed (!step.isCompleted means we are setting it to true)
    if (!step.isCompleted) {
        const photoCount = await prisma.stepPhoto.count({
            where: {
                stepId: params.stepId,
                subStepId: null // explicitly checking for photos on the parent step, not substeps
            }
        });

        if (photoCount === 0) {
            return NextResponse.json(
                { error: 'bu iş emrini kapatabilmeniz için öncelikle en az 1 adet genel fotoğraf yüklemeniz gerekmektedir' },
                { status: 400 }
            )
        }
    }

    // 2. Check if all substeps are completed
    const subSteps = await prisma.jobSubStep.findMany({
      where: { stepId: params.stepId }
    })

    if (!step.isCompleted && subSteps.length > 0) {
      const incompleteSubSteps = subSteps.filter(s => !s.isCompleted)
      if (incompleteSubSteps.length > 0) {
        return NextResponse.json(
          { error: 'Tüm alt görevleri tamamlamadan bu adımı tamamlayamazsınız.' },
          { status: 400 }
        )
      }
    }

    const wasApproved = step.approvalStatus === 'APPROVED'

    const updatedStep = await prisma.jobStep.update({
      where: { id: params.stepId },
      data: {
        isCompleted: !step.isCompleted,
        completedAt: !step.isCompleted ? new Date() : null,
        completedById: !step.isCompleted ? session.user.id : null,
        startedAt: !step.isCompleted && !step.startedAt ? new Date() : step.startedAt,
        approvalStatus: 'PENDING', // Reset to PENDING on change
        rejectionReason: !step.isCompleted ? null : step.rejectionReason, // Clear rejection reason if completing again
        approvedById: null,
        approvedAt: null
      }
    })

    if (wasApproved) {
        const { sendAdminNotification } = await import('@/lib/notification-helper')
        await sendAdminNotification(
            'Onay İptal Edildi',
            `Bir iş adımının (Adım: ${step.title}) durumu değiştirildi. Yeniden onay gerekiyor.`,
            'WARNING',
            `/admin/jobs/${step.jobId}`,
            session.user.id
        );
    }

    if (updatedStep.isCompleted && !step.isCompleted && subSteps.length === 0) {
        const { sendAdminNotification, sendNotificationToUsers } = await import('@/lib/notification-helper')
        const { broadcast } = await import('@/lib/ably')

        await broadcast('step:completed', {
            stepId: params.stepId,
            jobId: step.jobId,
            jobTitle: step.job.title,
            stepTitle: step.title,
            completedBy: session.user.name || session.user.email
        });

        await sendAdminNotification(
            'Adım Tamamlandı',
            `"${step.job.title}" - "${step.title}" tamamlandı (${session.user.name || session.user.email})`,
            'SUCCESS',
            `/admin/jobs/${step.jobId}`
        );

        // Fetch customer and notify
        const jobWithCustomer = await prisma.job.findUnique({
            where: { id: step.jobId },
            include: { customer: { include: { user: true } } }
        });

        if (jobWithCustomer?.customer?.userId) {
            await sendNotificationToUsers(
                [jobWithCustomer.customer.userId],
                'İş Adımı Tamamlandı',
                `"${step.job.title}" işindeki "${step.title}" adımı tamamlanmıştır.`,
                'INFO',
                `/customer/jobs/${step.jobId}`
            );
        }
    }

    // Detailed Audit Logging
    const deviceInfo = getDeviceInfo(req);
    await logAudit(
        session.user.id,
        updatedStep.isCompleted ? AuditAction.JOB_STEP_COMPLETE : AuditAction.JOB_UPDATE,
        {
            jobId: step.jobId,
            stepId: params.stepId,
            title: step.title,
            userName: session.user.name || session.user.email,
            ...deviceInfo,
            snapshot: step // Original state
        },
        deviceInfo.platform
    );

    // Real-time update
    await publishToJob(step.jobId, 'job:updated', { id: step.jobId, updatedAt: new Date(), updatedBy: session.user.id });

    return NextResponse.json(updatedStep)
  } catch (error) {
    console.error('Step toggle error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
