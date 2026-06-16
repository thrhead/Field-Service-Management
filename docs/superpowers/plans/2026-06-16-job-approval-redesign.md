# Comprehensive Job Approval Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement audit timeline and performance metrics for job approvals across web (Next.js/Tailwind) and mobile (React Native/Expo).

**Architecture:** 
1. Create unified data structure for audit trail in `job.service.js`.
2. Create platform-specific components for `ApprovalTimeline` and `JobSummaryMetrics` (Tailwind for Web, RN Styles for Mobile).
3. Integrate into `JobDetailsView` (Web) and `JobDetailScreen` (Mobile).

**Tech Stack:** React, Next.js, Tailwind CSS, React Native, Expo.

---

### Task 1: Update API/Service to provide audit history

**Files:**
- Modify: `apps/mobile/src/services/job.service.js` (Mobile)
- Modify: `src/services/job.service.ts` (Web - assumed path)

- [ ] **Step 1: Ensure audit logs are fetched**
- Verify job object includes an `auditLog` or `approvalHistory` array containing `{action, user, date, durationSinceLast}`.

### Task 2: Implement Components for Web (Tailwind)

**Files:**
- Create: `src/components/job-detail/ApprovalTimeline.tsx`
- Create: `src/components/job-detail/JobSummaryMetrics.tsx`

- [ ] **Step 1: Implement ApprovalTimeline (Web)**

```tsx
export const ApprovalTimeline = ({ history }: { history: any[] }) => {
    return (
        <div className="space-y-4">
            {history.map((item, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-4">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.user} • {item.date}</p>
                        {item.duration && <p className="text-xs text-blue-600 font-bold">Süre: {item.duration}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};
```

### Task 3: Implement Components for Mobile (React Native)

**Files:**
- Modify/Create: `apps/mobile/src/components/job-detail/ApprovalTimeline.js` (Use existing or update)
- Modify/Create: `apps/mobile/src/components/job-detail/JobSummaryMetrics.js`

- [ ] **Step 1: Implement ApprovalTimeline (Mobile)** - Use standard RN `View`/`Text`/`StyleSheet`.

### Task 4: Integrate into Views

**Files:**
- Modify: `src/components/job-details-view.tsx` (Web)
- Modify: `apps/mobile/src/screens/worker/JobDetailScreen.js` (Mobile)

- [ ] **Step 1: Update Web `JobDetailsView`**
- Import and render `ApprovalTimeline` and `JobSummaryMetrics` using Tailwind classes.

- [ ] **Step 2: Update Mobile `JobDetailScreen`**
- Import and render platform-specific components.
