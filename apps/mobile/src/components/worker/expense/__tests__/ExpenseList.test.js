import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExpenseList } from '../ExpenseList';

// Mock theme context
jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E0E0E0',
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      subText: '#9E9E9E',
      text: '#212121',
      primary: '#2196F3',
      background: '#F5F5F5',
    }
  })
}));

const mockExpenses = {
  '2023-10-27': [
    {
      id: '1',
      description: 'Test expense',
      amount: 100,
      date: '2023-10-27T10:00:00Z',
      category: 'MEAL',
      status: 'PENDING',
    }
  ]
};

describe('ExpenseList', () => {
  it('renders edit and delete buttons for pending expense', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <ExpenseList 
        groupedExpenses={mockExpenses} 
        filteredExpensesCount={1} 
        theme={{ colors: {} }} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    );

    expect(getByText('Düzenle')).toBeTruthy();
    expect(getByText('Sil')).toBeTruthy();
  });
});
