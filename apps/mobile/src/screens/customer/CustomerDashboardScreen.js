import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
    Platform,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import jobService from '../../services/job.service';
import CustomSpinner from '../../components/CustomSpinner';
import JobGridItem from '../../components/JobGridItem';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import DashboardBottomNav from '../../components/admin/DashboardBottomNav';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width } = Dimensions.get('window');

// Dynamic Glass Card Component
const GlassCard = ({ children, style, onPress, theme }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} disabled={!onPress}>
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

export default function CustomerDashboardScreen({ navigation }) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { t } = useTranslation();

    const [stats, setStats] = useState({
        totalJobs: 0,
        pendingJobs: 0,
        inProgressJobs: 0,
        completedJobs: 0,
        completionRate: 0
    });
    
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await jobService.getCustomerJobs();
            
            if (response && response.stats) {
                setStats(response.stats);
            }
            if (response && response.jobs) {
                setJobs(response.jobs);
            }
        } catch (error) {
            console.error('[CustomerDashboard] Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [loadDashboardData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <CustomSpinner size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const activeJobs = jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'ACCEPTED');
    const recentCompleted = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'ACCEPTED').slice(0, 3);

    const pieData = [
        { value: stats.pendingJobs || 0, color: theme.colors.tertiary, text: stats.pendingJobs.toString() },
        { value: stats.inProgressJobs || 0, color: theme.colors.warning, text: stats.inProgressJobs.toString() },
        { value: stats.completedJobs || 0, color: theme.colors.success, text: stats.completedJobs.toString() }
    ];

    const hasNoData = pieData.every(item => item.value === 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.greeting, { color: theme.colors.subText }]}>
                            {t('common.welcome', 'Hoş Geldiniz')}
                        </Text>
                        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                            {user?.name || t('customer.title', 'Müşteri')}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                                {(user?.name || 'C').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Hero Summary Card */}
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroContent}>
                        <View style={styles.heroStats}>
                            <Text style={styles.heroLabel}>{t('jobs.status.COMPLETED', 'Tamamlanan')} / {t('jobs.total', 'Toplam İş')}</Text>
                            <Text style={styles.heroValue}>{stats.completedJobs} / {stats.totalJobs}</Text>
                        </View>
                        
                        <View style={styles.chartContainer}>
                            {!hasNoData ? (
                                <PieChart
                                    data={pieData}
                                    donut
                                    showText
                                    textColor="white"
                                    radius={40}
                                    innerRadius={25}
                                    textSize={12}
                                    backgroundColor="transparent"
                                />
                            ) : (
                                <View style={[styles.emptyChart, { borderColor: 'rgba(255,255,255,0.3)' }]}>
                                    <Text style={styles.emptyChartText}>0</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    
                    <View style={styles.heroFooter}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.tertiary }]} />
                            <Text style={styles.legendText}>{t('jobs.status.PENDING', 'Bekliyor')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                            <Text style={styles.legendText}>{t('jobs.status.IN_PROGRESS', 'Devam Ediyor')}</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                            <Text style={styles.legendText}>{t('jobs.status.COMPLETED', 'Tamamlandı')}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <GlassCard theme={theme} style={styles.actionCard} onPress={() => navigation.navigate('Jobs', { filter: 'IN_PROGRESS' })}>
                        <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                            <MaterialIcons name="sync" size={24} color={theme.colors.warning} />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>{t('jobs.status.IN_PROGRESS', 'Devam Ediyor')}</Text>
                        <Text style={[styles.actionBadge, { color: theme.colors.subText }]}>{stats.inProgressJobs}</Text>
                    </GlassCard>

                    <GlassCard theme={theme} style={styles.actionCard} onPress={() => navigation.navigate('Jobs', { filter: 'COMPLETED' })}>
                        <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                            <MaterialIcons name="check-circle" size={24} color={theme.colors.success} />
                        </View>
                        <Text style={[styles.actionText, { color: theme.colors.text }]}>{t('jobs.status.COMPLETED', 'Tamamlandı')}</Text>
                        <Text style={[styles.actionBadge, { color: theme.colors.subText }]}>{stats.completedJobs}</Text>
                    </GlassCard>
                </View>

                {/* Active Jobs Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('navigation.jobs', 'İşlerim')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
                        <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>{t('common.seeAll', 'Tümünü Gör')}</Text>
                    </TouchableOpacity>
                </View>

                {activeJobs.length > 0 ? (
                    <View style={styles.jobsGrid}>
                        {activeJobs.map((job) => (
                            <View key={job.id} style={styles.jobGridContainer}>
                                <JobGridItem
                                    job={job}
                                    onPress={() => navigation.navigate('JobDetail', { jobId: job.id, role: 'CUSTOMER', isCustomer: true })}
                                    theme={theme}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    <GlassCard theme={theme} style={styles.emptyStateCard}>
                        <MaterialIcons name="work-outline" size={48} color={theme.colors.subText} />
                        <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>{t('common.noData', 'Veri Bulunamadı')}</Text>
                        <Text style={[styles.emptyStateSub, { color: theme.colors.subText }]}>Mevcut devam eden işiniz bulunmamaktadır.</Text>
                    </GlassCard>
                )}

            </ScrollView>
            <DashboardBottomNav navigation={navigation} activeTab="Dashboard" />
        </SafeAreaView>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    greeting: {
        fontSize: 14,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    heroCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroStats: {
        flex: 1,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    heroValue: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: 'bold',
    },
    chartContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyChart: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyChartText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    heroFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 12,
    },
    glassCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    actionCard: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    actionBadge: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    jobsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -4,
    },
    jobGridContainer: {
        width: '50%',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    emptyStateCard: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSub: {
        fontSize: 14,
        textAlign: 'center',
    }
});

