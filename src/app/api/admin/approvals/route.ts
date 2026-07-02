export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-helper';
import { sendUserNotification, sendJobNotification } from '@/lib/notification-helper';
import { logAudit, AuditAction } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, type, action, reason } = body;
    // action: 'APPROVE' | 'REJECT'
    // type: 'COST' | 'STEP' | 'SUB_STEP'

    if (!id || !type || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isApprove = action === 'APPROVE';
    const session = await verifyAuth(req);
    const userId = session?.user?.id || 'system';

    switch (type) {
      case 'COST': {
        const cost = await prisma.costTracking.update({
          where: { id },
          data: {
            status: isApprove ? 'APPROVED' : 'REJECTED',
            rejectionReason: !isApprove ? reason : null,
            approvedById: userId
          },
          include: {
            job: { select: { title: true } },
            createdBy: { select: { id: true } }
          }
        });

        // Audit Logging
        try {
          await logAudit(userId, isApprove ? AuditAction.COST_APPROVE : AuditAction.COST_REJECT, {
            jobId: cost.jobId,
            resourceId: cost.id,
            resourceName: cost.description || 'Masraf',
            title: cost.job?.title || '',
            userName: session?.user?.name || 'Yönetici',
            rejectionReason: !isApprove ? reason : undefined
          });
        } catch (auditErr) {
          console.error('[Admin Cost Approval Logging] Failed to write audit log:', auditErr);
        }

        // Notify the creator of the cost
        if (cost.createdById && cost.createdById !== userId) {
          await sendUserNotification(
            cost.createdById,
            isApprove ? 'Masraf Onaylandı ✅' : 'Masraf Reddedildi ❌',
            isApprove 
              ? `"${cost.job?.title}" işi için girilen masraf onaylandı.` 
              : `Masraf reddedildi. Sebep: ${reason}`,
            isApprove ? 'SUCCESS' : 'ERROR',
            `/worker/jobs/${cost.jobId}`
          );
        }
        break;
      }
      
      case 'STEP': {
        const step = await prisma.jobStep.update({
          where: { id },
          data: {
            approvalStatus: isApprove ? 'APPROVED' : 'REJECTED',
            rejectionReason: !isApprove ? reason : null,
            approvedAt: isApprove ? new Date() : null,
            approvedById: userId
          },
          include: {
            job: {
              select: { 
                title: true
              }
            }
          }
        });

        // Audit Logging
        try {
          await logAudit(userId, isApprove ? 'STEP_APPROVE' : 'STEP_REJECT', {
            jobId: step.jobId,
            resourceId: step.id,
            resourceName: step.title,
            title: step.job?.title || '',
            userName: session?.user?.name || 'Yönetici',
            rejectionReason: !isApprove ? reason : undefined
          });
        } catch (auditErr) {
          console.error('[Admin Step Approval Logging] Failed to write audit log:', auditErr);
        }

        await sendJobNotification(
            step.jobId,
            isApprove ? 'İş Adımı Onaylandı ✅' : 'İş Adımı Reddedildi ❌',
            `"${step.job.title}" işindeki "${step.title}" adımı ${isApprove ? 'onaylandı' : `reddedildi. Sebep: ${reason}`}`,
            isApprove ? 'SUCCESS' : 'ERROR',
            `/worker/jobs/${step.jobId}`
        );
        break;
      }

      case 'SUB_STEP': {
        const subStep = await prisma.jobSubStep.update({
          where: { id },
          data: {
            approvalStatus: isApprove ? 'APPROVED' : 'REJECTED',
            rejectionReason: !isApprove ? reason : null,
            approvedAt: isApprove ? new Date() : null,
            approvedById: userId
          },
          include: {
            step: {
              include: {
                job: {
                  select: { 
                    title: true
                  }
                }
              }
            }
          }
        });

        // Audit Logging
        try {
          await logAudit(userId, isApprove ? 'SUBSTEP_APPROVE' : 'SUBSTEP_REJECT', {
            jobId: subStep.step.jobId,
            resourceId: subStep.id,
            resourceName: subStep.title,
            title: subStep.step.job?.title || '',
            userName: session?.user?.name || 'Yönetici',
            rejectionReason: !isApprove ? reason : undefined
          });
        } catch (auditErr) {
          console.error('[Admin Substep Approval Logging] Failed to write audit log:', auditErr);
        }

        await sendJobNotification(
            subStep.step.jobId,
            isApprove ? 'Alt Görev Onaylandı ✅' : 'Alt Görev Reddedildi ❌',
            `"${subStep.step.job.title}" işindeki "${subStep.title}" alt görevi ${isApprove ? 'onaylandı' : `reddedildi. Sebep: ${reason}`}`,
            isApprove ? 'SUCCESS' : 'ERROR',
            `/worker/jobs/${subStep.step.jobId}`
        );
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Successfully ${isApprove ? 'approved' : 'rejected'}` });

  } catch (error: any) {
    console.error('[APPROVALS_POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval action' },
      { status: 500 }
    );
  }
}
