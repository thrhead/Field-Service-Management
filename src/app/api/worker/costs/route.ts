import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-helper'
import { z } from 'zod'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { sendNotificationToUsers } from '@/lib/notification-helper'
import { logAudit, AuditAction } from '@/lib/audit'

const createCostSchema = z.object({
    jobId: z.string().min(1),
    amount: z.number().min(0),
    currency: z.string().default('TRY'),
    category: z.string().min(1),
    description: z.string().optional().default(''),
    receiptUrl: z.string().optional(),
    date: z.string().optional().transform(val => (val ? new Date(val) : new Date()))
})

export async function POST(req: Request) {
    try {
        const session = await verifyAuth(req)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let data: any = {}
        let file: File | null = null

        const contentType = req.headers.get('content-type') || ''

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            file = formData.get('receipt') as File

            data = {
                jobId: formData.get('jobId'),
                amount: parseFloat(formData.get('amount') as string),
                currency: formData.get('currency') || 'TRY',
                category: formData.get('category'),
                description: formData.get('description') || '',
                date: formData.get('date') ? new Date(formData.get('date') as string) : new Date()
            }
        } else {
            const body = await req.json()
            data = createCostSchema.parse(body)
        }

        // Verify job exists
        const job = await prisma.job.findUnique({
            where: { id: data.jobId },
            include: {
                creator: true, assignments: { include: { team: { include: { members: true } } } }
            }
        })

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        // Check access
        if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
            const hasAccess = job.assignments.some(
                a => a.workerId === session.user.id ||
                (a.team && a.team.members?.some((m: any) => m.userId === session.user.id))
            )
            if (!hasAccess) {
                return NextResponse.json({ error: 'Forbidden: You are not assigned to this job' }, { status: 403 })
            }
        }


        let receiptUrl = data.receiptUrl

        // Handle file upload if present
        if (file && file.size > 0) {
            try {
                const uploadResult: any = await uploadToCloudinary(file, `costs/${data.jobId}`)
                receiptUrl = uploadResult.secure_url
            } catch (err) {
                console.error('Cloudinary upload error:', err)
                return NextResponse.json({ error: 'Failed to upload receipt image' }, { status: 500 })
            }
        }

        // Create cost record
        const cost = await prisma.costTracking.create({
            data: {
                jobId: data.jobId,
                amount: data.amount,
                currency: data.currency,
                category: data.category,
                description: data.description,
                receiptUrl: receiptUrl,
                date: data.date,
                createdById: session.user.id,
                status: 'PENDING'
            },
            include: {
                createdBy: true
            }
        });

        // Audit Logging
        try {
            await logAudit(session.user.id, AuditAction.COST_CREATE, {
                jobId: data.jobId,
                resourceId: cost.id,
                resourceName: cost.description || data.category || 'Masraf',
                title: job.title,
                userName: session.user.name || 'Çalışan',
                amount: cost.amount,
                currency: cost.currency
            })
        } catch (auditErr) {
            console.error('[Cost Logging] Failed to write audit log:', auditErr);
        }

        // Run post-processing synchronously to ensure it completes in serverless environments
        try {
            const notificationMessage = `${session.user.name || session.user.email} - ${data.amount} ${data.currency} (${data.category})`

            // Collect all unique recipient IDs
            const admins = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'MANAGER', 'TEAM_LEAD'] },
                    isActive: true
                },
                select: { id: true }
            })

            const recipientIds = new Set(admins.map(a => a.id))
            
            // Add job creator if they are not the submitter
            if (job.creator?.id && job.creator.id !== session.user.id) {
                recipientIds.add(job.creator.id)
            }

            // Send notifications in one go
            if (recipientIds.size > 0) {
                await sendNotificationToUsers(
                    Array.from(recipientIds),
                    'Yeni Masraf Eklendi',
                    notificationMessage,
                    'INFO',
                    `/admin/costs`
                )
            }
        } catch (asyncErr) {
            console.error('[Cost Creation] Post-processing error:', asyncErr);
        }

        return NextResponse.json(cost, { status: 201 })
    } catch (error) {
        console.error('Create cost error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await verifyAuth(req)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const costs = await prisma.costTracking.findMany({
            where: {
                createdById: session.user.id
            },
            include: {
                job: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json(costs)
    } catch (error) {
        console.error('Fetch costs error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
