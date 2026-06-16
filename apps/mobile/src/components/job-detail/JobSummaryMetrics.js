import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const JobSummaryMetrics = ({ metrics, theme }) => {
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.metric}>
                <Text style={[styles.label, { color: theme.colors.subText }]}>Durum</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{metrics.status}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.metric}>
                <Text style={[styles.label, { color: theme.colors.subText }]}>İlerleme</Text>
                <Text style={[styles.value, { color: theme.colors.primary }]}>
                    {metrics.progress}% ({metrics.completedSteps}/{metrics.totalSteps})
                </Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.metric}>
                <Text style={[styles.label, { color: theme.colors.subText }]}>Risk</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{metrics.risk}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
    metric: { flex: 1, alignItems: 'center' },
    label: { fontSize: 12, marginBottom: 4 },
    value: { fontSize: 14, fontWeight: '700' },
    separator: { width: 1, backgroundColor: '#ddd', height: '100%', marginHorizontal: 8 }
});
