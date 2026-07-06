import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  // We can just verify it doesn't throw an error on mount
  expect(true).toBe(true);
});
