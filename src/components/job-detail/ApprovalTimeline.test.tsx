import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApprovalTimeline } from './ApprovalTimeline';

describe('ApprovalTimeline', () => {
    it('renders correctly with history items', () => {
        const history = [
            { action: 'Created', user: 'Admin', date: '2026-06-15 10:00' },
            { action: 'Approved', user: 'Manager', date: '2026-06-15 12:00', duration: '2h' }
        ];
        render(<ApprovalTimeline history={history} />);
        
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('Admin • 2026-06-15 10:00')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Manager • 2026-06-15 12:00')).toBeInTheDocument();
        expect(screen.getByText('Süre: 2h')).toBeInTheDocument();
    });
});
