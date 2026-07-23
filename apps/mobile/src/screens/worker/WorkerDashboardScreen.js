import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
    StatusBar,
    Alert,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import jobService from '../../services/job.service';
import costService from '../../services/cost.service';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '../../components/StatCard';
import JobGridItem from '../../components/JobGridItem';
import { useAlert } from '../../context/AlertContext';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react-native';
import DashboardBottomNav from '../../components/admin/DashboardBottomNav';

import CustomSpinner from '../../components/CustomSpinner';
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

// Dynamic Glass Card Component
const GlassCard = ({ children, style, onPress, theme }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={[
            styles.glassCard,
            {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.cardBorder
            },
            style
        ]}>
            {children}
        </View>
    </TouchableOpacity>
);

export default function WorkerDashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme, isDark, prefersReducedMotion } = useTheme();
    const { showAlert } = useAlert();
    const { unreadCount } = useSocket();

    // State
    const [stats, setStats] = useState({
        activeJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        weeklyPerformance: [],
        distribution: []
    });
    const [activeJobs, setActiveJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('[Dashboard] Fetching jobs...');
            const jobs = await jobService.getMyJobs();
            console.log('[Dashboard] Jobs received:', jobs ? jobs.length : 0);

            console.log('[Dashboard] Fetching costs...');
            const costs = await costService.getMyCosts();
            console.log('[Dashboard] Costs received:', costs ? costs.length : 0);

            if (!jobs || jobs.length === 0) {
                console.warn('[Dashboard] No jobs returned from server');
            }

            const active = jobs ? jobs.filter(j => ['PENDING', 'IN_PROGRESS'].includes(j.status)) : [];
            const completed = jobs ? jobs.filter(j => j.status === 'COMPLETED') : [];

            const formattedActiveJobs = active.map(job => {
                const totalSteps = job.steps ? job.steps.length : 0;
                const completedSteps = job.steps ? job.steps.filter(s => s.isCompleted || s.status === 'COMPLETED').length : 0;
                const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                return {
                    ...job,
                    id: job.id,
                    title: job.title,
                    time: job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Açıklama yok',
                    status: job.status,
                    progress: progress,
                    priority: job.priority
                };
            });

            setActiveJobs(formattedActiveJobs);
            // Process Weekly Performance (Completed steps in last 7 days)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const performance = last7Days.map(date => {
                let count = 0;
                jobs.forEach(job => {
                    if (job.steps) {
                        job.steps.forEach(step => {
                            if (step.isCompleted && step.completedAt && step.completedAt.startsWith(date)) {
                                count++;
                            }
                        });
                    }
                });
                
                const dayName = new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' });
                return { 
                    value: count, 
                    label: dayName,
                    frontColor: theme.colors.primary,
                    topLabelComponent: () => (
                        <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>{count}</Text>
                    )
                };
            });

            // Process Distribution
            const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
            const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
            const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;
            const total = pendingCount + inProgressCount + completedCount;

            const distribution = [
                { value: pendingCount, color: '#f59e0b', text: 'Bekleyen', label: 'Bekleyen' },
                { value: inProgressCount, color: theme.colors.primary, text: 'Devam Eden', label: 'Devam Eden' },
                { value: completedCount, color: '#22c55e', text: 'Tamamlanan', label: 'Tamamlanan' }
            ].filter(d => d.value > 0);

            setStats({
                activeJobs: active.length,
                completedJobs: completed.length,
                totalEarnings: costs ? costs.reduce((sum, cost) => sum + (cost.amount || 0), 0) : 0,
                weeklyPerformance: performance,
                distribution: distribution
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const handleFilterChange = (filter) => {
        if (!prefersReducedMotion) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setActiveFilter(filter);
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [loadDashboardData])
    );

    const onRefresh = () => { setRefreshing(true); loadDashboardData(); };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                    <View style={styles.profileSection}>
                        <View style={[styles.profileImageContainer, { borderColor: theme.colors.primary, backgroundColor: theme.colors.card }]}>
                            <Text style={[styles.profileInitials, { color: theme.colors.primary }]}>{user?.name ? user.name.charAt(0).toUpperCase() : 'Ç'}</Text>
                        </View>
                        <View>
                            <Text style={[styles.greetingText, { color: isDark ? 'rgba(255,255,255,0.6)' : theme.colors.text }]}>Merhaba,</Text>
                            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name || 'Çalışan'}</Text>
                            <View style={[styles.roleContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
                                <Text style={[styles.roleText, { color: theme.colors.primary }]}>{user?.role || 'Bilinmiyor'}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerIcons}>
                        {/* THEME TOGGLE BUTTON */}
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}
                            onPress={toggleTheme}
                        >
                            <MaterialIcons name={isDark ? "light-mode" : "dark-mode"} size={24} color={theme.colors.icon} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]} onPress={() => navigation.navigate('Calendar')}>
                            <MaterialIcons name="calendar-today" size={24} color={theme.colors.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]} onPress={() => navigation.navigate('Notifications')}>
                            <MaterialIcons name="notifications-none" size={24} color={theme.colors.icon} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}
                            onPress={() => {
                                showAlert(
                                    'Çıkış Yap',
                                    'Çıkmak istediğinize emin misiniz?',
                                    [
                                        { text: 'İptal', style: 'cancel' },
                                        {
                                            text: 'Çıkış Yap',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await logout();
                                                } catch (error) {
                                                    console.error('Logout error:', error);
                                                }
                                            }
                                        }
                                    ],
                                    'question'
                                );
                            }}
                        >
                            <MaterialIcons name="logout" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.dateText, { color: isDark ? 'rgba(255,255,255,0.5)' : theme.colors.text }]}>
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
            </View>
        </View>
    );

    const getFilteredJobs = () => {
        if (activeFilter === 'ALL') return activeJobs;
        if (activeFilter === 'IN_PROGRESS') return activeJobs.filter(job => job.status === 'IN_PROGRESS');
        if (activeFilter === 'PENDING') return activeJobs.filter(job => job.status === 'PENDING');
        return activeJobs;
    };

    const renderActiveTasks = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Aktif Görevler</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
                    <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>Tümü</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {['ALL', 'PENDING', 'IN_PROGRESS'].map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterTab,
                            {
                                backgroundColor: activeFilter === filter ? theme.colors.tabActive : theme.colors.tab,
                                borderColor: theme.colors.cardBorder
                            }
                        ]}
                        onPress={() => handleFilterChange(filter)}
                    >
                        <Text style={[
                            styles.filterText,
                            {
                                color: activeFilter === filter ? (isDark ? '#000' : '#fff') : (isDark ? 'rgba(255,255,255,0.6)' : theme.colors.text),
                                fontWeight: activeFilter === filter ? 'bold' : '600'
                            }
                        ]}>
                            {filter === 'ALL' ? 'Tümü' : filter === 'PENDING' ? 'Bekleyen' : 'Devam Eden'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                numColumns={2}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} // Parent ScrollView handles scrolling
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}
                data={getFilteredJobs()}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <JobGridItem
                        job={item}
                        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
                    />
                )}
                ListEmptyComponent={
                    <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, width: '100%' }]}>
                        <View style={[styles.emptyStateIconContainer, { backgroundColor: theme.colors.card }]}>
                            <MaterialIcons
                                name={activeFilter === 'ALL' ? 'assignment' : activeFilter === 'PENDING' ? 'pending-actions' : 'hourglass-empty'}
                                size={32}
                                color={theme.colors.text}
                            />
                        </View>
                        <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                            {activeFilter === 'ALL' ? 'Aktif görev bulunmuyor' :
                                activeFilter === 'PENDING' ? 'Bekleyen görev yok' :
                                    'Devam eden görev yok'}
                        </Text>
                    </View>
                }
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={3}
                removeClippedSubviews={Platform.OS === 'android'}
            />
        </View>
    );

    return (
        <LinearGradient
            colors={theme.colors.gradient}
            start={theme.colors.gradientStart}
            end={theme.colors.gradientEnd}
            style={{ flex: 1, minHeight: 0 }}
        >
            <SafeAreaView style={{ flex: 1, minHeight: 0 }}>
                <StatusBar
                    barStyle={isDark ? "light-content" : "dark-content"}
                    backgroundColor="transparent"
                    translucent
                />

                {/* Hero Circle Effect for Light Mode */}
                {!isDark && (
                    <View style={styles.heroCircleContainer}>
                        {/* Optional decorative circles can go here if needed to match HTML exactly */}
                    </View>
                )}

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                >
                    {loading && !refreshing ? (
                        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                            <CustomSpinner size="large" color={theme.colors.primary} />
                        </View>
                    ) : (
                        <>
                            {renderHeader()}
                            
                            {/* Performance Charts Section */}
                            <View style={styles.sectionContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Haftalık Performans</Text>
                                <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                                    {stats.weeklyPerformance.length > 0 ? (
                                        <BarChart
                                            data={stats.weeklyPerformance}
                                            width={width - 80}
                                            height={180}
                                            barWidth={24}
                                            spacing={12}
                                            noOfSections={3}
                                            barBorderRadius={6}
                                            hideRules
                                            xAxisThickness={0}
                                            yAxisThickness={0}
                                            yAxisTextStyle={{ color: theme.colors.subText, fontSize: 10 }}
                                            xAxisLabelTextStyle={{ color: theme.colors.subText, fontSize: 10 }}
                                            showGradient
                                            isAnimated
                                        />
                                    ) : (
                                        <View style={styles.emptyChart}>
                                            <TrendingUp size={40} color={theme.colors.subText} style={{ opacity: 0.4 }} />
                                            <Text style={{ color: theme.colors.subText, marginTop: 8 }}>Veri yok</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.sectionContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Görev Dağılımı</Text>
                                <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }]}>
                                    {stats.distribution.length > 0 ? (
                                        <>
                                            <PieChart
                                                data={stats.distribution}
                                                radius={60}
                                                innerRadius={40}
                                                showText
                                                textColor="white"
                                                textSize={10}
                                                focusOnPress
                                            />
                                            <View style={{ gap: 8 }}>
                                                {stats.distribution.map((item, i) => (
                                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                                                        <Text style={{ color: theme.colors.text, fontSize: 12 }}>{item.label}: {item.value}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    ) : (
                                        <View style={styles.emptyChart}>
                                            <PieIcon size={40} color={theme.colors.subText} style={{ opacity: 0.4 }} />
                                            <Text style={{ color: theme.colors.subText, marginTop: 8 }}>Veri yok</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {renderActiveTasks()}

                            <View style={styles.sectionContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>İstatistikler</Text>
                                <View style={styles.statsGrid}>
                                    <StatCard label="Aktif İşler" value={stats.activeJobs} icon="assignment" style={{ flex: 1 }} />
                                    <StatCard label="Tamamlanan" value={stats.completedJobs} icon="check-circle" iconColor="#22c55e" style={{ flex: 1 }} />
                                </View>
                            </View>

                            <View style={styles.sectionContainer}>
                                <GlassCard
                                    style={styles.costCard}
                                    onPress={() => navigation.navigate('ExpenseManagement')}
                                    theme={theme}
                                >
                                    <View style={styles.costHeader}>
                                        <View>
                                            <Text style={[styles.costTitle, { color: theme.colors.text }]}>Masraflar</Text>
                                            <Text style={[styles.costAmount, { color: theme.colors.text }]}>₺{stats.totalEarnings.toLocaleString()}</Text>
                                        </View>
                                        <View style={[styles.costIconCircle, { backgroundColor: theme.colors.cardBorder }]}>
                                            <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.text} />
                                        </View>
                                    </View>
                                    <View style={styles.costTrend}>
                                        <View style={styles.trendPill}>
                                            <MaterialIcons name="trending-up" size={16} color="#10B981" />
                                            <Text style={styles.trendText}>+12%</Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={24} color={theme.colors.text} />
                                    </View>
                                </GlassCard>
                            </View>

                            <View style={{ height: 80 }} />
                        </>
                    )}
                </ScrollView>
                <LoadingOverlay 
                    visible={loading && !refreshing} 
                    theme={theme}
                />
                <DashboardBottomNav navigation={navigation} activeTab="Dashboard" />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 40 },
    header: { marginBottom: 24, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
    headerContent: {},
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    profileSection: { flexDirection: 'row', alignItems: 'center' },
    profileImageContainer: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    profileInitials: { fontSize: 20, fontWeight: 'bold' },
    greetingText: { fontSize: 13, marginBottom: 2 },
    userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    roleContainer: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
    roleText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    headerIcons: { flexDirection: 'row', gap: 12 },
    iconButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    notificationBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#fff' },
    dateText: { fontSize: 13, marginTop: 4, fontWeight: '500' },
    sectionContainer: { marginBottom: 28, paddingHorizontal: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
    viewAllText: { fontSize: 13, fontWeight: '600' },
    filterContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    filterText: { fontSize: 13, fontWeight: '600' },
    tasksScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
    statsGrid: { flexDirection: 'row', gap: 12 },
    glassCard: { padding: 24, borderRadius: 24, borderWidth: 1, minHeight: 160, justifyContent: 'space-between' },
    costCard: { minHeight: 160 },
    costHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    costTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    costAmount: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    costIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    costTrend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    trendPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    trendText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
    emptyStateContainer: { width: width * 0.75, height: 160, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
    emptyStateIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    emptyStateText: { fontSize: 14, fontWeight: '500' },
    heroCircleContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden' }, // Placeholder for HTML circle decorations
    tasksList: {
        gap: 16,
    },
    taskCard: {
        padding: 0, // Reset padding for custom layout
        borderRadius: 22,
        marginBottom: 8,
    },
    leftBorderStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        zIndex: 1,
    },
    taskCardContent: {
        flexDirection: 'row',
        padding: 16,
        paddingLeft: 20, // Account for border strip
        alignItems: 'center',
        gap: 16,
    },
    taskIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    taskMeta: {
        fontSize: 13,
        marginBottom: 12,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatarGroup: {
        flexDirection: 'row',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    teamName: {
        fontSize: 11,
        fontWeight: '500',
    },
    labelSmall: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    bigAmount: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    costFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    labelTiny: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    amountSmall: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    smallButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    chartCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    emptyChart: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    }
});