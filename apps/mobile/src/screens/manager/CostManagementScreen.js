import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCostManagement } from '../../hooks/useCostManagement';
import BudgetCard from '../../components/manager/BudgetCard';
import ProjectFilter from '../../components/manager/ProjectFilter';
import CategoryFilter from '../../components/manager/CategoryFilter';
import ExpenseList from '../../components/manager/ExpenseList';
import DateFilter from '../../components/manager/DateFilter';
import UserFilter from '../../components/manager/UserFilter';
import { ExpenseSummary } from '../../components/worker/expense/ExpenseSummary';
import { useAlert } from '../../context/AlertContext';

import CustomSpinner from '../../components/CustomSpinner';
export default function CostManagementScreen({ navigation }) {
    const { theme, isDark } = useTheme();
    const { showAlert } = useAlert();
    const {
        jobs,
        users,
        filteredCosts,
        budgetStats,
        loading,
        refreshing,
        selectedJob,
        setSelectedJob,
        selectedUserId,
        setSelectedUserId,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        onRefresh
    } = useCostManagement();

    const totalAmount = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0).toFixed(2);
    const pendingCount = filteredCosts.filter(cost => cost.status === 'PENDING').length;
    const approvedCount = filteredCosts.filter(cost => cost.status === 'APPROVED').length;

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <CustomSpinner size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.subText }]}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back-ios" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Proje Masrafları</Text>
                </View>
                <TouchableOpacity style={styles.actionItem} onPress={() => showAlert('Yakında', 'Masraf ekleme özelliği yakında gelecek', [], 'warning')}>
                    <View style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                        <MaterialIcons name="add" size={22} color="#fff" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.colors.subText }]}>Yeni Masraf</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                <ExpenseSummary 
                    totalAmount={totalAmount}
                    pendingCount={pendingCount}
                    approvedCount={approvedCount}
                    theme={theme}
                />

                <ProjectFilter
                    jobs={jobs}
                    selectedJob={selectedJob}
                    onSelect={setSelectedJob}
                    theme={theme}
                />

                <DateFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    theme={theme}
                />

                <UserFilter
                    users={users}
                    selectedUserId={selectedUserId}
                    onSelect={setSelectedUserId}
                    theme={theme}
                />

                <BudgetCard stats={budgetStats} theme={theme} />

                {/* Search */}
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <MaterialIcons name="search" size={24} color={theme.colors.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Masraf ara..."
                        placeholderTextColor={theme.colors.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <CategoryFilter
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                    theme={theme}
                />

                <ExpenseList costs={filteredCosts} theme={theme} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionItem: {
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
});
