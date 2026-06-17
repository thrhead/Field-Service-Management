import { auth } from "@/lib/auth"
import { redirect } from "@/lib/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, User } from "lucide-react"
import { Link } from "@/lib/navigation"
import { getJob } from "@/lib/data/jobs"
import { JobDialog } from "@/components/admin/job-dialog"
import { DeleteJobButton } from "@/components/admin/delete-job-button"
import { EditIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ChatPanel } from "@/components/chat/ChatPanel"
import { JobDetailsClientWrapper } from "@/components/admin/job-details-client-wrapper"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

export const dynamicParams = true

export default async function AdminJobDetailsPage(props: {
    params: Promise<{ id: string }>
}) {
    const params = await props.params
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    const [job, workers, teams, customers, templates, auditLogs] = await Promise.all([
        getJob(params.id),
        prisma.user.findMany({
            where: { role: 'WORKER', isActive: true },
            select: { id: true, name: true }
        }),
        prisma.team.findMany({
            where: { isActive: true },
            include: { 
                lead: { select: { id: true, name: true } },
                members: { include: { user: { select: { id: true, name: true } } } }
            }
        }),
        prisma.customer.findMany({
            include: { user: { select: { name: true } } }
        }),
        prisma.jobTemplate.findMany({
            include: { steps: { include: { subSteps: true } } }
        }),
        prisma.systemLog.findMany({
            where: { 
                level: 'AUDIT'
            },
            orderBy: { createdAt: 'desc' }
        })
    ])

    // Map data for JobDialog
    const dialogCustomers = customers.map(c => ({
        id: c.id,
        company: c.company,
        user: { name: c.user.name || '' }
    }))

    const dialogTemplates = templates.map(t => ({
        id: t.id,
        name: t.name,
        steps: t.steps.map(s => ({
            title: s.title,
            description: '',
            subSteps: s.subSteps.map(ss => ({ title: ss.title }))
        }))
    }))

    if (!job) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">İş Bulunamadı</h1>
                <p className="text-gray-500 mt-2">Aradığınız iş mevcut değil veya silinmiş.</p>
                <Link href="/admin/jobs" className="text-blue-600 hover:underline mt-4 inline-block">
                    İş Listesine Dön
                </Link>
            </div>
        )
    }

    // Serialize pending approval to handle Date objects
    const rawPendingApproval = job.approvals[0]
    const pendingApproval = rawPendingApproval ? JSON.parse(JSON.stringify(rawPendingApproval)) : null
    
    // Add audit logs to job object
    const auditLogsForJob = auditLogs.filter(log => (log.meta as any)?.jobId === params.id)
    
    const jobWithLogs = {
        ...JSON.parse(JSON.stringify(job)),
        auditLogs: auditLogsForJob.map(log => ({
            id: log.id,
            title: log.message,
            userName: (log.meta as any)?.userName || 'Sistem',
            date: log.createdAt,
            type: (log.meta as any)?.action || 'SYSTEM'
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/jobs">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">İş Detayları</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-lg py-0 h-8 font-mono bg-orange-50 text-orange-700 border-orange-200">
                                    {job.jobNo || 'NO-CODE'}
                                </Badge>
                                <Badge variant="outline" className="text-sm py-0 h-8 font-mono bg-blue-50 text-blue-700 border-blue-200">
                                    ID: #{job.id.slice(-6).toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{format(new Date(job.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span>{job.creator?.name || 'Sistem'} tarafından oluşturuldu</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <JobDialog
                        job={JSON.parse(JSON.stringify(job))}
                        customers={dialogCustomers}
                        teams={teams}
                        templates={dialogTemplates}
                        trigger={
                            <Button variant="outline" className="gap-2">
                                <EditIcon className="h-4 w-4" />
                                Düzenle
                            </Button>
                        }
                    />
                    <DeleteJobButton
                        jobId={job.id}
                        jobTitle={job.title}
                        variant="destructive"
                        size="default"
                        showText={true}
                    />
                </div>
            </div>

            <JobDetailsClientWrapper
                job={jobWithLogs}
                workers={workers}
                teams={teams}
                pendingApproval={pendingApproval}
            />

            <Card>
                <CardHeader>
                    <CardTitle>İş Sohbeti</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChatPanel jobId={params.id} title={job.title} />
                </CardContent>
            </Card>
        </div>
    )
}
