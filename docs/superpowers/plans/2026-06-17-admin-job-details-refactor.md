# İş Detayları Sayfası Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin panelindeki iş detayları sayfasını, müşteri bilgilerini entegre ederek yeniden tasarlamak ve "İş Geçmişi" (Audit Log) özelliğini ekleyerek izlenebilirliği artırmak.

**Architecture:** 
- `src/components/admin/job-details-tabs.tsx` bileşeninde grid yapısı `grid-cols-2` olarak güncellenecek.
- Sol kolona Müşteri bilgileri eklenecek (İş Bilgileri kartı içinde).
- Sağ kolona `JobAuditHistory` (yeni bileşen) eklenecek.
- Audit log sistemine `COST_*` ve `JOB_CUSTOMER_*` aksiyonları eklenecek.

**Tech Stack:** React, Next.js, TypeScript, TailwindCSS, Prisma (Audit log).

---

### Task 1: Audit Log Enum ve Servis Güncellemesi

**Files:**
- Modify: `src/lib/audit.ts`

- [ ] **Step 1: Update AuditAction enum**
Add: 
```typescript
    COST_CREATE = 'COST_CREATE',
    COST_APPROVE = 'COST_APPROVE',
    COST_REJECT = 'COST_REJECT',
    JOB_CUSTOMER_ACCEPT = 'JOB_CUSTOMER_ACCEPT',
    JOB_CUSTOMER_REJECT = 'JOB_CUSTOMER_REJECT',
```

- [ ] **Step 2: Update formatAuditMessage in `src/lib/audit.ts`**
Handle new actions in `switch` block.

---

### Task 2: JobAuditHistory Bileşeni Oluşturma

**Files:**
- Create: `src/components/admin/job-audit-history.tsx`

- [ ] **Step 1: Create `JobAuditHistory` component**
- Fetch audit logs for the job.
- Implement filter functionality.
- Render logs in a list format, sorted by date.

---

### Task 3: JobDetailsTabs Layout Güncellemesi

**Files:**
- Modify: `src/components/admin/job-details-tabs.tsx`

- [ ] **Step 1: Update grid layout for "Detaylar" section**
- Integrate Müşteri Bilgileri into İş Bilgileri kartı.
- Add `JobAuditHistory` component to the right grid column.
- Apply `h-full` and `overflow-y-auto`.

---

### Task 4: API ve Action Log Güncellemeleri

**Files:**
- Modify: (Identify API/Action files for Costs and Customer acceptance)

- [ ] **Step 1: Add `logAudit` calls**
- Find routes for cost creation, approval, rejection, customer job acceptance, job rejection.
- Add `logAudit(..., AuditAction.XXX, ...)` calls.

---

### Task 5: Testing & Verification

- [ ] **Step 1: Verify layout and audit logging**
- Manual test in Admin panel: perform actions and check if they appear in "İş Geçmişi".

---

Tarih: 2026-06-17
