import React from 'react';
import { render } from '@testing-library/react-native';
import { JobSummaryMetrics } from '../JobSummaryMetrics';

describe('JobSummaryMetrics', () => {
    const mockMetrics = {
        status: 'Aktif',
        progress: 50,
        risk: 'Düşük'
    };
    const mockTheme = {
        colors: {
            surface: '#ffffff'
        }
    };

    it('renders correct metrics', () => {
        const { getByText } = render(<JobSummaryMetrics metrics={mockMetrics} theme={mockTheme} />);
        
        expect(getByText('Durum: Aktif')).toBeTruthy();
        expect(getByText('İlerleme: %50')).toBeTruthy();
        expect(getByText('Risk: Düşük')).toBeTruthy();
    });
});
