'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Play, CheckCircle2, ThumbsUp, ThumbsDown,
  DollarSign, Camera, Users, RefreshCw, AlertOctagon,
  User2, Filter, ChevronDown, ChevronUp, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ActivityItem } from '@/lib/job-history-builder'

const ICON_MAP: Record<ActivityItem['icon'], React.ElementType> = {
  create: Plus,
  start: Play,
  complete: CheckCircle2,
  approve: ThumbsUp,
  reject: ThumbsDown,
  cost: DollarSign,
  photo: Camera,
  team: Users,
  update: RefreshCw,
  block: AlertOctagon,
  customer: User2,
}

const COLOR_MAP: Record<ActivityItem['color'], { bg: string; border: string; text: string; dot: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
}

type FilterCategory = 'all' | 'approvals' | 'steps' | 'costs' | 'customer' | 'status'

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'status', label: 'Durum Değişiklikleri' },
  { value: 'steps', label: 'Adımlar & Alt Görevler' },
  { value: 'approvals', label: 'Onaylar' },
  { value: 'costs', label: 'Masraflar' },
  { value: 'customer', label: 'Müşteri' },
]

const FILTER_TYPE_MAP: Record<FilterCategory, ActivityItem['type'][]> = {
  all: [],
  status: ['JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_CLOSED', 'JOB_UPDATED', 'TEAM_ASSIGNED'],
  steps: ['STEP_COMPLETED', 'STEP_APPROVED', 'STEP_REJECTED', 'SUBSTEP_COMPLETED', 'SUBSTEP_APPROVED', 'SUBSTEP_REJECTED', 'STEP_BLOCKED', 'SUBSTEP_BLOCKED', 'PHOTO_UPLOADED'],
  approvals: ['APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'STEP_APPROVED', 'STEP_REJECTED', 'SUBSTEP_APPROVED', 'SUBSTEP_REJECTED'],
  costs: ['COST_ADDED', 'COST_APPROVED', 'COST_REJECTED'],
  customer: ['CUSTOMER_APPROVED', 'CUSTOMER_REJECTED'],
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins} dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} gün önce`
    return formatDate(iso)
  } catch {
    return iso
  }
}

interface JobActivityHistoryProps {
  history: ActivityItem[]
}

export function JobActivityHistory({ history }: JobActivityHistoryProps) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [showAll, setShowAll] = useState(false)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let items = history
    if (filter !== 'all') {
      const allowedTypes = FILTER_TYPE_MAP[filter]
      items = items.filter(item => allowedTypes.includes(item.type))
    }
    const sorted = [...items].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return order === 'asc' ? diff : -diff
    })
    return sorted
  }, [history, filter, order])

  const INITIAL_LIMIT = 20
  const displayItems = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT)
  const hasMore = filtered.length > INITIAL_LIMIT

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-base">İş Geçmişi</CardTitle>
            <Badge variant="secondary" className="text-[10px] h-5">
              {filtered.length} hareket
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
          >
            {order === 'desc' ? (
              <><ChevronDown className="h-3 w-3 mr-1" /> Yeniden Eskiye</>
            ) : (
              <><ChevronUp className="h-3 w-3 mr-1" /> Eskiden Yeniye</>
            )}
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setShowAll(false) }}
              className={`
                px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200
                ${filter === opt.value
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pt-0">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Bu kategoride hareket bulunamadı</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-0">
              {displayItems.map((item, i) => {
                const IconComponent = ICON_MAP[item.icon] || RefreshCw
                const colors = COLOR_MAP[item.color] || COLOR_MAP.gray

                return (
                  <div key={item.id} className="relative flex gap-3 group">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 mt-2">
                      <div className={`w-[30px] h-[30px] rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <IconComponent className={`h-3.5 w-3.5 ${colors.text}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-4 min-w-0 ${i === displayItems.length - 1 ? 'pb-1' : ''}`}>
                      <div className="rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50/50 px-2 py-1.5 -mx-2 transition-colors">
                        <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-gray-400 font-medium">
                            {item.userName}
                          </span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[11px] text-gray-400" title={formatDate(item.date)} suppressHydrationWarning>
                            {formatRelativeTime(item.date)}
                          </span>
                          {item.source === 'audit' && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-blue-200 text-blue-500">
                              audit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Show more button */}
        {hasMore && !showAll && (
          <div className="pt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowAll(true)}
            >
              Tümünü Göster ({filtered.length - INITIAL_LIMIT} daha)
            </Button>
          </div>
        )}
        {showAll && hasMore && (
          <div className="pt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowAll(false)}
            >
              Daralt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
