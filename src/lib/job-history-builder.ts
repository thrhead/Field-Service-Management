/**
 * Builds a comprehensive job activity history using a hybrid approach:
 * 1. Audit logs (SystemLog with level=AUDIT) for detailed who/when
 * 2. Computed history from model fields (createdAt, startedAt, completedAt, etc.)
 * Merges both sources, deduplicates, and sorts chronologically.
 */

export type ActivityType =
  | 'JOB_CREATED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_CLOSED'
  | 'STEP_COMPLETED'
  | 'STEP_APPROVED'
  | 'STEP_REJECTED'
  | 'SUBSTEP_COMPLETED'
  | 'SUBSTEP_APPROVED'
  | 'SUBSTEP_REJECTED'
  | 'COST_ADDED'
  | 'COST_APPROVED'
  | 'COST_REJECTED'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REJECTED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'JOB_UPDATED'
  | 'PHOTO_UPLOADED'
  | 'TEAM_ASSIGNED'
  | 'STEP_BLOCKED'
  | 'SUBSTEP_BLOCKED'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description?: string
  userName: string
  date: string // ISO string
  icon: 'create' | 'start' | 'complete' | 'approve' | 'reject' | 'cost' | 'photo' | 'team' | 'update' | 'block' | 'customer'
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'orange' | 'gray' | 'rose' | 'emerald' | 'cyan'
  source: 'audit' | 'computed'
  meta?: Record<string, any>
}

/**
 * Builds computed history from the job object's existing fields and relations.
 * This ensures history is available even for jobs created before audit logging.
 */
export function buildComputedHistory(job: any): ActivityItem[] {
  const items: ActivityItem[] = []
  let counter = 0
  const cid = () => `computed-${counter++}`

  // 1. Job created
  if (job.createdAt) {
    items.push({
      id: cid(),
      type: 'JOB_CREATED',
      title: 'İş Emri Oluşturuldu',
      description: `${job.jobNo || ''} - ${job.title}`,
      userName: job.creator?.name || 'Sistem',
      date: new Date(job.createdAt).toISOString(),
      icon: 'create',
      color: 'blue',
      source: 'computed',
    })
  }

  // 2. Team assigned
  if (job.assignments?.length > 0) {
    for (const a of job.assignments) {
      items.push({
        id: cid(),
        type: 'TEAM_ASSIGNED',
        title: 'Ekip Atandı',
        description: a.team?.name || a.worker?.name || 'Bilinmeyen',
        userName: job.creator?.name || 'Admin',
        date: new Date(a.assignedAt || job.createdAt).toISOString(),
        icon: 'team',
        color: 'cyan',
        source: 'computed',
      })
    }
  }

  // 3. Job started
  if (job.startedAt) {
    items.push({
      id: cid(),
      type: 'JOB_STARTED',
      title: 'İş Başlatıldı',
      userName: job.acceptedBy?.name || job.jobLead?.name || 'Çalışan',
      date: new Date(job.startedAt).toISOString(),
      icon: 'start',
      color: 'emerald',
      source: 'computed',
    })
  }

  // 4. Steps and substeps
  if (job.steps?.length > 0) {
    for (const step of job.steps) {
      // Step started
      if (step.startedAt) {
        items.push({
          id: cid(),
          type: 'STEP_COMPLETED',
          title: `Adım Başlatıldı: ${step.title}`,
          description: step.stepNo || undefined,
          userName: step.completedBy?.name || 'Çalışan',
          date: new Date(step.startedAt).toISOString(),
          icon: 'start',
          color: 'blue',
          source: 'computed',
        })
      }

      // Step blocked
      if (step.blockedAt) {
        items.push({
          id: cid(),
          type: 'STEP_BLOCKED',
          title: `Adım Bloklandı: ${step.title}`,
          description: step.blockedReason || step.blockedNote || undefined,
          userName: 'Sistem',
          date: new Date(step.blockedAt).toISOString(),
          icon: 'block',
          color: 'red',
          source: 'computed',
        })
      }

      // Step completed
      if (step.isCompleted && step.completedAt) {
        items.push({
          id: cid(),
          type: 'STEP_COMPLETED',
          title: `Adım Tamamlandı: ${step.title}`,
          description: step.stepNo || undefined,
          userName: step.completedBy?.name || 'Çalışan',
          date: new Date(step.completedAt).toISOString(),
          icon: 'complete',
          color: 'green',
          source: 'computed',
        })
      }

      // Step approved/rejected
      if (step.approvalStatus === 'APPROVED' && step.approvedAt) {
        items.push({
          id: cid(),
          type: 'STEP_APPROVED',
          title: `Adım Onaylandı: ${step.title}`,
          userName: step.approvedBy?.name || 'Yönetici',
          date: new Date(step.approvedAt).toISOString(),
          icon: 'approve',
          color: 'emerald',
          source: 'computed',
        })
      } else if (step.approvalStatus === 'REJECTED' && step.approvedAt) {
        items.push({
          id: cid(),
          type: 'STEP_REJECTED',
          title: `Adım Reddedildi: ${step.title}`,
          description: step.rejectionReason || undefined,
          userName: step.approvedBy?.name || 'Yönetici',
          date: new Date(step.approvedAt).toISOString(),
          icon: 'reject',
          color: 'red',
          source: 'computed',
        })
      }

      // Substeps
      if (step.subSteps?.length > 0) {
        for (const sub of step.subSteps) {
          if (sub.startedAt) {
            items.push({
              id: cid(),
              type: 'SUBSTEP_COMPLETED',
              title: `Alt Görev Başlatıldı: ${sub.title}`,
              description: `${step.title} → ${sub.subStepNo || ''}`,
              userName: 'Çalışan',
              date: new Date(sub.startedAt).toISOString(),
              icon: 'start',
              color: 'blue',
              source: 'computed',
            })
          }

          if (sub.blockedAt) {
            items.push({
              id: cid(),
              type: 'SUBSTEP_BLOCKED',
              title: `Alt Görev Bloklandı: ${sub.title}`,
              description: sub.blockedReason || sub.blockedNote || undefined,
              userName: 'Sistem',
              date: new Date(sub.blockedAt).toISOString(),
              icon: 'block',
              color: 'red',
              source: 'computed',
            })
          }

          if (sub.isCompleted && sub.completedAt) {
            items.push({
              id: cid(),
              type: 'SUBSTEP_COMPLETED',
              title: `Alt Görev Tamamlandı: ${sub.title}`,
              description: `${step.title} → ${sub.subStepNo || ''}`,
              userName: 'Çalışan',
              date: new Date(sub.completedAt).toISOString(),
              icon: 'complete',
              color: 'green',
              source: 'computed',
            })
          }

          if (sub.approvalStatus === 'APPROVED' && sub.approvedAt) {
            items.push({
              id: cid(),
              type: 'SUBSTEP_APPROVED',
              title: `Alt Görev Onaylandı: ${sub.title}`,
              description: `${step.title}`,
              userName: sub.approvedBy?.name || 'Yönetici',
              date: new Date(sub.approvedAt).toISOString(),
              icon: 'approve',
              color: 'emerald',
              source: 'computed',
            })
          } else if (sub.approvalStatus === 'REJECTED' && sub.approvedAt) {
            items.push({
              id: cid(),
              type: 'SUBSTEP_REJECTED',
              title: `Alt Görev Reddedildi: ${sub.title}`,
              description: `${step.title} — ${sub.rejectionReason || ''}`,
              userName: sub.approvedBy?.name || 'Yönetici',
              date: new Date(sub.approvedAt).toISOString(),
              icon: 'reject',
              color: 'red',
              source: 'computed',
            })
          }
        }
      }

      // Photos
      if (step.photos?.length > 0) {
        for (const photo of step.photos) {
          items.push({
            id: cid(),
            type: 'PHOTO_UPLOADED',
            title: `Fotoğraf Yüklendi`,
            description: step.title,
            userName: photo.uploadedBy?.name || 'Çalışan',
            date: new Date(photo.uploadedAt).toISOString(),
            icon: 'photo',
            color: 'purple',
            source: 'computed',
          })
        }
      }
    }
  }

  // 5. Costs
  if (job.costs?.length > 0) {
    for (const cost of job.costs) {
      items.push({
        id: cid(),
        type: 'COST_ADDED',
        title: `Masraf Eklendi: ${cost.description}`,
        description: `${cost.amount.toLocaleString('tr-TR')} ${cost.currency || 'TRY'}`,
        userName: cost.createdBy?.name || 'Bilinmeyen',
        date: new Date(cost.createdAt || cost.date).toISOString(),
        icon: 'cost',
        color: 'orange',
        source: 'computed',
        meta: { amount: cost.amount, currency: cost.currency },
      })

      if (cost.status === 'APPROVED') {
        items.push({
          id: cid(),
          type: 'COST_APPROVED',
          title: `Masraf Onaylandı: ${cost.description}`,
          description: `${cost.amount.toLocaleString('tr-TR')} ${cost.currency || 'TRY'}`,
          userName: cost.approvedBy?.name || 'Yönetici',
          date: new Date(cost.updatedAt || cost.date).toISOString(),
          icon: 'approve',
          color: 'emerald',
          source: 'computed',
        })
      } else if (cost.status === 'REJECTED') {
        items.push({
          id: cid(),
          type: 'COST_REJECTED',
          title: `Masraf Reddedildi: ${cost.description}`,
          description: cost.rejectionReason || `${cost.amount.toLocaleString('tr-TR')} ${cost.currency || 'TRY'}`,
          userName: cost.approvedBy?.name || 'Yönetici',
          date: new Date(cost.updatedAt || cost.date).toISOString(),
          icon: 'reject',
          color: 'red',
          source: 'computed',
        })
      }
    }
  }

  // 6. Approvals (from Approval model)
  if (job.allApprovals?.length > 0) {
    for (const approval of job.allApprovals) {
      if (approval.status === 'APPROVED') {
        items.push({
          id: cid(),
          type: 'APPROVAL_APPROVED',
          title: `Onay Verildi (${approval.type === 'JOB_COMPLETION' ? 'İş Tamamlama' : approval.type})`,
          description: approval.notes || undefined,
          userName: approval.approver?.name || 'Yönetici',
          date: new Date(approval.updatedAt).toISOString(),
          icon: 'approve',
          color: 'emerald',
          source: 'computed',
        })
      } else if (approval.status === 'REJECTED') {
        items.push({
          id: cid(),
          type: 'APPROVAL_REJECTED',
          title: `Onay Reddedildi (${approval.type === 'JOB_COMPLETION' ? 'İş Tamamlama' : approval.type})`,
          description: approval.notes || undefined,
          userName: approval.approver?.name || 'Yönetici',
          date: new Date(approval.updatedAt).toISOString(),
          icon: 'reject',
          color: 'red',
          source: 'computed',
        })
      } else {
        items.push({
          id: cid(),
          type: 'APPROVAL_REQUESTED',
          title: `Onay Talep Edildi (${approval.type === 'JOB_COMPLETION' ? 'İş Tamamlama' : approval.type})`,
          userName: approval.requester?.name || 'Çalışan',
          date: new Date(approval.createdAt).toISOString(),
          icon: 'approve',
          color: 'amber',
          source: 'computed',
        })
      }
    }
  }

  // 7. Customer acceptance/rejection
  if (job.acceptanceStatus === 'ACCEPTED' && job.acceptedAt) {
    items.push({
      id: cid(),
      type: 'CUSTOMER_APPROVED',
      title: 'Müşteri Tarafından Onaylandı',
      userName: job.acceptedBy?.name || job.customer?.user?.name || 'Müşteri',
      date: new Date(job.acceptedAt).toISOString(),
      icon: 'customer',
      color: 'emerald',
      source: 'computed',
    })
  } else if (job.acceptanceStatus === 'REJECTED') {
    items.push({
      id: cid(),
      type: 'CUSTOMER_REJECTED',
      title: 'Müşteri Tarafından Reddedildi',
      description: job.rejectionReason || undefined,
      userName: job.acceptedBy?.name || job.customer?.user?.name || 'Müşteri',
      date: new Date(job.acceptedAt || job.updatedAt).toISOString(),
      icon: 'customer',
      color: 'rose',
      source: 'computed',
    })
  }

  // 8. Job completed
  if (job.completedDate) {
    items.push({
      id: cid(),
      type: 'JOB_COMPLETED',
      title: 'İş Emri Tamamlandı',
      userName: job.jobLead?.name || job.creator?.name || 'Sistem',
      date: new Date(job.completedDate).toISOString(),
      icon: 'complete',
      color: 'green',
      source: 'computed',
    })
  }

  // 9. Job closed (status = ACCEPTED or CLOSED)
  if (job.status === 'ACCEPTED' || job.status === 'CLOSED') {
    items.push({
      id: cid(),
      type: 'JOB_CLOSED',
      title: 'İş Emri Kapatıldı',
      userName: job.creator?.name || 'Admin',
      date: new Date(job.updatedAt || job.completedDate || job.createdAt).toISOString(),
      icon: 'complete',
      color: 'gray',
      source: 'computed',
    })
  }

  return items
}

/**
 * Converts audit log entries (SystemLog) into ActivityItems.
 */
export function buildAuditHistory(auditLogs: any[]): ActivityItem[] {
  return auditLogs.map((log, i) => {
    const meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : (log.meta || {})
    const action = meta.action || log.message || ''

    const typeMap: Record<string, { type: ActivityType; icon: ActivityItem['icon']; color: ActivityItem['color'] }> = {
      'JOB_CREATE': { type: 'JOB_CREATED', icon: 'create', color: 'blue' },
      'JOB_STARTED': { type: 'JOB_STARTED', icon: 'start', color: 'emerald' },
      'JOB_COMPLETED': { type: 'JOB_COMPLETED', icon: 'complete', color: 'green' },
      'JOB_UPDATE': { type: 'JOB_UPDATED', icon: 'update', color: 'gray' },
      'JOB_STEP_COMPLETE': { type: 'STEP_COMPLETED', icon: 'complete', color: 'green' },
      'JOB_SUBSTEP_COMPLETE': { type: 'SUBSTEP_COMPLETED', icon: 'complete', color: 'green' },
      'JOB_PHOTO_UPLOAD': { type: 'PHOTO_UPLOADED', icon: 'photo', color: 'purple' },
      'JOB_STATUS_CHANGE': { type: 'JOB_UPDATED', icon: 'update', color: 'amber' },
      'APPROVAL_REQUEST': { type: 'APPROVAL_REQUESTED', icon: 'approve', color: 'amber' },
      'APPROVAL_APPROVE': { type: 'APPROVAL_APPROVED', icon: 'approve', color: 'emerald' },
      'APPROVAL_REJECT': { type: 'APPROVAL_REJECTED', icon: 'reject', color: 'red' },
      'TEAM_ASSIGNMENT': { type: 'TEAM_ASSIGNED', icon: 'team', color: 'cyan' },
      'COST_CREATE': { type: 'COST_ADDED', icon: 'cost', color: 'orange' },
      'COST_APPROVE': { type: 'COST_APPROVED', icon: 'approve', color: 'emerald' },
      'COST_REJECT': { type: 'COST_REJECTED', icon: 'reject', color: 'red' },
      'JOB_CUSTOMER_ACCEPT': { type: 'CUSTOMER_APPROVED', icon: 'customer', color: 'emerald' },
      'JOB_CUSTOMER_REJECT': { type: 'CUSTOMER_REJECTED', icon: 'customer', color: 'rose' },
    }

    const mapped = typeMap[action] || { type: 'JOB_UPDATED' as ActivityType, icon: 'update' as const, color: 'gray' as const }

    return {
      id: `audit-${log.id || i}`,
      type: mapped.type,
      title: log.message || action,
      description: meta.description || meta.resourceName || undefined,
      userName: meta.userName || log.user?.name || 'Sistem',
      date: new Date(log.createdAt).toISOString(),
      icon: mapped.icon,
      color: mapped.color,
      source: 'audit' as const,
      meta,
    }
  })
}

/**
 * Merges audit-based and computed histories.
 * Prefers audit entries when timestamps are close (within 2 min window) and types match.
 */
export function buildJobHistory(job: any, auditLogs: any[] = []): ActivityItem[] {
  const computed = buildComputedHistory(job)
  const audit = buildAuditHistory(auditLogs)

  if (audit.length === 0) {
    return computed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Merge: prefer audit entries, fill gaps with computed
  const TWO_MIN = 2 * 60 * 1000
  const usedComputedIds = new Set<string>()

  for (const auditItem of audit) {
    const auditTime = new Date(auditItem.date).getTime()
    // Find matching computed item (same type, within 2min window)
    const match = computed.find(c =>
      c.type === auditItem.type &&
      !usedComputedIds.has(c.id) &&
      Math.abs(new Date(c.date).getTime() - auditTime) < TWO_MIN
    )
    if (match) {
      usedComputedIds.add(match.id)
    }
  }

  // Keep audit items + unmatched computed items
  const unmatched = computed.filter(c => !usedComputedIds.has(c.id))
  const merged = [...audit, ...unmatched]

  return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
