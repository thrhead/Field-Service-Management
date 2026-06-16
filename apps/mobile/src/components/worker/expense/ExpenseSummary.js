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
