import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const ApprovalTimeline = ({ history, theme }) => {
    return (
        <View style={styles.container}>
            {history.map((event, index) => (
                <View key={index} style={styles.event}>
                    <View style={styles.line} />
                    <View style={styles.dot} />
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{event.action}</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.subText }]}>{event.user} • {event.date}</Text>
                        {event.duration && <Text style={[styles.duration, { color: theme.colors.primary }]}>{event.duration}</Text>}
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    event: { flexDirection: 'row', marginBottom: 16 },
    line: { position: 'absolute', left: 4, top: 12, bottom: -16, width: 2, backgroundColor: '#ddd' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#aaa', marginTop: 4 },
    content: { marginLeft: 16 }
});
