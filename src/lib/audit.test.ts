
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit, AuditAction } from './audit';
import { prisma } from './db';

vi.mock('./db', () => ({
    prisma: {
        systemLog: {
            create: vi.fn().mockResolvedValue({ id: '1' }),
        },
    },
}));

describe('logAudit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a system log with default platform "web"', async () => {
        const userId = 'user-1';
        const action = AuditAction.JOB_CREATE;
        const details = { jobId: 'job-1' };

        await logAudit(userId, action, details);

        expect(prisma.systemLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                level: 'AUDIT',
                message: expect.stringContaining('İş oluşturuldu'),
                userId: userId,
                platform: 'web',
                meta: details,
            }),
        });
    });

    it('should create a system log with provided platform', async () => {
        const userId = 'user-1';
        const action = AuditAction.JOB_CREATE;
        const details = { jobId: 'job-1' };
        const platform = 'mobile';

        await logAudit(userId, action, details, platform);

        expect(prisma.systemLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                platform: 'mobile',
            }),
        });
    });

    it('should prioritize platform in details if provided', async () => {
        const userId = 'user-1';
        const action = AuditAction.JOB_CREATE;
        const details = { jobId: 'job-1', platform: 'mobile' };

        await logAudit(userId, action, details, 'web');

        expect(prisma.systemLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                platform: 'mobile',
            }),
        });
    });

    it('should format new audit actions correctly', async () => {
        const userId = 'user-1';
        const details = { resourceName: 'Test' };
        
        const actions = [
            AuditAction.COST_CREATE,
            AuditAction.COST_APPROVE,
            AuditAction.COST_REJECT,
            AuditAction.JOB_CUSTOMER_ACCEPT,
            AuditAction.JOB_CUSTOMER_REJECT,
        ];

        for (const action of actions) {
            await logAudit(userId, action as any, details);
            expect(prisma.systemLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        message: expect.stringContaining(action)
                    })
                })
            );
        }
    });
});
