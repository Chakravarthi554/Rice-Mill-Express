import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductSelectionModal from './ProductSelectionModal';

test('renders product selection modal', () => {
  render(
    <ProductSelectionModal 
      open={true} 
      onClose={() => {}} 
      products={[]} 
      selectedProducts={[]} 
      onSelect={() => {}}
    />
  );
  
  expect(screen.getByText('Select Products for Bulk Order')).toBeInTheDocument();
});