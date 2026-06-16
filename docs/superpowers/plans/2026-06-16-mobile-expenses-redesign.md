# Mobile Expenses Module Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the mobile expenses management screen, fix DateTimePicker issue, and improve UI/UX by adding summary metrics and swipeable action items.

**Architecture:** Use existing React Native components, implement a new Summary Header component, refactor the Expense list for swipe gestures (using `react-native-swipeable` or equivalent built-in pattern), and fix import paths for date picking.

**Tech Stack:** React Native, Expo, React Context, TypeScript (where applicable).

---

### Task 1: Create ExpenseSummary Component

**Files:**
- Create: `apps/mobile/src/components/worker/expense/ExpenseSummary.js`
- Test: `apps/mobile/src/components/worker/expense/__tests__/ExpenseSummary.test.js`

- [ ] **Step 1: Implement ExpenseSummary**

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ExpenseSummary = ({ totalAmount, pendingCount, approvedCount, theme }) => {
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.metric}>
                <Text style={[styles.label, { color: theme.colors.subText }]}>Toplam</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>₺{totalAmount}</Text>
            </View>
            <View style={styles.metric}>
                <Text style={[styles.label, { color: theme.colors.subText }]}>Onay Bekleyen</Text>
                <Text style={[styles.value, { color: theme.colors.warning }]}>{pendingCount}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 16, justifyContent: 'space-around' },
    metric: { alignItems: 'center' },
    label: { fontSize: 12 },
    value: { fontSize: 18, fontWeight: 'bold' }
});
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/src/components/worker/expense/ExpenseSummary.js
git commit -m "feat: add ExpenseSummary component"
```

### Task 2: Fix DateTimePicker Import

**Files:**
- Modify: `apps/mobile/src/components/worker/expense/CreateExpenseModal.js`

- [ ] **Step 1: Replace DateTimePicker import**

Change:
```javascript
import DateTimePicker from '@react-native-community/datetimepicker';
```
To:
```javascript
import DateTimePicker from '../../CustomDateTimePicker';
```

- [ ] **Step 2: Verify fix (Manual QA)**
- Launch app on web and native, check expense creation modal date selection.

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/src/components/worker/expense/CreateExpenseModal.js
git commit -m "fix: use CustomDateTimePicker wrapper"
```

### Task 3: Refactor ExpenseList with Swipe Actions

**Files:**
- Modify: `apps/mobile/src/components/worker/expense/ExpenseList.js`

- [ ] **Step 1: Implement Swipeable logic**
Use `react-native-gesture-handler`'s `Swipeable` for editing/deleting items.

- [ ] **Step 2: Update UI styles**
Refactor the card styles based on the approved design.

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/src/components/worker/expense/ExpenseList.js
git commit -m "refactor: modernize ExpenseList UI and add swipe actions"
```

### Task 4: Integrate Summary and Refine Screen

**Files:**
- Modify: `apps/mobile/src/screens/worker/ExpensesScreen.js` (or equivalent file that uses ExpenseList)

- [ ] **Step 1: Add ExpenseSummary to screen**
Import `ExpenseSummary` and render it above `ExpenseList`. Pass calculated props.

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/src/screens/worker/ExpensesScreen.js
git commit -m "feat: integrate ExpenseSummary into expenses screen"
```
