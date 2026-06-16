# Job Approval Details Redesign Specification

## 1. Overview
The goal is to enhance job order approval details across all platforms (web/mobile) and user roles (admin, manager, worker, customer) to provide transparency, accountability, and better performance tracking.

## 2. Key Features
- **Summary Metrics:**
    - **Status & Time:** Plan/Remaining time, Delay status (with visual indicators).
    - **Progress:** Total steps, completed/blocked steps, progress percentage.
    - **Operational Risk:** Blocking status, missing assignments, priority level.
- **Audit Timeline:**
    - A detailed, chronological history of approval states.
    - Fields: Date/Time, User, Action, Performance (Time elapsed since previous action).

## 3. UI/UX Guidelines
- **Consistency:** Same layout and data presentation across web/mobile.
- **Responsiveness:** Adaptive layout for both mobile screens and desktop admin dashboards.
- **Visual Indicators:** Use color-coded statuses (🔴, ⚠️, ⏱️, 🟡, ✅) for immediate visibility.

## 4. Technical Implementation
- **Components:** Create a reusable `ApprovalTimeline` component and `JobSummaryMetrics` component.
- **Data Integration:** Ensure the job service provides necessary audit and performance timestamp data.
- **Platform Handling:** Implement for both React (Web) and React Native (Mobile).

## 5. Testing Strategy
- **Audit Verification:** Ensure all job status transitions are logged and displayed correctly.
- **Performance Metrics:** Verify correct calculation of durations for both steps and approvals.
