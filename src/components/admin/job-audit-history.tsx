'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle2, XCircle, DollarSign, Clock, AlertCircle, FileText } from 'lucide-react'

interface JobAuditHistoryProps {
    logs: any[]
}

export function JobAuditHistory({ logs }: JobAuditHistoryProps) {
    const [filter, setFilter] = useState('ALL')

    const filteredLogs = useMemo(() => {
        if (filter === 'ALL') return logs
        return logs.filter(log => {
            if (filter === 'COSTS') return log.type.includes('COST')
            if (filter === 'APPROVALS') return log.type.includes('APPROVAL') || log.type.includes('CUSTOMER')
            if (filter === 'STATUS') return log.type.includes('JOB')
            return true
        })
    }, [logs, filter])

    const getIcon = (type: string) => {
        if (type.includes('COST')) return <DollarSign className="h-4 w-4 text-orange-500" />
        if (type.includes('APPROVAL') || type.includes('CUSTOMER_APPROVED')) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        if (type.includes('REJECT')) return <XCircle className="h-4 w-4 text-red-500" />
        return <FileText className="h-4 w-4 text-gray-500" />
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">İş Geçmişi</CardTitle>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tümü</SelectItem>
                        <SelectItem value="COSTS">Masraflar</SelectItem>
                        <SelectItem value="APPROVALS">Onaylar</SelectItem>
                        <SelectItem value="STATUS">Durumlar</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {filteredLogs.map((log: any) => (
                        <div key={log.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                            <div className="mt-0.5">{getIcon(log.type)}</div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{log.title}</p>
                                <p className="text-xs text-gray-500">{log.userName}</p>
                                <p className="text-[10px] text-gray-400 mt-1" suppressHydrationWarning>
                                    {format(new Date(log.date), 'd MMM yyyy, HH:mm', { locale: tr })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-4">Kayıt bulunamadı.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
