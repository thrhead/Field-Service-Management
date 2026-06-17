import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SubStepItem = ({ 
    substep, 
    subIndex, 
    step, 
    job,
    theme, 
    user, 
    t, 
    handleSubstepToggle, 
    pickImage, 
    renderPhotoItem,
    handleApproveSubstep,
    setSelectedSubstepId,
    setRejectionType,
    setRejectionModalVisible
}) => {
    const isSubstepLocked = subIndex > 0 && !step.subSteps[subIndex - 1].isCompleted;
    const isCompleted = substep.isCompleted;
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const isCustomer = user?.role?.toUpperCase() === 'CUSTOMER';
    const isManager = ['ADMIN', 'MANAGER'].includes(user?.role?.toUpperCase());

    const getStatusColor = () => {
        if (substep.approvalStatus === 'APPROVED' || (job && job.status === 'ACCEPTED')) return theme.colors.success || '#10B981';
        if (substep.approvalStatus === 'REJECTED') return theme.colors.error || '#EF4444';
        return theme.colors.warning || '#F59E0B';
    };

    const getStatusText = () => {
        if (substep.approvalStatus === 'APPROVED' || (job && job.status === 'ACCEPTED')) return t('common.approved');
        if (substep.approvalStatus === 'REJECTED') return t('common.rejected');
        
        if (isCustomer && job) {
            if (job.status === 'COMPLETED') return t('common.pendingCustomerApproval');
            if (job.status === 'PENDING_APPROVAL') return t('common.pendingApproval');
        }
        
        return t('common.pendingApproval');
    };

    return (
        <View style={[
            styles.substepWrapper, 
            { backgroundColor: theme.colors.surface || '#F9FAFB', borderColor: theme.colors.border || '#E5E7EB' },
            isSubstepLocked && styles.lockedCard
        ]}>
            <View style={styles.substepRow}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[
                        styles.checkbox, 
                        { borderColor: theme.colors.primary },
                        isCompleted && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => handleSubstepToggle(step.id, substep.id, isCompleted)}
                    disabled={isSubstepLocked || isAdmin || isCustomer}
                >
                    {isCompleted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.substepInfo}>
                    <View style={styles.titleRow}>
                        <Text style={[
                            styles.substepTitle, 
                            isCompleted && styles.completedText, 
                            { color: theme.colors.text }
                        ]}>
                            {substep.title || substep.name}
                        </Text>
                        
                        <View style={styles.actionRow}>
                            {isCompleted && (
                                <View style={[styles.badge, { backgroundColor: getStatusColor() + '15' }]}>
                                    <Text style={[styles.badgeText, { color: getStatusColor() }]}>{getStatusText()}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Camera Action Row - More user friendly */}
                    {!isSubstepLocked && !isCompleted && !isAdmin && !isCustomer && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => pickImage(step.id, substep.id, 'camera')}
                            style={[styles.addPhotoButton, { backgroundColor: theme.colors.primary + '10' }]}
                        >
                            <MaterialIcons name="add-a-photo" size={22} color={theme.colors.primary} />
                            <Text style={[styles.addPhotoText, { color: theme.colors.primary }]}>{t('common.addPhoto')}</Text>
                        </TouchableOpacity>
                    )}

                    {substep.photos && substep.photos.length > 0 && (
                        <View style={styles.photoContainer}>
                            <FlatList
                                data={substep.photos}
                                renderItem={renderPhotoItem}
                                keyExtractor={(p, i) => i.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 4 }}
                            />
                        </View>
                    )}

                    {substep.approvalStatus === 'REJECTED' && substep.rejectionReason && (
                        <View style={[styles.rejectionContainer, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]}>
                            <MaterialIcons name="error-outline" size={16} color={theme.colors.error} style={{ marginTop: 1 }} />
                            <Text style={[styles.rejectionReasonText, { color: theme.colors.error }]}>
                                {substep.rejectionReason}
                            </Text>
                        </View>
                    )}

                    {/* Manager Actions */}
                    {isManager && isCompleted && substep.approvalStatus === 'PENDING' && (
                        <View style={styles.managerActionRow}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.managerButton, { backgroundColor: theme.colors.error + '15' }]}
                                onPress={() => {
                                    setSelectedSubstepId(substep.id);
                                    setRejectionType('SUBSTEP');
                                    setRejectionModalVisible(true);
                                }}
                            >
                                <MaterialIcons name="close" size={18} color={theme.colors.error} />
                                <Text style={[styles.managerButtonText, { color: theme.colors.error }]}>{t('common.reject')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.managerButton, { backgroundColor: theme.colors.success }]}
                                onPress={() => handleApproveSubstep(substep.id)}
                            >
                                <MaterialIcons name="check" size={18} color="#fff" />
                                <Text style={[styles.managerButtonText, { color: '#fff' }]}>{t('common.approve')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    substepWrapper: {
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    lockedCard: {
        opacity: 0.45,
    },
    substepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2.5,
        marginRight: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
    },
    substepInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    substepTitle: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        lineHeight: 22,
    },
    completedText: {
        opacity: 0.5,
        textDecorationLine: 'line-through',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    addPhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
        minHeight: 48,
    },
    addPhotoText: {
        fontSize: 15,
        fontWeight: '700',
    },
    photoContainer: {
        marginTop: 12,
    },
    rejectionContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    rejectionReasonText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        lineHeight: 18,
    },
    managerActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    managerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
        minHeight: 48,
    },
    managerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default SubStepItem;