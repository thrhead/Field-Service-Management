# Report Fix Plan

## Goal
Resolve PDF download redirection issue and clarify 'completed jobs' visibility in the Reports section.

## Issues
1. **PDF Download Redirection:** The PDF download button in the job card redirects to the job details page instead of initiating the download.
2. **Missing Completed Jobs:** Customers are unclear about why some completed jobs are not appearing in the Reports section, and the reporting logic needs investigation.

---

## Phase 1: Investigation & Research
- [ ] Investigate `src/components/pdf-download-button.tsx` to understand why the click event triggers navigation/redirection.
- [ ] Analyze `src/lib/data/reports.ts` and related API routes (`src/app/api/.../reports/`) to understand the query logic for fetching "completed jobs" in the reports section.
- [ ] Identify constraints or filtering logic causing some jobs to be excluded from the reports list.

## Phase 2: Implementation
- [ ] **Fix PDF Download:** Update `src/components/pdf-download-button.tsx` to prevent event propagation and default behavior during the download process.
- [ ] **Clarify/Fix Reporting Logic:** If filtering is incorrect, update the query logic in `src/lib/data/reports.ts`. If the logic is correct but confusing, create documentation or UI messaging to clarify the criteria.

## Phase 3: Validation
- [ ] **Download:** Verify that clicking the PDF download button triggers the browser download without redirecting the user.
- [ ] **Reporting:** Verify that the list of completed jobs in the reports section aligns with the expected query logic and is consistent.

## Phase 4: Documentation
- [ ] Add a brief explanation of the reporting criteria for "completed jobs" to `docs/guides/reports-guide.md` (or similar) to address customer confusion.
