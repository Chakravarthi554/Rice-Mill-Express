// frontend/src/__tests__/LoginPage.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';

test('login form submits correctly', () => {
  const mockLogin = jest.fn();
  render(<LoginPage login={mockLogin} />);
  
  fireEvent.change(screen.getByPlaceholderText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByPlaceholderText('Password'), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByText('Login'));
  
  expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
});