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
const JobAuditHistory = dynamic(
    () => import('@/components/admin/job-audit-history').then(mod => mod.JobAuditHistory),
    { ssr: false, loading: () => <div className="h-full bg-gray-100 rounded-lg animate-pulse" /> }
)

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

    const getMetrics = () => {
        if (job.metrics) return job.metrics;
        
        const statusMap: Record<string, string> = {
            'PENDING': 'Bekliyor',
            'IN_PROGRESS': 'Devam Ediyor',
            'COMPLETED': 'Tamamlandı',
            'PENDING_APPROVAL': 'Onay Bekliyor',
        };
        const status = statusMap[job.status] || job.status || 'Bekliyor';

        let totalTime = '0dk';
        if (job.startedAt && job.completedDate) {
            const start = new Date(job.startedAt).getTime();
            const end = new Date(job.completedDate).getTime();
            const diffInMinutes = Math.floor((end - start) / (1000 * 60));
            totalTime = `${diffInMinutes}dk`;
        } else if (job.startedAt) {
            const start = new Date(job.startedAt).getTime();
            const now = new Date().getTime();
            const diffInMinutes = Math.floor((now - start) / (1000 * 60));
            totalTime = `${diffInMinutes}dk`;
        }
        
        return { totalTime, status };
    };

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
                    <JobSummaryMetrics metrics={getMetrics()} />
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
                        {/* Sol Kolon: İş Bilgileri + Müşteri */}
                        <div className="space-y-6">
                            <JobSummaryMetrics metrics={getMetrics()} />
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">İş ve Müşteri Bilgileri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-sm">
                                    {/* İş Bilgileri */}
                                    <div className="space-y-2 border-b pb-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kayıt ID:</span>
                                            <span className="font-mono font-bold text-gray-700">#{job.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        {/* ... diğer iş bilgileri ... */}
                                    </div>

                                    {/* Müşteri Bilgileri */}
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Müşteri Bilgileri</h4>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Şirket:</span>
                                            <span className="font-medium">{job.customer?.company || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">İsim:</span>
                                            <span className="font-medium">{job.customer?.user?.name || '-'}</span>
                                        </div>
                                        {/* ... diğer müşteri bilgileri ... */}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sağ Kolon: İş Geçmişi */}
                        <div className="h-[600px]">
                            <JobAuditHistory logs={job.auditLogs || []} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="approvals" className="space-y-6">
                    <JobApprovalsView job={job} />
                </TabsContent>
            </Tabs >
        </div >
    )
}
