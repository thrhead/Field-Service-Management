import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const JobSummaryMetrics = ({ metrics, theme }) => {
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.metric}><Text>Durum: {metrics.status}</Text></View>
            <View style={styles.metric}><Text>İlerleme: %{metrics.progress}</Text></View>
            <View style={styles.metric}><Text>Risk: {metrics.risk}</Text></View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, borderRadius: 8 },
    metric: { marginBottom: 8 }
});
