# Mobile Expenses Module Redesign Specification

## 1. Overview
The goal is to modernize the mobile expense management interface to be more intuitive, visually aligned with Idenfit's module, and fully functional on both native mobile and web platforms.

## 2. Architecture & Components
- **Summary Header Card:** Add a new top-level component to display key metrics (Total Expenses, Pending, Rejected/Approved).
- **Modernized List View:** Refactor `ExpenseList` to use a cleaner, card-based layout with swipe-to-action support for Edit/Delete instead of static action buttons at the bottom of the card.
- **Form Refinement:** Improve the `CreateExpenseModal` with a better layout and fix the `DateTimePicker` issue by implementing the `CustomDateTimePicker` wrapper for web compatibility.

## 3. UI/UX Guidelines
- **Consistency:** Use existing theme colors and typography tokens.
- **Interactivity:** Swipe gestures for actions (Edit, Delete).
- **Compatibility:** Web-specific handling for inputs and date pickers.

## 4. Technical Implementation
- **Dependency Update:** Replace direct import of `@react-native-community/datetimepicker` in `CreateExpenseModal.js` with `CustomDateTimePicker`.
- **Styling:** Update `StyleSheet` definitions in both `CreateExpenseModal.js` and `ExpenseList.js`.
- **Platform Handling:** Ensure `Platform.OS === 'web'` checks are robust and utilized.

## 5. Testing Strategy
- **Manual QA:** Validate date picker functionality on both web and native. Verify swipe actions.
- **Unit Tests:** Add tests for the new Summary Header and refined Expense Card components.
