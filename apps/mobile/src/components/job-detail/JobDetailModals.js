import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    KeyboardAvoidingView, 
    TouchableWithoutFeedback, 
    Keyboard, 
    Platform,
    Image,
    Modal as RNModal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SuccessModal from '../SuccessModal';
import ConfirmationModal from '../ConfirmationModal';
import { CreateExpenseModal } from '../worker/expense/CreateExpenseModal';
import SignaturePad from '../SignaturePad';
import { getValidImageUrl } from '../../utils';

// Helper for Web/Mobile Modal
const AppModal = ({ visible, children, transparent = true, animationType = 'fade', onRequestClose }) => {
    if (Platform.OS === 'web') {
        if (!visible) return null;
        return (
            <View style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                {children}
            </View>
        );
    }
    return (
        <RNModal visible={visible} transparent={transparent} animationType={animationType} onRequestClose={onRequestClose}>
            {children}
        </RNModal>
    );
};

const JobDetailModals = ({
    theme,
    t,
    user,
    jobId,
    modalVisible,
    setModalVisible,
    selectedImage,
    handleDeletePhoto,
    rejectionModalVisible,
    setRejectionModalVisible,
    rejectionType,
    rejectionReason,
    setRejectionReason,
    handleRejectStep,
    handleRejectSubstep,
    handleRejectJob,
    successModalVisible,
    setSuccessModalVisible,
    successMessage,
    choiceModalVisible,
    setChoiceModalVisible,
    setSignatureModalVisible,
    setConfirmationModalVisible,
    setJob,
    confirmationModalVisible,
    handleConfirmComplete,
    costModalVisible,
    setCostModalVisible,
    createExpense,
    signatureModalVisible,
    handleSaveSignature
}) => {
    const userRole = (user?.role || user?.user?.role)?.toUpperCase();
    const isCustomer = userRole === 'CUSTOMER';

    return (
        <>
            {/* Image Preview Modal */}
            <AppModal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: 'black' }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <MaterialIcons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image
                            source={{ uri: getValidImageUrl(selectedImage.url || selectedImage) }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    <View style={styles.modalFooter}>
                        {selectedImage?.id && !isCustomer && (
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
                                onPress={() => handleDeletePhoto(selectedImage)}
                            >
                                <MaterialIcons name="delete" size={24} color="#fff" />
                                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </AppModal>

            {/* Rejection Modal */}
            <AppModal visible={rejectionModalVisible} animationType="slide" onRequestClose={() => setRejectionModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                {rejectionType === 'JOB' ? t('alerts.rejectJob') :
                                    rejectionType === 'STEP' ? t('alerts.rejectStep') : t('alerts.rejectSubstep')}
                            </Text>
                            
                            <Text style={[styles.inputLabel, { color: theme.colors.subText }]}>{t('worker.rejectionReason')}</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={rejectionReason}
                                onChangeText={setRejectionReason}
                                multiline
                                numberOfLines={4}
                                placeholder={t('alerts.rejectionReasonRequired')}
                                placeholderTextColor={theme.colors.subText}
                            />
                            
                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.cancelButton]} 
                                    onPress={() => setRejectionModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                                    onPress={() => {
                                        if (rejectionType === 'STEP') handleRejectStep();
                                        else if (rejectionType === 'SUBSTEP') handleRejectSubstep();
                                        else handleRejectJob();
                                    }}
                                >
                                    <Text style={styles.submitButtonText}>{t('alerts.rejectAndSendBack')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </AppModal>

            {/* Success Modal */}
            <SuccessModal 
                visible={successModalVisible} 
                message={successMessage} 
                onClose={() => setSuccessModalVisible(false)} 
            />

            {/* Choice Modal (Finish Job options) */}
            <AppModal visible={choiceModalVisible} animationType="slide" onRequestClose={() => setChoiceModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('alerts.finishJob')}</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.colors.subText }]}>
                            {t('alerts.signaturePrompt')}
                        </Text>
                        
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.colors.primary, paddingVertical: 16 }]}
                                onPress={() => {
                                    setChoiceModalVisible(false);
                                    setSignatureModalVisible(true);
                                }}
                            >
                                <Text style={styles.submitButtonText}>{t('alerts.takeSignature')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.colors.secondary, paddingVertical: 16 }]}
                                onPress={() => {
                                    setChoiceModalVisible(false);
                                    setJob(prev => ({ ...prev, signature: null, signatureCoords: null }));
                                    setConfirmationModalVisible(true);
                                }}
                            >
                                <Text style={styles.submitButtonText}>{t('alerts.finishWithoutSignature')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, { paddingVertical: 16 }]}
                                onPress={() => setChoiceModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('alerts.cancelAction')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </AppModal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmationModalVisible}
                title={t('alerts.finishJob')}
                message={t('alerts.completeJobMessage')}
                onConfirm={handleConfirmComplete}
                onCancel={() => setConfirmationModalVisible(false)}
                confirmText={t('alerts.yesFinish')}
                cancelText={t('alerts.cancelAction')}
                theme={theme}
            />

            {/* Expense Modal */}
            <CreateExpenseModal
                visible={costModalVisible}
                onClose={() => setCostModalVisible(false)}
                onSubmit={(formData, receiptImage, audioUri, id) => {
                    // Update expense is not fully supported in job detail context yet, fallback to create
                    return createExpense(formData, receiptImage, audioUri);
                }}
                projects={null}
                defaultJobId={jobId}
                theme={theme}
            />

            {/* Signature Pad */}
            <SignaturePad
                visible={signatureModalVisible}
                theme={theme}
                onSave={handleSaveSignature}
                onCancel={() => setSignatureModalVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    fullImage: {
        width: '100%',
        height: '70%',
    },
    modalFooter: {
        padding: 20,
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
    },
    cancelButtonText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 15,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});

export default JobDetailModals;
