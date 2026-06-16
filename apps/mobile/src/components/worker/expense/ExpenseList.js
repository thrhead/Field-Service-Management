import React, { useState, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';
import { CATEGORIES } from './ExpenseFilter';
import { Swipeable } from 'react-native-gesture-handler';

export const ExpenseList = ({ groupedExpenses, filteredExpensesCount, theme, onEdit, onDelete }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const swipeableRefs = useRef({});

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return theme.colors.success;
            case 'PENDING': return theme.colors.warning;
            case 'REJECTED': return theme.colors.error;
            default: return theme.colors.subText;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'APPROVED': return 'Onaylandı';
            case 'PENDING': return 'Bekliyor';
            case 'REJECTED': return 'Reddedildi';
            default: return '';
        }
    };

    const getCategoryIcon = (category) => {
        const cat = CATEGORIES.find(c => c.id === category);
        return cat ? cat.icon : 'attach-money';
    };

    const renderRightActions = (expense) => {
        if (expense.status !== 'PENDING') return null;

        return (
            <View style={styles.swipeActions}>
                {onEdit && (
                    <TouchableOpacity 
                        style={[styles.swipeButton, { backgroundColor: theme.colors.primary }]} 
                        onPress={() => {
                            swipeableRefs.current[expense.id]?.close();
                            onEdit(expense);
                        }}
                    >
                        <MaterialIcons name="edit" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity 
                        style={[styles.swipeButton, { backgroundColor: theme.colors.error }]} 
                        onPress={() => {
                            swipeableRefs.current[expense.id]?.close();
                            import('react-native').then(({ Alert }) => {
                                if (Platform.OS === 'web') {
                                    if (window.confirm('Bu masrafı silmek istediğinize emin misiniz?')) {
                                        onDelete(expense.id);
                                    }
                                } else {
                                    Alert.alert(
                                        'Masrafı Sil',
                                        'Bu masrafı silmek istediğinize emin misiniz?',
                                        [
                                            { text: 'İptal', style: 'cancel' },
                                            { text: 'Sil', style: 'destructive', onPress: () => onDelete(expense.id) }
                                        ]
                                    );
                                }
                            });
                        }}
                    >
                        <MaterialIcons name="delete" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.expensesList}>
            {Object.entries(groupedExpenses).map(([groupName, groupExpenses]) => (
                groupExpenses.length > 0 && (
                    <View key={groupName}>
                        <Text style={[styles.dateHeader, { color: theme.colors.subText }]}>{groupName}</Text>
                        {groupExpenses.map((expense) => (
                            <Swipeable
                                key={expense.id}
                                ref={(ref) => (swipeableRefs.current[expense.id] = ref)}
                                renderRightActions={() => renderRightActions(expense)}
                                enabled={expense.status === 'PENDING'}
                            >
                                <View style={[
                                    styles.expenseCard,
                                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                                ]}>
                                    <View style={styles.cardContent}>
                                        <View style={[
                                            styles.expenseIconCircle,
                                            { backgroundColor: theme.colors.background }
                                        ]}>
                                            {expense.receiptUrl ? (
                                                <TouchableOpacity onPress={() => setSelectedImage(expense.receiptUrl)}>
                                                    <Image 
                                                        source={{ uri: expense.receiptUrl }} 
                                                        style={{ width: 48, height: 48, borderRadius: 24 }} 
                                                        resizeMode="cover"
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <MaterialIcons name={getCategoryIcon(expense.category)} size={24} color={theme.colors.text} />
                                            )}
                                        </View>
                                        <View style={styles.expenseInfo}>
                                            <Text style={[styles.expenseTitle, { color: theme.colors.text }]}>{expense.description || expense.category}</Text>
                                            <Text style={[styles.expenseDate, { color: theme.colors.subText }]}>{new Date(expense.date).toLocaleDateString('tr-TR')}</Text>
                                            {expense.job?.title && <Text style={{ fontSize: 12, color: theme.colors.subText }}>{expense.job.title}</Text>}
                                        </View>
                                        <View style={styles.expenseAmountContainer}>
                                            <Text style={[styles.expenseAmount, { color: theme.colors.text }]}>₺{expense.amount}</Text>
                                            <View style={styles.statusContainer}>
                                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(expense.status) }]} />
                                                <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
                                                    {getStatusText(expense.status)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </Swipeable>
                        ))}
                    </View>
                )
            ))}
            {filteredExpensesCount === 0 && (
                <Text style={[styles.emptyText, { color: theme.colors.subText }]}>Masraf bulunamadı.</Text>
            )}

            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.imageContainer, { backgroundColor: theme.colors.surface }]}>
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity 
                                    style={styles.closeButton}
                                    onPress={() => setSelectedImage(null)}
                                >
                                    <MaterialIcons name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    swipeActions: {
        flexDirection: 'row',
        width: 140,
        marginBottom: 12,
    },
    swipeButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expensesList: {
        paddingHorizontal: 16,
    },
    dateHeader: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textGray,
        marginBottom: 12,
        marginLeft: 4,
    },
    expenseCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    expenseIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textLight,
        marginBottom: 4,
    },
    expenseDate: {
        fontSize: 14,
        color: COLORS.textGray,
    },
    expenseAmountContainer: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight,
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
    },
    emptyText: {
        color: COLORS.textGray,
        textAlign: 'center',
        marginTop: 20
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: '90%',
        height: '70%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
