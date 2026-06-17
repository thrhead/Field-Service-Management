'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle2, XCircle, DollarSign, Clock, AlertCircle, FileText, Upload, User, Play, Square, MessageSquare, Image as ImageIcon, MapPin } from 'lucide-react'

interface JobAuditHistoryProps {
    logs: any[]
}

export function JobAuditHistory({ logs }: JobAuditHistoryProps) {
    const [filter, setFilter] = useState('ALL')

    const parseLogEntry = (log: any) => {
        const meta = log.meta || {};
        const action = log.type || meta.action || 'SYSTEM';
        const userName = meta.userName || 'Sistem';
        const dateStr = format(new Date(log.date), 'HH:mm', { locale: tr });

        switch (action) {
            case 'COST_CREATE':
                return {
                    icon: <DollarSign className="h-4 w-4 text-orange-600" />,
                    title: `${userName}, "${meta.resourceName || 'Masraf'}" için ${meta.amount || ''} ${meta.currency || 'TRY'} masraf ekledi.`,
                    color: 'bg-orange-50'
                };
            case 'COST_APPROVE':
                return {
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                    title: `${userName}, masrafı onayladı.`,
                    color: 'bg-emerald-50'
                };
            case 'COST_REJECT':
                return {
                    icon: <XCircle className="h-4 w-4 text-red-600" />,
                    title: `${userName}, masrafı reddetti. (Sebep: ${meta.rejectionReason || 'Belirtilmedi'})`,
                    color: 'bg-red-50'
                };
            case 'JOB_CUSTOMER_ACCEPT':
                return {
                    icon: <User className="h-4 w-4 text-blue-600" />,
                    title: `Müşteri (${userName}) işi onayladı.`,
                    color: 'bg-blue-50'
                };
            case 'JOB_CUSTOMER_REJECT':
                return {
                    icon: <XCircle className="h-4 w-4 text-red-600" />,
                    title: `Müşteri (${userName}) işi reddetti. (Sebep: ${meta.rejectionReason || 'Belirtilmedi'})`,
                    color: 'bg-red-50'
                };
            case 'JOB_STARTED':
                return {
                    icon: <Play className="h-4 w-4 text-blue-600" />,
                    title: `İş ${userName} tarafından saat ${dateStr}'de başlatıldı.`,
                    color: 'bg-blue-50'
                };
            case 'JOB_COMPLETED':
                return {
                    icon: <Square className="h-4 w-4 text-indigo-600" />,
                    title: `İş ${userName} tarafından tamamlandı.`,
                    color: 'bg-indigo-50'
                };
            case 'JOB_PHOTO_UPLOAD':
                return {
                    icon: <ImageIcon className="h-4 w-4 text-purple-600" />,
                    title: `${userName} iş emrine yeni bir fotoğraf ekledi.`,
                    color: 'bg-purple-50'
                };
            case 'JOB_STATUS_CHANGE':
                return {
                    icon: <Clock className="h-4 w-4 text-amber-600" />,
                    title: `İş durumu değişti: ${meta.before?.status || '?'} -> ${meta.after?.status || '?'} (${userName})`,
                    color: 'bg-amber-50'
                };
            case 'JOB_UPDATE':
                return {
                    icon: <FileText className="h-4 w-4 text-gray-600" />,
                    title: `${userName} iş bilgilerini güncelledi.`,
                    color: 'bg-gray-50'
                };
            default:
                return {
                    icon: <FileText className="h-4 w-4 text-gray-500" />,
                    title: log.title || 'Sistem işlemi gerçekleştirildi.',
                    color: 'bg-gray-50'
                };
        }
    };

    const filteredLogs = useMemo(() => {
        if (filter === 'ALL') return logs
        return logs.filter(log => {
            const action = log.type || log.meta?.action || '';
            if (filter === 'COSTS') return action.includes('COST')
            if (filter === 'APPROVALS') return action.includes('APPROVAL') || action.includes('CUSTOMER')
            if (filter === 'STATUS') return action.includes('JOB_STATUS') || action.includes('JOB_STARTED') || action.includes('JOB_COMPLETED')
            return true
        })
    }, [logs, filter])

    return (
        <Card className="h-full flex flex-col border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gray-50/80 border-b">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    İş Aktivite Akışı
                </CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                        <SelectValue placeholder="Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tümü</SelectItem>
                        <SelectItem value="COSTS">Masraflar</SelectItem>
                        <SelectItem value="APPROVALS">Onaylar</SelectItem>
                        <SelectItem value="STATUS">İş Süreci</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-100 ml-[-1px]" />
                    
                    <div className="divide-y divide-gray-50">
                        {filteredLogs.map((log: any) => {
                            const activity = parseLogEntry(log);
                            return (
                                <div key={log.id} className="relative flex gap-4 p-4 hover:bg-gray-50/80 transition-all group">
                                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${activity.color} border-2 border-white shadow-sm shrink-0`}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                            {activity.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded" suppressHydrationWarning>
                                                {format(new Date(log.date), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {filteredLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500 italic font-medium">Bu kriterlere uygun hareket bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
