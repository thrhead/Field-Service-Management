import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-helper'
import { logAudit, AuditAction } from '@/lib/audit'
import { sendNotificationToUsers, sendJobNotification } from '@/lib/notification-helper'

export async function POST(
    req: Request,
    props: { params: Promise<{ stepId: string }> }
) {
    const params = await props.params
    try {
        const session = await verifyAuth(req)
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const step = await prisma.jobStep.findUnique({
            where: { id: params.stepId },
            include: { job: { include: { customer: { include: { user: true } } } } }
        })

        if (!step) {
            return NextResponse.json({ error: 'Step not found' }, { status: 404 })
        }

        const updatedStep = await prisma.jobStep.update({
            where: { id: params.stepId },
            data: {
                approvalStatus: 'APPROVED',
                approvedById: session.user.id,
                approvedAt: new Date(),
                rejectionReason: null
            }
        })

        // Audit Logging
        try {
            await logAudit(session.user.id, 'STEP_APPROVE', {
                jobId: step.jobId,
                resourceId: step.id,
                resourceName: step.title,
                title: step.job?.title || '',
                userName: session.user.name || 'Yönetici'
            });
        } catch (auditErr) {
            console.error('[Manager Step Approval Logging] Failed to write audit log:', auditErr);
        }

        // Notify the worker who completed the step
        if (step.completedById) {
            await sendJobNotification(
                step.jobId,
                'İş Adımı Onaylandı ✅',
                `"${step.job.title}" işindeki "${step.title}" adımı onaylandı.`,
                'SUCCESS',
                `/worker/jobs/${step.jobId}`
            );
        }

        // Notify customer
        if (step.job.customer?.userId) {
            await sendNotificationToUsers(
                [step.job.customer.userId],
                'İş Adımı Onaylandı ✅',
                `"${step.job.title}" işindeki "${step.title}" adımı onaylanmıştır.`,
                'INFO',
                `/customer/jobs/${step.jobId}`
            );
        }

        return NextResponse.json(updatedStep)
    } catch (error) {
        console.error('Step approval error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
