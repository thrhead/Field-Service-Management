import { auth } from '@/lib/auth'
import { redirect } from '@/lib/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatsCard } from '@/components/customer/stats-card'
import { JobStatusChart } from '@/components/charts/job-status-chart'
import {
  BriefcaseIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DownloadIcon,
  TrendingUpIcon,
  ActivityIcon
} from 'lucide-react'
import { Link } from '@/lib/navigation'
// Keep next/link for internal links inside server components for now or switch to @/lib/navigation Link
import { getTranslations } from 'next-intl/server'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

async function getCustomerDashboardData(userId: string) {
  const { prisma } = await import('@/lib/db')

  const customer = await prisma.customer.findUnique({
    where: { userId }
  })

  if (!customer) {
    return { 
      jobs: [], 
      stats: { totalJobs: 0, pendingJobs: 0, inProgressJobs: 0, completedJobs: 0, completionRate: 0 },
      statusDistribution: [],
      recentUpdates: []
    }
  }

  const jobs = await prisma.job.findMany({
    where: { customerId: customer.id },
    include: {
      steps: {
        select: {
          title: true,
          isCompleted: true,
          completedAt: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  })

  const allJobs = await prisma.job.findMany({
    where: { customerId: customer.id },
    select: { status: true }
  })

  const stats = {
    totalJobs: allJobs.length,
    pendingJobs: allJobs.filter(j => j.status === 'PENDING').length,
    inProgressJobs: allJobs.filter(j => j.status === 'IN_PROGRESS').length,
    completedJobs: allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'ACCEPTED').length,
    completionRate: allJobs.length > 0
      ? Math.round((allJobs.filter(j => j.status === 'COMPLETED' || j.status === 'ACCEPTED').length / allJobs.length) * 100)
      : 0
  }

  const statusDistribution = [
    { status: 'PENDING', count: stats.pendingJobs },
    { status: 'IN_PROGRESS', count: stats.inProgressJobs },
    { status: 'COMPLETED', count: allJobs.filter(j => j.status === 'COMPLETED').length },
    { status: 'ACCEPTED', count: allJobs.filter(j => j.status === 'ACCEPTED').length }
  ].filter(item => item.count > 0)

  const jobsWithProgress = jobs.map(job => {
    const totalSteps = job.steps.length
    const completedSteps = job.steps.filter(s => s.isCompleted).length
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    return { ...job, progress }
  })

  // Get recent updates from steps
  const recentUpdates = jobs.flatMap(job => 
    job.steps
      .filter(step => step.isCompleted && step.completedAt)
      .map(step => ({
        jobTitle: job.title,
        jobId: job.id,
        stepTitle: step.title,
        completedAt: step.completedAt!
      }))
  ).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 5)

  return { jobs: jobsWithProgress, stats, statusDistribution, recentUpdates }
}

export default async function CustomerDashboard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  const session = await auth()
  const t = await getTranslations('CustomerDashboard')

  if (!session || session.user.role !== 'CUSTOMER') {
    redirect('/login')
  }

  const { jobs, stats, statusDistribution, recentUpdates } = await getCustomerDashboardData(session?.user?.id || '')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title={t('stats.totalJobs')}
          value={stats.totalJobs}
          icon={BriefcaseIcon}
          iconColor="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Bekleyen"
          value={stats.pendingJobs}
          icon={AlertCircleIcon}
          iconColor="text-gray-600"
          bgColor="bg-gray-100"
        />
        <StatsCard
          title="Devam Eden"
          value={stats.inProgressJobs}
          icon={ClockIcon}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Tamamlanan"
          value={stats.completedJobs}
          icon={CheckCircle2Icon}
          iconColor="text-green-600"
          bgColor="bg-green-100"
        />
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hidden lg:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Başarı Oranı</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900">%{stats.completionRate}</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Job Lists and Distribution */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Status Chart */}
          {statusDistribution && statusDistribution.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">İş Durumu Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <JobStatusChart data={statusDistribution} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Jobs */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Son İşler</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <Link href="/customer/jobs"><span>Tümünü Gör</span></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                   <p className="text-gray-500">{t('recentJobs.noJobs')}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/customer/jobs/${job.id}`}
                      className="group block p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{job.title}</h4>
                          <Badge variant="secondary" className="shrink-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                            {job.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                            <span>{t('recentJobs.progress')}</span>
                            <span>%{job.progress}</span>
                          </div>
                          <Progress value={job.progress} className="h-2 bg-gray-100" />
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 font-medium">{job.jobNo}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-bold text-blue-600 p-0 hover:bg-transparent"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={`/api/v1/jobs/${job.id}/report`} download onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                <DownloadIcon className="w-3.5 h-3.5 mr-1" />
                                RAPOR İNDİR (PDF)
                              </div>
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Updates and Activity */}
        <div className="space-y-8">
           {/* Success Gauge for Mobile/Small Screens (if hidden in grid) */}
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg lg:hidden">
              <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">Başarı Oranı</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">%{stats.completionRate}</span>
                <span className="text-indigo-200 text-xs font-medium">tamamlanan işler</span>
              </div>
              <div className="mt-6 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                 <div className="bg-white h-full rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
              </div>
           </div>

           {/* Recent Updates Feed */}
           <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-gray-500" />
                  Son Güncellemeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentUpdates.length > 0 ? (
                    recentUpdates.map((update, i) => (
                      <div key={`${update.jobId}-${i}`} className="relative pl-6 pb-6 last:pb-0">
                         {i < recentUpdates.length - 1 && (
                           <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-gray-100"></div>
                         )}
                         <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm"></div>
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">{update.stepTitle}</p>
                            <p className="text-xs text-blue-600 mt-0.5 font-medium truncate">{update.jobTitle}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                               <ClockIcon className="w-3 h-3" />
                               {formatDistanceToNow(new Date(update.completedAt), { addSuffix: true, locale: locale === 'tr' ? tr : enUS })}
                            </p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Henüz bir güncelleme yok.</p>
                  )}
                </div>
              </CardContent>
           </Card>

           {/* Customer Support/Quick Info Card */}
           <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
              <h3 className="font-bold text-blue-900 mb-2">Desteğe mi ihtiyacınız var?</h3>
              <p className="text-sm text-blue-700/80 mb-4">İşlerinizle ilgili detaylı bilgi almak veya revize talepleriniz için müşteri temsilcinizle iletişime geçebilirsiniz.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md border-none py-6">
                Müşteri Temsilcisini Ara
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}
