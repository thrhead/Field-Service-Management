'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MapPin, Save, UserCog } from 'lucide-react'
import { PDFDownloadButton } from '@/components/pdf-download-button'
import { ExcelDownloadButton } from '@/components/excel-download-button'
import { ProformaDownloadButton } from '@/components/proforma-download-button'
import { JobSummaryMetrics } from '@/components/job-detail/JobSummaryMetrics'
import { ApprovalTimeline } from '@/components/job-detail/ApprovalTimeline'

// Dynamic imports to avoid SSR issues and React hydration errors
const JobLocationMap = dynamic(
    () => import('@/components/map/job-location-map').then(mod => mod.JobLocationMap),
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" /> }
)

const ProgressCharts = dynamic(
    () => import('@/components/charts/progress-charts').then(mod => mod.ProgressCharts),
    { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" /> }
)

const JobApprovalsView = dynamic(
    () => import('@/components/admin/job-approvals-view').then(mod => mod.JobApprovalsView),
    { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse" /> }
)

const JobEditView = dynamic(
    () => import('@/components/admin/job-edit-view').then(mod => mod.JobEditView),
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" /> }
)

const JobTimeline = dynamic(
    () => import('@/components/charts/job-timeline').then(mod => mod.JobTimeline),
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" /> }
)

const Assembly3DViewer = dynamic(
    () => import('@/components/3d/assembly-3d-viewer').then(mod => mod.Assembly3DViewer),
    { ssr: false, loading: () => <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"><span className="text-gray-400 text-sm">3D Model yükleniyor...</span></div> }
)

const JobTaskTree = dynamic(
    () => import('@/components/charts/job-task-tree').then(mod => mod.JobTaskTree),
    { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" /> }
)

interface AdminJobDetailsTabsProps {
    job: any
    workers: { id: string; name: string | null }[]
    teams: { id: string; name: string }[]
}

export function AdminJobDetailsTabs({ job, workers, teams }: AdminJobDetailsTabsProps) {
    const [latitude, setLatitude] = useState(job.latitude?.toString() || '')
    const [longitude, setLongitude] = useState(job.longitude?.toString() || '')
    const [saving, setSaving] = useState(false)

    const handleSaveCoordinates = async () => {
        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)

        if (isNaN(lat) || isNaN(lng)) {
            toast.warning('Lütfen geçerli koordinatlar girin')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/admin/jobs/${job.id}/coordinates`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            })

            if (res.ok) {
                toast.success('Koordinatlar kaydedildi! Sayfa yenileniyor...')
                window.location.reload()
            } else {
                toast.error('Koordinatlar kaydedilemedi')
            }
        } catch (error) {
            console.error(error)
            toast.error('Bir hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    const totalSteps = job.steps.length
    const completedSteps = job.steps.filter((s: any) => s.isCompleted).length
    const blockedSteps = job.steps.filter((s: any) => s.blockedAt).length

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">İş Detayları</h2>
                <div className="flex gap-2">
                    <ProformaDownloadButton job={job} />
                    <ExcelDownloadButton type="job" jobId={job.id} />
                    <PDFDownloadButton jobId={job.id} />
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-[repeat(auto-fit,minmax(80px,1fr))] md:grid-cols-8 overflow-x-auto h-auto min-h-10">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="timeline">Zaman Çizelgesi</TabsTrigger>
                    <TabsTrigger value="task-tree">Görev Ağacı</TabsTrigger>
                    <TabsTrigger value="analytics">Grafikler</TabsTrigger>
                    <TabsTrigger value="3d-assembly" className="flex items-center gap-1">3D Montaj</TabsTrigger>
                    <TabsTrigger value="map">Harita</TabsTrigger>
                    <TabsTrigger value="details">Detaylar</TabsTrigger>
                    <TabsTrigger value="approvals">Onaylar</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <JobSummaryMetrics metrics={job.metrics || { totalTime: '0dk', status: 'Bekliyor' }} />
                    <JobEditView job={job} workers={workers} teams={teams} />
                </TabsContent>

                <TabsContent value="timeline" className="space-y-6">
                    <JobTimeline
                        steps={job.steps}
                        scheduledDate={job.scheduledDate}
                        completedDate={job.completedDate}
                        jobId={job.id}
                    />
                </TabsContent>

                <TabsContent value="task-tree" className="space-y-6">
                    <JobTaskTree job={job} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <ProgressCharts
                        totalSteps={totalSteps}
                        completedSteps={completedSteps}
                        blockedSteps={blockedSteps}
                        steps={job.steps}
                    />
                </TabsContent>

                <TabsContent value="3d-assembly" className="space-y-6">
                    <Assembly3DViewer steps={job.steps} jobTitle={job.title} />
                </TabsContent>

                <TabsContent value="map" className="space-y-6">
                    {job.latitude && job.longitude ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    İş Konumu
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <JobLocationMap
                                    latitude={job.latitude}
                                    longitude={job.longitude}
                                    jobTitle={job.title}
                                    location={job.location || undefined}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Konum Bilgisi Ekle
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Bu iş için henüz konum bilgisi eklenmemiş. Aşağıdan koordinatları girebilirsiniz.
                                </p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Enlem (Latitude)</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            placeholder="Örn: 41.0082"
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Boylam (Longitude)</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            placeholder="Örn: 28.9784"
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button onClick={handleSaveCoordinates} disabled={saving}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Kaydediliyor...' : 'Koordinatları Kaydet'}
                                </Button>

                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                    <p className="font-medium mb-1">💡 İpucu:</p>
                                    <p>Google Maps&apos;ten koordinat almak için: Konuma sağ tıklayın → İlk satırdaki sayılara tıklayın</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <JobSummaryMetrics metrics={job.metrics || { totalTime: '0dk', status: 'Bekliyor' }} />
                        <Card>
                           <CardHeader><CardTitle className="text-base">Onay Geçmişi</CardTitle></CardHeader>
                           <CardContent><ApprovalTimeline history={job.approvalHistory || []} /></CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">İş Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kayıt ID:</span>
                                    <span className="font-mono font-bold text-gray-700">#{job.id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Proje No:</span>
                                    <span className="font-bold text-orange-600">{job.jobNo || '-'}</span>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <span className="text-gray-500 block">Açıklama:</span>
                                    <div className="p-3 bg-gray-50 rounded-md border text-gray-700 whitespace-pre-wrap">
                                        {job.description || 'Açıklama yok'}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Durum:</span>
                                    <span className="font-medium">{job.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">İş Lideri:</span>
                                    <span className="font-bold text-amber-600">{job.jobLead?.name || 'Atanmamış'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Başlangıç:</span>
                                    <span className="font-medium" suppressHydrationWarning>
                                        {job.startedAt ? new Date(job.startedAt).toLocaleString('tr-TR') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Bitiş:</span>
                                    <span className="font-medium" suppressHydrationWarning>
                                        {job.completedDate ? new Date(job.completedDate).toLocaleString('tr-TR') : '-'}
                                    </span>
                                </div>
                                <div className="space-y-3 py-2 border-t mt-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Görevlendirme</span>
                                    {job.assignments && job.assignments.length > 0 ? (
                                        job.assignments.map((a: any) => (
                                            <div key={a.id} className="space-y-3">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">Takım Lideri:</span>
                                                    <span className="font-bold text-amber-600 flex items-center gap-1">
                                                        <UserCog className="h-3 w-3" />
                                                        {a.team?.lead?.name || 'Atanmamış'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-500 text-xs">Çalışanlar:</span>
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                        {a.team?.members?.filter((m: any) => m.user.id !== a.team.lead?.id).length > 0 ? (
                                                            a.team.members
                                                                .filter((m: any) => m.user.id !== a.team.lead?.id)
                                                                .map((m: any, idx: number) => (
                                                                    <Badge key={idx} variant="outline" className="text-[10px] py-0 h-5 bg-white">
                                                                        {m.user?.name || 'İsimsiz'}
                                                                    </Badge>
                                                                ))
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 italic">Diğer çalışan yok</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="font-medium text-xs text-gray-400 italic">Atanmamış</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Öncelik:</span>
                                    <span className="font-medium">{job.priority}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Toplam Adım:</span>
                                    <span className="font-medium">{totalSteps}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tamamlanan:</span>
                                    <span className="font-medium text-green-600">{completedSteps}</span>
                                </div>
                                {job.status === 'IN_PROGRESS' && job.startedAt && completedSteps > 0 && totalSteps > 0 && (
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Tahmini Bitiş:</span>
                                            <span className="font-bold text-blue-600" suppressHydrationWarning>
                                                {(() => {
                                                    try {
                                                        const start = new Date(job.startedAt).getTime()
                                                        const now = new Date().getTime()
                                                        const elapsed = now - start
                                                        const progress = completedSteps / totalSteps

                                                        if (progress <= 0 || isNaN(progress)) return '-'

                                                        const totalEst = elapsed / progress
                                                        if (!isFinite(totalEst)) return '-'

                                                        const finishDate = new Date(start + totalEst)
                                                        if (isNaN(finishDate.getTime())) return '-'

                                                        return finishDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                                                    } catch (e) {
                                                        return '-'
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full transition-all duration-500"
                                                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Bloklanan:</span>
                                    <span className="font-medium text-red-600">{blockedSteps}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Oluşturan:</span>
                                        <span className="font-medium">{job.creator?.name || 'Sistem'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Oluşturulma:</span>
                                        <span className="font-medium" suppressHydrationWarning>
                                            {job.createdAt ? new Date(job.createdAt).toLocaleString('tr-TR') : '-'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Müşteri Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Şirket:</span>
                                    <span className="font-medium">{job.customer?.company || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">İsim:</span>
                                    <span className="font-medium">{job.customer?.user?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email:</span>
                                    <span className="font-medium">{job.customer?.user?.email || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Telefon:</span>
                                    <span className="font-medium">{job.customer?.user?.phone || '-'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {job.signatureUrl && (
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base">Müşteri İmzası</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center">
                                    <div className="border rounded-lg p-2 bg-white max-w-md w-full relative min-h-[200px]">
                                        <Image
                                            src={job.signatureUrl}
                                            alt="Customer Signature"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="mt-4 flex flex-col items-center gap-2">
                                        <p className="text-xs text-gray-500" suppressHydrationWarning>
                                            İmza Tarihi: {job.completedDate ? new Date(job.completedDate).toLocaleString('tr-TR') : '-'}
                                        </p>
                                        {(job.signatureLatitude && job.signatureLongitude) && (
                                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                <span className="font-medium">GPS:</span>
                                                <span>{job.signatureLatitude.toFixed(6)}, {job.signatureLongitude.toFixed(6)}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="approvals" className="space-y-6">
                    <JobApprovalsView job={job} />
                </TabsContent>
            </Tabs >
        </div >
    )
}
