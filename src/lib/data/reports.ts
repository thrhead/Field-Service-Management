"use server"

import { prisma } from "@/lib/db";
// Bypassing cache to natively resolve Server Component Render errors on the dashboard
const unstable_cache = (cb: any, keys?: any, options?: any) => cb;

export async function getJobsForReport() {
    return await prisma.job.findMany({
        include: {
            assignments: {
                include: {
                    team: true
                },
                take: 1
            },
            customer: true,
            steps: {
                select: {
                    id: true,
                    isCompleted: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

const _getReportStats = unstable_cache(
    async (startDate: Date, endDate: Date, jobStatus?: string, jobId?: string, category?: string) => {
        const jobWhere: any = {
            createdAt: { gte: startDate, lte: endDate }
        };
        if (jobStatus && jobStatus !== 'all') jobWhere.status = jobStatus;
        if (jobId && jobId !== 'all') jobWhere.id = jobId;

        const jobsByStatus = await prisma.job.groupBy({
            by: ['status'],
            _count: true,
            where: jobWhere
        });

        const pendingJobs = jobsByStatus.find(g => g.status === 'PENDING')?._count || 0;
        const inProgressJobs = jobsByStatus.find(g => g.status === 'IN_PROGRESS')?._count || 0;
        const completedJobs = (jobsByStatus.find(g => g.status === 'COMPLETED')?._count || 0) + 
                              (jobsByStatus.find(g => g.status === 'ACCEPTED')?._count || 0);
        const totalJobs = pendingJobs + inProgressJobs + completedJobs;

        const costWhere: any = {
            date: { gte: startDate, lte: endDate }}
;
        if (jobStatus && jobStatus !== 'all') costWhere.job = { ...costWhere.job, status: jobStatus };
        if (jobId && jobId !== 'all') costWhere.jobId = jobId;
        if (category && category !== 'all') costWhere.category = category;

        // Total APPROVED costs for the specific filters
        const approvedCosts = await prisma.costTracking.aggregate({
            _sum: { amount: true },
            where: { ...costWhere, status: 'APPROVED' }
        });

        const pendingCostsCount = await prisma.costTracking.count({
            where: { ...costWhere, status: 'PENDING' }
        });

        const totalWorkers = await prisma.user.count({
            where: { role: { in: ['WORKER', 'MANAGER'] }, isActive: true }
        });

        return {
            totalJobs,
            pendingJobs,
            inProgressJobs,
            completedJobs,
            totalCost: approvedCosts._sum.amount || 0,
            pendingApprovals: pendingCostsCount,
            totalWorkers
        };
    },
    ['report-stats'],
    { revalidate: 300, tags: ['reports', 'costs', 'jobs'] }
);

const _getCostBreakdown = unstable_cache(
    async (startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) => {
        const where: any = {
            date: {
                gte: startDate,
                lte: endDate
            }}
;

        if (status && status !== 'all') {
            where.status = status;
        } else {
            where.status = { not: 'REJECTED' };
        }

        if (jobStatus && jobStatus !== 'all') {
            where.job = { ...where.job, status: jobStatus };
        }

        if (jobId && jobId !== 'all') {
            where.jobId = jobId;
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        const costs = await prisma.costTracking.groupBy({
            by: ['category'],
            _sum: { amount: true },
            where
        });

        const breakdown: Record<string, number> = {};
        costs.forEach(cost => {
            if (cost.category && cost._sum.amount) {
                breakdown[cost.category] = cost._sum.amount;
            }
        });

        return breakdown;
    },
    ['cost-breakdown'],
    { revalidate: 300, tags: ['costs'] }
);

const _getCostTrend = unstable_cache(
    async (startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) => {
        const where: any = {
            date: { gte: startDate, lte: endDate }}
;

        if (status && status !== 'all') where.status = status;
        else where.status = { not: 'REJECTED' };

        if (jobStatus && jobStatus !== 'all') where.job = { ...where.job, status: jobStatus };
        if (jobId && jobId !== 'all') where.jobId = jobId;
        if (category && category !== 'all') where.category = category;

        const costs = await prisma.costTracking.findMany({
            where,
            select: { date: true, amount: true, category: true },
            orderBy: { date: 'asc' }
        });

        const trendMap: Record<string, Record<string, number>> = {};
        const categoriesSet = new Set<string>();

        costs.forEach(cost => {
            const dateStr = cost.date.toISOString().split('T')[0];
            const cat = cost.category || 'Diğer';
            categoriesSet.add(cat);

            if (!trendMap[dateStr]) trendMap[dateStr] = {};
            trendMap[dateStr][cat] = (trendMap[dateStr][cat] || 0) + cost.amount;
        });

        const categories = Array.from(categoriesSet);
        const data = Object.entries(trendMap).map(([date, values]) => ({
            date,
            ...values
        }));

        return { data, categories };
    },
    ['cost-trend'],
    { revalidate: 300, tags: ['costs'] }
);

const _getTotalCostTrend = unstable_cache(
    async (startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) => {
        const where: any = {
            date: { gte: startDate, lte: endDate }}
;

        if (status && status !== 'all') where.status = status;
        else where.status = { not: 'REJECTED' };

        if (jobStatus && jobStatus !== 'all') where.job = { ...where.job, status: jobStatus };
        if (jobId && jobId !== 'all') where.jobId = jobId;
        if (category && category !== 'all') where.category = category;

        const costs = await prisma.costTracking.findMany({
            where,
            select: { date: true, amount: true },
            orderBy: { date: 'asc' }
        });

        const trendMap: Record<string, number> = {};
        costs.forEach(cost => {
            const dateStr = cost.date.toISOString().split('T')[0];
            trendMap[dateStr] = (trendMap[dateStr] || 0) + cost.amount;
        });

        return Object.entries(trendMap).map(([date, amount]) => ({
            date,
            amount
        }));
    },
    ['total-cost-trend'],
    { revalidate: 300, tags: ['costs'] }
);

export async function getPendingCostsList(startDate: Date, endDate: Date, jobStatus?: string, jobId?: string, category?: string) {
    const where: any = {
        date: { gte: startDate, lte: endDate },
        status: 'PENDING'}
;

    if (jobStatus && jobStatus !== 'all') where.job = { ...where.job, status: jobStatus };
    if (jobId && jobId !== 'all') where.jobId = jobId;
    if (category && category !== 'all') where.category = category;

    return await prisma.costTracking.findMany({
        where,
        include: {
            job: true,
            createdBy: true
        },
        orderBy: { date: 'desc' }
    });
}

/**
 * Yeni Rapor Fonksiyonları
 */

// 1. Kârlılık Raporu Verisi
export async function getProfitabilityData(startDate: Date, endDate: Date, customerId?: string) {
    const where: any = {
        status: { in: ['COMPLETED', 'ACCEPTED'] },
        completedDate: { gte: startDate, lte: endDate }
    };
    if (customerId && customerId !== 'all') where.customerId = customerId;

    const jobs = await prisma.job.findMany({
        where,
        include: {
            costs: { where: { status: 'APPROVED' } },
            customer: true
        }
    });

    return jobs.map(job => {
        const totalCost = job.costs.reduce((sum, c) => sum + c.amount, 0);
        const budget = job.budget || 0;
        return {
            jobNo: job.jobNo || job.id.substring(0, 8),
            title: job.title,
            customer: job.customer.company,
            budget,
            totalCost,
            profit: budget - totalCost,
            profitMargin: budget > 0 ? ((budget - totalCost) / budget) * 100 : 0
        };
    });
}

// 2. Gecikme ve Darboğaz Analizi Verisi
export async function getDelayAnalysisData(startDate: Date, endDate: Date) {
    const now = new Date();

    const jobs = await prisma.job.findMany({
        where: {
            OR: [
                { status: { in: ['COMPLETED', 'ACCEPTED'] }, completedDate: { gte: startDate, lte: endDate }, startedAt: { not: null } },
                { status: 'IN_PROGRESS', startedAt: { not: null } }
            ]
        },
        include: {
            steps: { select: { id: true, isCompleted: true, blockedAt: true, title: true } },
            customer: { select: { company: true } }
        }
    });

    return jobs.map(job => {
        const endTime = (job.status === 'COMPLETED' || job.status === 'ACCEPTED') ? job.completedDate! : now;
        const actualDuration = job.startedAt ? (endTime.getTime() - job.startedAt!.getTime()) / (1000 * 60) : 0;
        const estimatedDuration = job.estimatedDuration || 0;
        const delay = estimatedDuration > 0 ? actualDuration - estimatedDuration : 0;
        const completedSteps = job.steps.filter(s => s.isCompleted).length;
        const totalSteps = job.steps.length;

        return {
            id: job.id,
            jobNo: job.jobNo || job.id.substring(0, 8),
            title: job.title,
            status: job.status,
            customer: job.customer?.company || '',
            estimatedDuration,
            actualDuration: Math.round(actualDuration),
            delay: delay > 0 ? Math.round(delay) : 0,
            progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
            completedSteps,
            totalSteps,
            blockedStepsCount: job.steps.filter(s => s.blockedAt !== null).length,
            bottleneckCount: job.steps.filter(s => s.blockedAt !== null).length
        };
    });
}

// 3. Ekip Kapasite ve İş Yükü Verisi
export async function getTeamCapacityData() {
    const teams = await prisma.team.findMany({
        include: {
            assignments: {
                where: { job: { status: { in: ['PENDING', 'IN_PROGRESS'] } } },
                include: { job: true }
            },
            members: true
        }
    });

    return teams.map(team => ({
        teamName: team.name,
        activeJobsCount: team.assignments.length,
        memberCount: team.members.length,
        loadFactor: team.members.length > 0 ? (team.assignments.length / team.members.length) * 100 : 0
    }));
}

// 4. Personel Performans Verisi
export async function getPersonnelPerformanceData(startDate: Date, endDate: Date) {
    const workers = await prisma.user.findMany({
        where: { role: { in: ['WORKER', 'MANAGER'] } },
        include: {
            completedSteps: {
                where: { completedAt: { gte: startDate, lte: endDate } }
            },
            teamMember: {
                include: { team: true }
            }
        }
    });

    return workers.map(worker => ({
        name: worker.name || worker.email,
        teamName: worker.teamMember[0]?.team.name || 'Bağımsız',
        completedStepsCount: worker.completedSteps.length}
)).sort((a, b) => b.completedStepsCount - a.completedStepsCount);
}

// 5. Finansal Özet Tablo Verisi
export async function getFinancialSummaryData(startDate: Date, endDate: Date) {
    const costs = await prisma.costTracking.findMany({
        where: {
            date: { gte: startDate, lte: endDate },
            status: 'APPROVED'}
,
        include: {
            job: true
        }
    });

    const categoryBreakdown = costs.reduce((acc: any, cost) => {
        const cat = cost.category || 'Diğer';
        acc[cat] = (acc[cat] || 0) + cost.amount;
        return acc;
    }, {});

    return {
        totalApproved: costs.reduce((sum, c) => sum + c.amount, 0),
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
        recentCosts: costs.slice(0, 10).map(c => ({
            date: c.date,
            description: c.description,
            amount: c.amount,
            jobTitle: c.job?.title || 'Bilinmeyen İş'
        }))
    };
}

const _getJobsListForFilter = unstable_cache(
    async (jobStatus?: string) => {
        const where: any = {};
        if (jobStatus && jobStatus !== 'all') {
            where.status = jobStatus;
        }

        return await prisma.job.findMany({
            where,
            select: { id: true, title: true },
            orderBy: { title: 'asc' }
        });
    },
    ['jobs-list-filter'],
    { revalidate: 3600, tags: ['jobs'] }
);

const _getCategoriesForFilter = unstable_cache(
    async () => {
        const categories = await prisma.costTracking.groupBy({
            by: ['category'],
            where: { category: { not: null } }
        });
        return categories.map(c => c.category as string);
    },
    ['categories-filter'],
    { revalidate: 3600, tags: ['costs'] }
);

const _getJobStatusDistribution = unstable_cache(
    async (startDate: Date, endDate: Date, jobStatus?: string, jobId?: string) => {
        const where: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        if (jobStatus && jobStatus !== 'all') {
            where.status = jobStatus;
        }

        if (jobId && jobId !== 'all') {
            where.id = jobId;
        }

        const jobs = await prisma.job.groupBy({
            by: ['status'],
            _count: true,
            where
        });

        const distribution: Record<string, number> = {};
        jobs.forEach(job => {
            distribution[job.status] = job._count;
        });

        return distribution;
    },
    ['job-status-distribution'],
    { revalidate: 300, tags: ['jobs'] }
);

const _getTeamPerformance = unstable_cache(
    async (startDate: Date, endDate: Date, jobStatus?: string, jobId?: string) => {
        const where: any = {
            status: { in: ['COMPLETED', 'ACCEPTED'] },
            completedDate: {
                gte: startDate,
                lte: endDate
            },
            startedAt: {
                not: null
            },
            assignments: {
                some: {
                    teamId: {
                        not: null
                    }
                }
            }
        };

        if (jobStatus && jobStatus !== 'all') {
            where.status = jobStatus;
        }

        if (jobId && jobId !== 'all') {
            where.id = jobId;
        }

        const jobs = await prisma.job.findMany({
            where,
            include: {
                assignments: {
                    include: {
                        team: true
                    }
                }
            }
        });

        const teamStats: Record<string, { totalJobs: number; totalTime: number; teamName: string }> = {};

        jobs.forEach(job => {
            const teamAssignment = job.assignments.find(a => a.teamId);
            if (teamAssignment && teamAssignment.team) {
                const teamId = teamAssignment.team.id;
                const teamName = teamAssignment.team.name;

                if (!teamStats[teamId]) {
                    teamStats[teamId] = { totalJobs: 0, totalTime: 0, teamName };
                }

                if (job.startedAt && job.completedDate) {
                    const durationMinutes = (job.completedDate.getTime() - job.startedAt.getTime()) / (1000 * 60);
                    teamStats[teamId].totalJobs += 1;
                    teamStats[teamId].totalTime += durationMinutes;
                }
            }
        });

        return Object.values(teamStats).map(stat => ({
            teamName: stat.teamName,
            totalJobs: stat.totalJobs,
            avgCompletionTimeMinutes: stat.totalJobs > 0 ? stat.totalTime / stat.totalJobs : 0
        }));
    },
    ['team-performance'],
    { revalidate: 600, tags: ['teams', 'jobs'] }
);

const _getWeeklyCompletedSteps = unstable_cache(
    async () => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        last7Days.setHours(0, 0, 0, 0);

        const prev7Days = new Date(last7Days);
        prev7Days.setDate(last7Days.getDate() - 7);
        prev7Days.setHours(0, 0, 0, 0);

        // Fetch steps completed in the last 14 days
        const steps = await prisma.jobStep.findMany({
            where: {
                isCompleted: true,
                completedAt: { gte: prev7Days, lte: today },
                 // Sadece var olan işlerin adımlarını getir
            },
            include: {
                job: {
                    select: { title: true }
                }
            },
            orderBy: { completedAt: 'asc' }
        });

        // Gerçek veritabanından, filtre aralığındaki tamamlanmış adımların başlıklarını çeken Dinamik Kategori
        const categoriesSet = new Set<string>();
        steps.forEach(step => {
            if (step.title) categoriesSet.add(step.title);
        });
        const categories = Array.from(categoriesSet);

        const formatData = (startDate: Date, endDate: Date) => {
            const days: Record<string, any> = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i + 1);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
                const dayMonth = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                const displayLabel = `${dayName} ${dayMonth}`;

                days[dateStr] = { name: displayLabel, date: dateStr, total: 0 };
                categories.forEach(cat => days[dateStr][cat] = 0);
                days[dateStr].jobs = [];
            }

            steps.filter(s => s.completedAt! >= startDate && s.completedAt! <= endDate).forEach(step => {
                const dateStr = step.completedAt!.toISOString().split('T')[0];
                if (days[dateStr]) {
                    const cat = step.title;
                    if (categories.includes(cat)) {
                        days[dateStr][cat]++;
                    }
                    days[dateStr].total++;
                    if (!days[dateStr].jobs.find((j: any) => j.id === step.jobId)) {
                        days[dateStr].jobs.push({ id: step.jobId, title: step.job?.title || 'Bilinmeyen İş' });
                    }
                }
            });

            return Object.values(days);
        };

        const currentWeek = formatData(last7Days, today);
        const previousWeek = formatData(prev7Days, last7Days);

        return {
            currentWeek,
            previousWeek,
            categories
        };
    },
    ['weekly-completed-steps'],
    { revalidate: 600, tags: ['steps', 'jobs'] }
);

export async function getCostList(startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) {
    const where: any = {
        date: { gte: startDate, lte: endDate }}
;

    if (status && status !== 'all') where.status = status;
    else where.status = { not: 'REJECTED' };

    if (jobStatus && jobStatus !== 'all') where.job = { ...where.job, status: jobStatus };
    if (jobId && jobId !== 'all') where.jobId = jobId;
    if (category && category !== 'all') where.category = category;

    return await prisma.costTracking.findMany({
        where,
        include: {
            job: {
                select: { title: true }
            },
            createdBy: {
                select: { name: true }
            }
        },
        orderBy: { date: 'desc' }
    });
}

/**
 * 📊 ENHANCED DASHBOARD FUNCTIONS (Strategic, Tactical, Operational)
 */

// 1. STRATEGIC DASHBOARD: Focus on business health and long-term trends
export async function getStrategicDashboard(startDate: Date, endDate: Date) {
    // Shared filters
    const dateRange = { gte: startDate, lte: endDate };

    // Customer Profitability (CPI)
    const profitabilityData = await getProfitabilityData(startDate, endDate);
    
    // Revenue vs Cost Trend (Grouped by Date)
    const totalCostTrend = await getTotalCostTrend(startDate, endDate);
    
    const jobsInRange = await prisma.job.findMany({
        where: { createdAt: dateRange },
        select: { createdAt: true, budget: true, status: true, startedAt: true, completedDate: true, estimatedDuration: true }
    });

    // Grouping revenue by date
    const revenueTrendMap: Record<string, number> = {};
    jobsInRange.forEach(j => {
        const dateStr = j.createdAt.toISOString().split('T')[0];
        revenueTrendMap[dateStr] = (revenueTrendMap[dateStr] || 0) + (j.budget || 0);
    });

    const revenueTrend = Object.entries(revenueTrendMap).map(([date, amount]) => ({ date, amount }));

    // Project Status Summary
    const jobStatusStats = await prisma.job.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: dateRange }
    });

    const totalJobs = jobStatusStats.reduce((sum, s) => sum + s._count, 0);
    const completedJobs = jobStatusStats.find(s => s.status === 'COMPLETED')?._count || 0;
    
    const projectCompletionStats = {
        total: totalJobs,
        completed: completedJobs,
        percentage: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    };

    // --- NEW METRICS FOR ISSUE #74 ---
    
    // 1. SLA Compliance: % of jobs completed within estimated time
    const completedJobsWithTime = jobsInRange.filter(j => j.status === 'COMPLETED' && j.startedAt && j.completedDate && j.estimatedDuration);
    const withinSLA = completedJobsWithTime.filter(j => {
        const actualMinutes = (j.completedDate!.getTime() - j.startedAt!.getTime()) / (1000 * 60);
        return actualMinutes <= j.estimatedDuration!;
    }).length;
    const slaCompliance = completedJobsWithTime.length > 0 ? (withinSLA / completedJobsWithTime.length) * 100 : 0;

    // 2. Resource Utilization: Active workers vs Total workers
    const activeWorkersCount = await prisma.user.count({
        where: { 
            role: { in: ['WORKER', 'MANAGER'] }, 
            isActive: true,
            assignedJobs: { some: { job: { status: { in: ['PENDING', 'IN_PROGRESS'] } } } }
        }
    });
    const totalWorkersCount = await prisma.user.count({
        where: { role: { in: ['WORKER', 'MANAGER'] }, isActive: true }
    });
    const resourceUtilization = totalWorkersCount > 0 ? (activeWorkersCount / totalWorkersCount) * 100 : 0;

    // 3. Revenue per Job (Average budget of completed jobs)
    const completedJobsTotalBudget = jobsInRange
        .filter(j => j.status === 'COMPLETED')
        .reduce((sum, j) => sum + (j.budget || 0), 0);
    const revenuePerJob = completedJobs > 0 ? completedJobsTotalBudget / completedJobs : 0;

    // 4. Category Totals (For "Toplam Kategori" card)
    const costBreakdown = await getCostBreakdown(startDate, endDate);
    const categoryTotals = Object.keys(costBreakdown).length;

    const topCustomersByProfit = profitabilityData
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    const overallProfitMargin = profitabilityData.length > 0
        ? (profitabilityData.reduce((sum, item) => sum + item.profit, 0) / 
          profitabilityData.reduce((sum, item) => sum + (item.budget || 1), 0)) * 100
        : 0;

    return {
        overallProfitMargin,
        topCustomersByProfit,
        profitabilityData,
        projectStats: projectCompletionStats,
        jobStatusStats: jobStatusStats.map(s => ({ status: s.status, count: s._count })),
        slaCompliance,
        resourceUtilization,
        revenuePerJob,
        categoryTotals,
        trends: {
            costs: totalCostTrend,
            revenue: revenueTrend
        }
    };
}

// 2. TACTICAL DASHBOARD: Focus on resource utilization and departmental alignment
export async function getTacticalDashboard(startDate: Date, endDate: Date) {
    // Team Capacity & Load Factor
    const teamCapacity = await getTeamCapacityData();
    
    // Budget Variance Analysis
    const budgetVariance = await prisma.job.findMany({
        where: { status: { in: ['COMPLETED', 'ACCEPTED'] }, completedDate: { gte: startDate, lte: endDate } },
        select: {
            title: true,
            budget: true,
            costs: { where: { status: 'APPROVED' }, select: { amount: true } }
        }
    });

    const varianceData = budgetVariance.map(job => {
        const actualCost = job.costs.reduce((sum, c) => sum + c.amount, 0);
        const budget = job.budget || 0;
        return {
            title: job.title,
            budget,
            actualCost,
            variance: budget - actualCost,
            variancePct: budget > 0 ? ((budget - actualCost) / budget) * 100 : 0
        };
    });

    // Cost Category Distribution
    const costBreakdown = await getCostBreakdown(startDate, endDate);

    // Budget Efficiency (Issue #74)
    const totalBudget = budgetVariance.reduce((sum, j) => sum + (j.budget || 0), 0);
    const totalActual = budgetVariance.reduce((sum, j) => sum + j.costs.reduce((s, c) => s + c.amount, 0), 0);
    const budgetEfficiency = totalBudget > 0 ? (1 - (totalActual / totalBudget)) * 100 : 0;

    return {
        teamCapacity,
        varianceData,
        costBreakdown,
        budgetEfficiency,
        avgTeamLoad: teamCapacity.reduce((sum, t) => sum + t.loadFactor, 0) / (teamCapacity.length || 1)
    };
}

// 3. OPERATIONAL DASHBOARD: Focus on daily flow and bottlenecks
export async function getOperationalDashboard(startDate: Date, endDate: Date) {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Bottleneck Analysis (Step Completion Time Trend)
    const delayAnalysis = await getDelayAnalysisData(startDate, endDate);
    
    // Pending Approvals (Urgent)
    const pendingCosts = await prisma.costTracking.count({ where: { status: 'PENDING' } });
    const pendingSteps = await prisma.jobStep.count({ where: { approvalStatus: 'PENDING', isCompleted: true } });
    const pendingSubSteps = await prisma.jobSubStep.count({ where: { approvalStatus: 'PENDING', isCompleted: true } });
    
    // SLA Alerts: Approvals older than 48 hours
    const delayedCosts = await prisma.costTracking.count({ 
        where: { status: 'PENDING', createdAt: { lt: fortyEightHoursAgo } } 
    });
    const delayedSteps = await prisma.jobStep.count({ 
        where: { approvalStatus: 'PENDING', isCompleted: true, completedAt: { not: null, lt: fortyEightHoursAgo } } 
    });
    const delayedSubSteps = await prisma.jobSubStep.count({ 
        where: { approvalStatus: 'PENDING', isCompleted: true, completedAt: { not: null, lt: fortyEightHoursAgo } } 
    });

    // Active Jobs Distribution
    const jobStatusDist = await getJobStatusDistribution(startDate, endDate);

    // Recent Bottlenecks (Jobs with highest delay)
    const topBottlenecks = delayAnalysis
        .filter(d => d.delay > 0)
        .sort((a, b) => b.delay - a.delay)
        .slice(0, 5);
    
    // Total count of in-progress jobs that exceed their estimated duration
    const inProgressDelayedCount = delayAnalysis.filter(d => d.status === 'IN_PROGRESS' && d.delay > 0).length;

    return {
        jobStatusDist,
        topBottlenecks,
        inProgressDelayedCount,
        pendingApprovals: {
            costs: pendingCosts,
            steps: pendingSteps + pendingSubSteps,
            delayedCosts,
            delayedSteps: delayedSteps + delayedSubSteps,
            totalDelayed: delayedCosts + delayedSteps + delayedSubSteps
        },
        bottleneckScore: delayAnalysis.reduce((sum, d) => sum + (d.delay > 0 ? 1 : 0), 0) / (delayAnalysis.length || 1) * 100
    };
}
export async function getWorkflowAuditData(startDate: Date, endDate: Date) {
    const jobs = await prisma.job.findMany({
        where: { 
            status: { in: ['COMPLETED', 'ACCEPTED'] }, 
            completedDate: { gte: startDate, lte: endDate } 
        },
        include: {
            steps: {
                orderBy: { order: 'asc' },
                include: {
                    completedBy: { select: { name: true } },
                    approvedBy: { select: { name: true } }
                }
            },
            customer: { select: { company: true } }
        }
    });

    return jobs.map(job => ({
        id: job.id,
        jobNo: job.jobNo,
        customer: job.customer.company,
        title: job.title,
        steps: job.steps.map(step => ({
            title: step.title,
            completedBy: step.completedBy?.name || 'N/A',
            completedAt: step.completedAt,
            approvedBy: step.approvedBy?.name || 'N/A',
            approvedAt: step.approvedAt,
            duration: step.startedAt && step.completedAt 
                ? (step.completedAt.getTime() - step.startedAt.getTime()) / (1000 * 60) 
                : 0
        }))
    }));
}

export async function getCostDetailsData(startDate: Date, endDate: Date) {
    const costs = await prisma.costTracking.findMany({
        where: {
            date: { gte: startDate, lte: endDate },
            status: 'APPROVED'}
,
        include: {
            job: { select: { title: true, jobNo: true } },
            createdBy: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
    });

    return costs.map(c => ({
        date: c.date,
        jobNo: c.job?.jobNo || 'N/A',
        jobTitle: c.job?.title || 'Bilinmeyen İş',
        category: c.category,
        description: c.description,
        amount: c.amount,
        createdBy: c.createdBy?.name || 'Sistem'
    }));
}


export async function getReportStats(startDate: Date, endDate: Date, jobStatus?: string, jobId?: string, category?: string) {
  return _getReportStats(startDate, endDate, jobStatus, jobId, category);
}

export async function getCostBreakdown(startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) {
  return _getCostBreakdown(startDate, endDate, status, jobStatus, jobId, category);
}

export async function getCostTrend(startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) {
  return _getCostTrend(startDate, endDate, status, jobStatus, jobId, category);
}

export async function getTotalCostTrend(startDate: Date, endDate: Date, status?: string, jobStatus?: string, jobId?: string, category?: string) {
  return _getTotalCostTrend(startDate, endDate, status, jobStatus, jobId, category);
}

export async function getJobsListForFilter(jobStatus?: string) {
  return _getJobsListForFilter(jobStatus);
}

export async function getCategoriesForFilter() {
  return _getCategoriesForFilter();
}

export async function getJobStatusDistribution(startDate: Date, endDate: Date, jobStatus?: string, jobId?: string) {
  return _getJobStatusDistribution(startDate, endDate, jobStatus, jobId);
}

export async function getTeamPerformance(startDate: Date, endDate: Date, jobStatus?: string, jobId?: string) {
  return _getTeamPerformance(startDate, endDate, jobStatus, jobId);
}

export async function getWeeklyCompletedSteps() {
  return _getWeeklyCompletedSteps();
}
