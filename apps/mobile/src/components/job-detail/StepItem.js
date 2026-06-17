import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getValidImageUrl } from '../../utils';

const StepItem = ({ 
    step, 
    index, 
    job, 
    theme, 
    user, 
    t, 
    formatDate, 
    handleToggleStep, 
    openImageModal, 
    renderPhotoItem,
    handleApproveStep,
    setRejectionType,
    setSelectedStepId,
    setRejectionModalVisible,
    pickImage,
    children 
}) => {
    const isLocked = index > 0 && !job.steps[index - 1].isCompleted;
    const isCompleted = step.isCompleted;
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const isCustomer = user?.role?.toUpperCase() === 'CUSTOMER';
    const isManager = ['ADMIN', 'MANAGER'].includes(user?.role?.toUpperCase());

    const getStatusColor = () => {
        if (step.approvalStatus === 'APPROVED' || job.status === 'ACCEPTED') return theme.colors.success || '#10B981';
        if (step.approvalStatus === 'REJECTED') return theme.colors.error || '#EF4444';
        return theme.colors.warning || '#F59E0B';
    };

    const getStatusText = () => {
        if (step.approvalStatus === 'APPROVED' || job.status === 'ACCEPTED') return t('common.approved') || 'ONAYLANDI';
        if (step.approvalStatus === 'REJECTED') return t('common.rejected') || 'REDDEDİLDİ';
        
        if (isCustomer) {
            if (job.status === 'COMPLETED') return t('common.pendingCustomerApproval');
            if (job.status === 'PENDING_APPROVAL') return t('common.pendingApproval');
        }
        
        return t('common.pendingApproval') || 'ONAY BEKLİYOR';
    };

    return (
        <View style={[
            styles.stepCard, 
            { backgroundColor: theme.colors.card || '#FFFFFF', borderColor: theme.colors.border || '#E5E7EB' },
            isLocked && styles.lockedCard
        ]}>
            <View style={styles.stepHeader}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[
                        styles.checkbox, 
                        { borderColor: theme.colors.primary },
                        isCompleted && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => handleToggleStep(step.id, isCompleted)}
                    disabled={isLocked || isAdmin || isCustomer}
                >
                    {isCompleted && <MaterialIcons name="check" size={20} color="#FFFFFF" />}
                </TouchableOpacity>
                
                <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            {step.stepNo && (
                                <View style={[styles.stepNoBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                                    <Text style={[styles.stepNoText, { color: theme.colors.primary }]}>
                                        {step.stepNo}
                                    </Text>
                                </View>
                            )}
                            <Text style={[
                                styles.stepTitle, 
                                isCompleted && styles.completedText, 
                                { color: theme.colors.text }
                            ]}>
                                {step.title || step.name}
                            </Text>
                        </View>
                        
                        {isCompleted && (
                            <View style={[styles.badge, { backgroundColor: getStatusColor() + '15' }]}>
                                <Text style={[styles.badgeText, { color: getStatusColor() }]}>{getStatusText()}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.datesContainer}>
                        {step.startedAt && (
                            <Text style={[styles.dateText, { color: theme.colors.subText }]}>
                                <MaterialIcons name="play-circle-outline" size={14} /> {t('worker.started')}: {formatDate(step.startedAt)}
                            </Text>
                        )}
                        
                        {step.completedAt && (
                            <View>
                                <Text style={[styles.dateText, { color: theme.colors.subText, marginTop: 4 }]}>
                                    <MaterialIcons name="check-circle-outline" size={14} /> {t('worker.finished')}: {formatDate(step.completedAt)}
                                </Text>
                                {(step.latitude && step.longitude) && (
                                    <View style={styles.metadataTag}>
                                        <MaterialIcons name="location-pin" size={14} color={theme.colors.subText} />
                                        <Text style={[styles.metadataText, { color: theme.colors.subText }]}>
                                            {step.latitude.toFixed(4)}, {step.longitude.toFixed(4)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Photos */}
            <View style={styles.photoContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }}>Genel Fotoğraflar</Text>
                    {!isAdmin && !isCustomer && (
                        <TouchableOpacity
                            style={{ padding: 4 }}
                            onPress={() => pickImage(step.id, null)}
                        >
                            <MaterialIcons name="add-a-photo" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
                {step.photos && step.photos.length > 0 ? (
                    <FlatList
                        data={step.photos}
                        renderItem={renderPhotoItem}
                        keyExtractor={(p, i) => i.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 4 }}
                    />
                ) : (
                    <Text style={{ fontSize: 13, color: theme.colors.subText, fontStyle: 'italic' }}>Henüz fotoğraf yüklenmemiş.</Text>
                )}
            </View>

            {/* Rejection */}
            {step.approvalStatus === 'REJECTED' && step.rejectionReason && (
                <View style={[styles.rejectionContainer, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]}>
                    <MaterialIcons name="error-outline" size={18} color={theme.colors.error} style={{ marginTop: 2 }} />
                    <Text style={[styles.rejectionReasonText, { color: theme.colors.error }]}>
                        {step.rejectionReason}
                    </Text>
                </View>
            )}

            {/* Manager Actions */}
            {isManager && isCompleted && step.approvalStatus === 'PENDING' && (
                <View style={styles.managerActionRow}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.managerButton, { backgroundColor: theme.colors.error + '15' }]}
                        onPress={() => {
                            setSelectedStepId(step.id);
                            setRejectionType('STEP');
                            setRejectionModalVisible(true);
                        }}
                    >
                        <MaterialIcons name="close" size={20} color={theme.colors.error} />
                        <Text style={[styles.managerButtonText, { color: theme.colors.error }]}>{t('common.reject') || 'Reddet'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.managerButton, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleApproveStep(step.id)}
                    >
                        <MaterialIcons name="check" size={20} color="#fff" />
                        <Text style={[styles.managerButtonText, { color: '#fff' }]}>{t('common.approve') || 'Onayla'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Substeps Area (Timeline style) */}
            {!isLocked && step.subSteps && step.subSteps.length > 0 && (
                <View style={styles.substepsWrapper}>
                    {/* Vertical line connecting substeps */}
                    <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.substepsContainer}>
                        {children}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    stepCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    lockedCard: {
        opacity: 0.45,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2.5,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    stepNoBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 10,
    },
    stepNoText: {
        fontSize: 13,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    stepTitle: {
        fontSize: 17,
        fontWeight: '700',
        flexShrink: 1,
        lineHeight: 24,
    },
    completedText: {
        opacity: 0.5,
        textDecorationLine: 'line-through',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    datesContainer: {
        marginTop: 4,
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '500',
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    metadataText: {
        fontSize: 13,
        marginLeft: 6,
        fontWeight: '500',
    },
    photoContainer: {
        marginTop: 20,
        marginBottom: 4,
        paddingLeft: 48, // align with text
    },
    rejectionContainer: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: 48, // align with text
        gap: 10,
    },
    rejectionReasonText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        lineHeight: 20,
    },
    managerActionRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 20,
        paddingLeft: 48, // align with text
    },
    managerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        minHeight: 48,
    },
    managerButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    substepsWrapper: {
        marginTop: 24,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 15, // center of checkbox
        top: 0,
        bottom: 20,
        width: 2,
        borderRadius: 1,
    },
    substepsContainer: {
        paddingLeft: 48,
    },
});

export default StepItem;