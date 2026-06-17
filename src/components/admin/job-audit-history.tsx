'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle2, XCircle, DollarSign, Clock, AlertCircle, FileText, Upload, User, Play, Square, MessageSquare } from 'lucide-react'

interface JobAuditHistoryProps {
    logs: any[]
}

export function JobAuditHistory({ logs }: JobAuditHistoryProps) {
    const [filter, setFilter] = useState('ALL')

    const parseLogEntry = (log: any) => {
        const meta = log.meta || {};
        const action = log.type;
        const userName = meta.userName || 'Sistem';
        const dateStr = format(new Date(log.date), 'HH:mm', { locale: tr });

        switch (action) {
            case 'COST_CREATE':
                return {
                    icon: <DollarSign className="h-4 w-4 text-orange-600" />,
                    title: `${userName}, ${meta.resourceName} için ${meta.amount || ''} ${meta.currency || 'TRY'} masraf ekledi.`,
                };
            case 'COST_APPROVE':
                return {
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                    title: `${userName}, masrafı onayladı.`,
                };
            case 'JOB_CUSTOMER_ACCEPT':
                return {
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                    title: `Müşteri (${userName}) işi onayladı.`,
                };
            case 'JOB_STARTED':
                return {
                    icon: <Play className="h-4 w-4 text-blue-600" />,
                    title: `İş ${userName} tarafından saat ${dateStr}'de başlatıldı.`,
                };
            case 'JOB_COMPLETED':
                return {
                    icon: <Square className="h-4 w-4 text-indigo-600" />,
                    title: `İş ${userName} tarafından tamamlandı.`,
                };
            case 'JOB_PHOTO_UPLOAD':
                return {
                    icon: <Upload className="h-4 w-4 text-purple-600" />,
                    title: `${userName} bir fotoğraf ekledi.`,
                };
            default:
                return {
                    icon: <FileText className="h-4 w-4 text-gray-500" />,
                    title: log.title || 'Bir işlem yapıldı.',
                };
        }
    };

    const filteredLogs = useMemo(() => {
        if (filter === 'ALL') return logs
        return logs.filter(log => {
            if (filter === 'COSTS') return log.type.includes('COST')
            if (filter === 'APPROVALS') return log.type.includes('APPROVAL') || log.type.includes('CUSTOMER')
            if (filter === 'STATUS') return log.type.includes('JOB')
            return true
        })
    }, [logs, filter])

    return (
        <Card className="h-full flex flex-col border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-gray-700">İş Geçmişi Akışı</CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Filtre" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tümü</SelectItem>
                        <SelectItem value="COSTS">Masraflar</SelectItem>
                        <SelectItem value="APPROVALS">Onaylar</SelectItem>
                        <SelectItem value="STATUS">İş Durumu</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="divide-y divide-gray-100">
                    {filteredLogs.map((log: any) => {
                        const activity = parseLogEntry(log);
                        return (
                            <div key={log.id} className="flex gap-3 p-4 hover:bg-gray-50 transition-colors">
                                <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full">{activity.icon}</div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800 leading-snug">{activity.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-1" suppressHydrationWarning>
                                        {format(new Date(log.date), 'd MMM yyyy, HH:mm', { locale: tr })}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    {filteredLogs.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-8 italic">Henüz bir hareket bulunmuyor.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
