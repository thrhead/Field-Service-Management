import React from 'react';
import { Platform } from 'react-native';

export default function CustomDateTimePicker({ value, onChange, mode, ...props }) {
    if (Platform.OS === 'web') {
        return (
            <input
                type={mode === 'time' ? 'time' : 'date'}
                value={value ? value.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                    const date = new Date(e.target.value);
                    onChange({ type: 'set' }, date);
                }}
                style={{
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    width: '100%',
                    fontSize: 16,
                    fontFamily: 'inherit'
                }}
            />
        );
    }
    return null;
}
