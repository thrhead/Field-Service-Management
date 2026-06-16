import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ApprovalTimeline = ({ history, theme }) => {
    return (
        <View style={styles.container}>
            {history.map((event, index) => (
                <View key={index} style={styles.event}>
                    <View style={styles.lineWrapper}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                        {index < history.length - 1 && (
                            <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
                        )}
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{event.action}</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.subText }]}>{event.user} • {event.date}</Text>
                        {event.duration && (
                            <Text style={[styles.duration, { color: theme.colors.primary }]}>
                                Süre: {event.duration}
                            </Text>
                        )}
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    event: { flexDirection: 'row', marginBottom: 4 },
    lineWrapper: { alignItems: 'center', width: 20 },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    line: { flex: 1, width: 2, marginVertical: 2 },
    content: { marginLeft: 8, paddingBottom: 16 },
    title: { fontSize: 14, fontWeight: '600' },
    subtitle: { fontSize: 12, marginTop: 2 },
    duration: { fontSize: 12, marginTop: 4, fontWeight: '700' }
});
