import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JobSummaryMetrics } from './JobSummaryMetrics';

describe('JobSummaryMetrics', () => {
    it('renders correctly with metrics', () => {
        const metrics = { totalTime: '10h', status: 'Approved' };
        render(<JobSummaryMetrics metrics={metrics} />);
        
        expect(screen.getByText('10h')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
    });
});
