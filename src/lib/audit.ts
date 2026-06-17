
import { prisma } from './db';

/**
 * Extracts device information from Request headers
 */
export function getDeviceInfo(req: Request) {
    const ua = req.headers.get('user-agent') || 'Bilinmiyor';
    const device = ua.split(')')[0].split('(')[1] || ua;
    const platform = ua.toLowerCase().includes('mobile') ? 'mobile' : 'web';
    return { device, platform, userAgent: ua };
}
import { v4 as uuidv4 } from 'uuid';

export enum AuditAction {
    // Auth - No dedicated Auth model, but actions relate to Users
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',

    // User
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',

    // Job
    JOB_CREATE = 'JOB_CREATE',
    JOB_UPDATE = 'JOB_UPDATE',
    JOB_DELETE = 'JOB_DELETE',
    JOB_STATUS_CHANGE = 'JOB_STATUS_CHANGE',
    JOB_STARTED = 'JOB_STARTED',
    JOB_COMPLETED = 'JOB_COMPLETED',
    JOB_PHOTO_UPLOAD = 'JOB_PHOTO_UPLOAD',
    JOB_STEP_COMPLETE = 'JOB_STEP_COMPLETE',
    JOB_SUBSTEP_COMPLETE = 'JOB_SUBSTEP_COMPLETE',

    // Team
    TEAM_ASSIGNMENT = 'TEAM_ASSIGNMENT',
    TEAM_MEMBER_ADD = 'TEAM_MEMBER_ADD',
    TEAM_MEMBER_REMOVE = 'TEAM_MEMBER_REMOVE',

    // Approval
    APPROVAL_REQUEST = 'APPROVAL_REQUEST',
    APPROVAL_APPROVE = 'APPROVAL_APPROVE',
    APPROVAL_REJECT = 'APPROVAL_REJECT',

    // Cost
    COST_CREATE = 'COST_CREATE',
    COST_APPROVE = 'COST_APPROVE',
    COST_REJECT = 'COST_REJECT',

    // Customer Acceptance
    JOB_CUSTOMER_ACCEPT = 'JOB_CUSTOMER_ACCEPT',
    JOB_CUSTOMER_REJECT = 'JOB_CUSTOMER_REJECT',

    // System
    API_KEY_CREATE = 'API_KEY_CREATE',
    WEBHOOK_CREATE = 'WEBHOOK_CREATE'
}

export interface AuditDetails {
    resourceId?: string;
    resourceName?: string;
    userName?: string;
    device?: string;
    snapshot?: any;
    before?: Record<string, any>;
    after?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
}

/**
 * Formats an audit action into a human-readable message.
 */
function formatAuditMessage(action: AuditAction | string, details: AuditDetails): string {
    const resourceId = details.resourceId || details.jobId || details.userId || 'Bilinmiyor';
    const userName = details.userName || 'Bilinmiyor';
    const device = details.device ? `[${details.device}]` : '';
    const jobTitle = details.title || details.resourceName || '';

    const prefix = `${userName} ${device} :`.replace(/\s+/g, ' ').trim();
    
    switch (action) {
        case AuditAction.JOB_CREATE:
            return `${prefix} İş oluşturuldu: ${jobTitle} (#${details.jobNo || 'Yeni'})`.trim();

        case AuditAction.JOB_STARTED:
        case 'Job started':
            return `${prefix} İş başlatıldı: ${jobTitle} (ID: ${resourceId})`.trim();

        case AuditAction.JOB_COMPLETED:
        case 'Job completed':
            return `${prefix} İş tamamlandı: ${jobTitle} (ID: ${resourceId})`.trim();

        case AuditAction.JOB_PHOTO_UPLOAD:
            return `${prefix} Fotoğraf yüklendi: ${jobTitle} (ID: ${resourceId})`.trim();

        case AuditAction.JOB_STEP_COMPLETE:
            return `${prefix} Adım tamamlandı: ${jobTitle} (ID: ${resourceId})`.trim();

        case AuditAction.JOB_SUBSTEP_COMPLETE:
            return `${prefix} Alt görev tamamlandı: ${jobTitle} (ID: ${resourceId})`.trim();

        case AuditAction.JOB_UPDATE:
            return `${prefix} İş güncellendi: ${jobTitle || resourceId}`;

        case AuditAction.JOB_DELETE:
            return `${prefix} İş silindi: ${jobTitle || resourceId}`;

        case AuditAction.JOB_STATUS_CHANGE:
            return `${prefix} İş durumu değişti: ${jobTitle} (${details.before?.status} -> ${details.after?.status})`;

        case AuditAction.USER_CREATE:
            return `${prefix} Yeni kullanıcı oluşturuldu: ${details.email || details.name || resourceId}`;

        case AuditAction.COST_CREATE:
            return `${prefix} Masraf oluşturuldu`.trim();
        case AuditAction.COST_APPROVE:
            return `${prefix} Masraf onaylandı`.trim();
        case AuditAction.COST_REJECT:
            return `${prefix} Masraf reddedildi`.trim();
        case AuditAction.JOB_CUSTOMER_ACCEPT:
            return `${prefix} İş müşteri tarafından onaylandı`.trim();
        case AuditAction.JOB_CUSTOMER_REJECT:
            return `${prefix} İş müşteri tarafından reddedildi`.trim();

        default:
            return `${prefix} ${action}`.trim();
    }
}

/**
 * Logs a critical system action to the database.
 * Uses the existing SystemLog model with level="AUDIT".
 */
export async function logAudit(
    userId: string,
    action: AuditAction | string,
    details: AuditDetails,
    platform: string = 'web'
) {
    try {
        const message = formatAuditMessage(action, details);
        
        await prisma.systemLog.create({
            data: {
                level: 'AUDIT',
                message: message,
                userId: userId,
                meta: { ...details, action } as any, // Json in Prisma
                platform: details.platform || platform, 
                createdAt: new Date(),
            },
        });
    } catch (error) {
        // Fallback: don't crash the app if logging fails, but log to console
        console.error('[AuditService] Failed to create audit log:', error);
    }
}
