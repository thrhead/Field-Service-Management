import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { LayoutGrid, Users, Plus, ListTodo, UserCircle, Banknote, Bell, Calendar } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const DashboardBottomNav = ({ navigation, activeTab = 'Dashboard' }) => {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [focusedTab, setFocusedTab] = useState(null);

    const role = user?.role?.toUpperCase() || 'WORKER';

    // Scale animation refs for each item
    const animatedValues = {
        Dashboard: useRef(new Animated.Value(activeTab === 'Dashboard' ? 1.2 : 1)).current,
        TeamManagement: useRef(new Animated.Value(activeTab === 'TeamManagement' ? 1.2 : 1)).current,
        Jobs: useRef(new Animated.Value(activeTab === 'Jobs' ? 1.2 : 1)).current,
        Expense: useRef(new Animated.Value(activeTab === 'Expense' || activeTab === 'ExpenseManagement' ? 1.2 : 1)).current,
        Notifications: useRef(new Animated.Value(activeTab === 'Notifications' ? 1.2 : 1)).current,
        Calendar: useRef(new Animated.Value(activeTab === 'Calendar' ? 1.2 : 1)).current,
        Profile: useRef(new Animated.Value(activeTab === 'Profile' ? 1.2 : 1)).current,
    };

    useEffect(() => {
        // Animate the active tab scale
        Object.keys(animatedValues).forEach(tab => {
            Animated.spring(animatedValues[tab], {
                toValue: (activeTab === tab || (tab === 'Expense' && activeTab === 'ExpenseManagement')) ? 1.2 : 1,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();
        });
    }, [activeTab]);

    const getDashboardRoute = () => {
        switch (role) {
            case 'ADMIN': return 'AdminDashboard';
            case 'MANAGER': return 'ManagerDashboard';
            case 'CUSTOMER': return 'CustomerDashboard';
            case 'WORKER':
            case 'TEAM_LEAD':
            default:
                return 'WorkerDashboard';
        }
    };

    const getNavItems = () => {
        const homeRoute = getDashboardRoute();

        if (role === 'ADMIN') {
            return [
                { id: 'Dashboard', title: t('navigation.home'), icon: LayoutGrid, route: homeRoute },
                { id: 'TeamManagement', title: t('navigation.teams'), icon: Users, route: 'TeamManagement' },
                { id: 'QuickAdd', title: '', icon: Plus, route: 'CreateJob', isCenter: true },
                { id: 'Jobs', title: t('navigation.jobs'), icon: ListTodo, route: 'Jobs' },
                { id: 'Profile', title: t('navigation.profile'), icon: UserCircle, route: 'Profile' },
            ];
        }

        if (role === 'MANAGER') {
            return [
                { id: 'Dashboard', title: t('navigation.home'), icon: LayoutGrid, route: homeRoute },
                { id: 'TeamManagement', title: t('navigation.teams'), icon: Users, route: 'TeamList' },
                { id: 'QuickAdd', title: '', icon: Plus, route: 'CreateJob', isCenter: true },
                { id: 'Jobs', title: t('navigation.jobs'), icon: ListTodo, route: 'Jobs' },
                { id: 'Profile', title: t('navigation.profile'), icon: UserCircle, route: 'Profile' },
            ];
        }

        if (role === 'CUSTOMER') {
            return [
                { id: 'Dashboard', title: t('navigation.home'), icon: LayoutGrid, route: homeRoute },
                { id: 'Jobs', title: t('navigation.jobs'), icon: ListTodo, route: 'Jobs' },
                { id: 'NotificationsCenter', title: '', icon: Bell, route: 'Notifications', isCenter: true },
                { id: 'Calendar', title: t('navigation.calendar') || 'Takvim', icon: Calendar, route: 'Calendar' },
                { id: 'Profile', title: t('navigation.profile'), icon: UserCircle, route: 'Profile' },
            ];
        }

        // WORKER / TEAM_LEAD / Default
        return [
            { id: 'Dashboard', title: t('navigation.home'), icon: LayoutGrid, route: homeRoute },
            { id: 'Jobs', title: t('navigation.jobs'), icon: ListTodo, route: 'Jobs' },
            { id: 'QuickExpense', title: '', icon: Banknote, route: 'ExpenseManagement', isCenter: true },
            { id: 'Notifications', title: t('navigation.notifications') || 'Bildirimler', icon: Bell, route: 'Notifications' },
            { id: 'Profile', title: t('navigation.profile'), icon: UserCircle, route: 'Profile' },
        ];
    };

    const navItems = getNavItems();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.card,
                borderTopColor: theme.colors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: isDark ? 0.4 : 0.12,
                shadowRadius: 16,
                elevation: 24
            }
        ]}>
            <View style={styles.navInner}>
                {navItems.map((item) => {
                    if (item.isCenter) {
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.centerButton, 
                                    { backgroundColor: theme.colors.primary },
                                    focusedTab === item.id && {
                                        borderColor: theme.colors.textInverse || '#fff',
                                        borderWidth: 2,
                                        transform: [{ scale: 1.1 }]
                                    }
                                ]}
                                onPress={() => navigation.navigate(item.route)}
                                activeOpacity={0.8}
                                onFocus={() => setFocusedTab(item.id)}
                                onBlur={() => setFocusedTab(null)}
                                accessibilityRole="button"
                                accessibilityLabel="Quick Add Job"
                            >
                                <item.icon size={32} color={isDark ? '#000' : '#fff'} />
                            </TouchableOpacity>
                        );
                    }

                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    const isFocused = focusedTab === item.id;

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.navItem,
                                isFocused && {
                                    backgroundColor: theme.colors.primary + '15', // 15 = ~8% opacity
                                    borderRadius: 8
                                }
                            ]}
                            onPress={() => item.route && navigation.navigate(item.route)}
                            activeOpacity={0.6}
                            onFocus={() => setFocusedTab(item.id)}
                            onBlur={() => setFocusedTab(null)}
                            accessibilityRole="button"
                            accessibilityLabel={item.title}
                        >
                            <Animated.View style={{ transform: [{ scale: animatedValues[item.id] || 1 }] }}>
                                <Icon
                                    size={24}
                                    color={isActive ? theme.colors.primary : theme.colors.subText}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </Animated.View>
                            <Text style={[
                                styles.navText,
                                {
                                    color: isActive ? theme.colors.primary : theme.colors.subText,
                                    fontWeight: isActive ? '700' : '500',
                                    fontSize: isActive ? 10.5 : 10
                                }
                            ]}>
                                {item.title}
                            </Text>
                            {isActive && (
                                <Animated.View
                                    style={[
                                        styles.activeIndicator,
                                        {
                                            backgroundColor: theme.colors.primary,
                                            width: 16,
                                            height: 3,
                                            borderRadius: 1.5,
                                            marginTop: 6
                                        }
                                    ]}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 95 : 85,
        borderTopWidth: 1,
    },
    navInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === 'ios' ? 25 : 5,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingTop: 12,
    },
    centerButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginTop: -45, // Enhanced floating effect
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'transparent',
    },
    navText: {
        marginTop: 5,
    },
    activeIndicator: {
        // Styled inside render for animation/logic
    }
});

export default DashboardBottomNav;
