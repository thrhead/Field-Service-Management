'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FilterIcon, Search, X, CalendarIcon } from 'lucide-react'
import { tr } from 'date-fns/locale'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { DateRange } from "react-day-picker"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"

interface AdvancedFilterProps {
    teams: { id: string; name: string }[]
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Bekleyen' },
    { value: 'IN_PROGRESS', label: 'Devam Eden' },
    { value: 'COMPLETED', label: 'Tamamlanan' },
    { value: 'CANCELLED', label: 'İptal' },
    { value: 'ACCEPTED', label: 'Kabul Edilen' },
]

export function AdvancedFilter({ teams }: AdvancedFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [status, setStatus] = useState<string[]>([])
    const [selectedTeams, setTeams] = useState<string[]>([])
    const [jobNo, setJobNo] = useState('')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [isOpen, setIsOpen] = useState(false)

    // Initialize state from URL params
    useEffect(() => {
        const statusParam = searchParams.get('status')
        if (statusParam) setStatus(statusParam.split(','))
        
        const teamsParam = searchParams.get('teams')
        if (teamsParam) setTeams(teamsParam.split(','))

        const jobNoParam = searchParams.get('jobNo')
        if (jobNoParam) setJobNo(jobNoParam)

        const from = searchParams.get('from')
        const to = searchParams.get('to')
        if (from) {
            setDateRange({
                from: new Date(from),
                to: to ? new Date(to) : undefined
            })
        }
    }, [searchParams])

    const handleStatusChange = (value: string) => {
        setStatus((prev) => 
            prev.includes(value) 
                ? prev.filter((s) => s !== value) 
                : [...prev, value]
        )
    }

    const handleTeamChange = (value: string) => {
        setTeams((prev) => 
            prev.includes(value) 
                ? prev.filter((t) => t !== value) 
                : [...prev, value]
        )
    }

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        
        if (status.length > 0) params.set('status', status.join(','))
        else params.delete('status')

        if (selectedTeams.length > 0) params.set('teams', selectedTeams.join(','))
        else params.delete('teams')

        if (jobNo) params.set('jobNo', jobNo)
        else params.delete('jobNo')

        if (dateRange?.from) params.set('from', dateRange.from.toISOString())
        else params.delete('from')

        if (dateRange?.to) params.set('to', dateRange.to.toISOString())
        else params.delete('to')

        params.delete('page')
        router.push(`?${params.toString()}`)
        setIsOpen(false)
    }

    const clearFilters = () => {
        setStatus([])
        setTeams([])
        setJobNo('')
        setDateRange(undefined)
        
        const params = new URLSearchParams(searchParams.toString())
        params.delete('status')
        params.delete('teams')
        params.delete('jobNo')
        params.delete('from')
        params.delete('to')
        params.delete('page')
        
        router.push(`?${params.toString()}`)
        setIsOpen(false)
    }

    const activeFilterCount = (dateRange?.from ? 1 : 0) + status.length + selectedTeams.length + (jobNo ? 1 : 0)

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 h-10 shadow-sm border-slate-200">
                    <FilterIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtrele</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center bg-primary/10 text-primary border-none">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle>Gelişmiş Filtreleme</SheetTitle>
                    <SheetDescription>
                        İş listesini kriterlere göre daraltın.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Job No / ID Search */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">İş No / ID</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Örn: TR-2024-0001" 
                                className="pl-9 h-11" 
                                value={jobNo}
                                onChange={(e) => setJobNo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Durum</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {STATUS_OPTIONS.map((opt) => (
                                <div key={opt.value} className={cn(
                                    "flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer",
                                    status.includes(opt.value) ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-muted/30 border-transparent hover:bg-muted/50"
                                )} onClick={() => handleStatusChange(opt.value)}>
                                    <Checkbox 
                                        id={`status-${opt.value}`} 
                                        checked={status.includes(opt.value)}
                                        onCheckedChange={() => {}} // Controlled by div click
                                    />
                                    <span className="text-sm font-medium leading-none">
                                        {opt.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Teams Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Ekipler</Label>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {teams.map((team) => (
                                <div key={team.id} className={cn(
                                    "flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer",
                                    selectedTeams.includes(team.id) ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-muted/30 border-transparent hover:bg-muted/50"
                                )} onClick={() => handleTeamChange(team.id)}>
                                    <Checkbox 
                                        id={`team-${team.id}`}
                                        checked={selectedTeams.includes(team.id)}
                                        onCheckedChange={() => {}}
                                    />
                                    <span className="text-sm font-medium leading-none">
                                        {team.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Section */}
                    <div className="space-y-3 pb-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Tarih Aralığı</Label>
                            {dateRange?.from && (
                                <button 
                                    onClick={() => setDateRange(undefined)}
                                    className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                                >
                                    Sıfırla
                                </button>
                            )}
                        </div>
                        
                        {/* Date Summary Badge */}
                        <div className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors",
                            dateRange?.from ? "bg-primary/5 border-primary text-primary" : "bg-muted/30 border-transparent text-muted-foreground"
                        )}>
                            <CalendarIcon className="h-4 w-4" />
                            {dateRange?.from ? (
                                <span>
                                    {format(dateRange.from, 'd MMM yyyy', { locale: tr })}
                                    {dateRange.to && ` - ${format(dateRange.to, 'd MMM yyyy', { locale: tr })}`}
                                </span>
                            ) : (
                                <span>Tarih seçilmedi</span>
                            )}
                        </div>

                        <div className="border rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex justify-center">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange as any}
                                locale={tr}
                                className="scale-95 sm:scale-100"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t bg-slate-50 dark:bg-slate-900/50 flex-row gap-3 sm:space-x-0">
                    <Button variant="ghost" className="flex-1 h-11" onClick={clearFilters}>
                        Temizle
                    </Button>
                    <Button className="flex-1 h-11" onClick={applyFilters}>
                        Filtreleri Uygula
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
