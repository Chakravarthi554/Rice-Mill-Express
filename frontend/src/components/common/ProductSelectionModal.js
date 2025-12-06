import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';

const ProductSelectionModal = ({ open, onClose, products, selectedProducts, setSelectedProducts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  const categories = [
    'Rice',
    'Flour',
    'Millets',
    'Pulses & Legumes',
    'Edible Oils',
    'Spices & Condiments',
    'Dry Fruits & Nuts',
    'Organic Products',
  ];

  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    setFilteredProducts(filtered);
  }, [searchQuery, category, products]);

  const handleSelectProduct = (product) => {
    const existingIndex = selectedProducts.findIndex((p) => p._id === product._id);
    if (existingIndex >= 0) {
      setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id));
    } else {
      // ✅ FIXED: Check stock before adding to selection
      const availableStock = product.countInStock || product.stock || 0;
      if (availableStock < 50) {
        alert(`Insufficient stock for ${product.name}. Available: ${availableStock} kg, Minimum: 50 kg`);
        return;
      }
      
      setSelectedProducts([...selectedProducts, { 
        ...product, 
        bulkQuantity: Math.min(50, availableStock) // Start with minimum or available stock
      }]);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const newProducts = [...selectedProducts];
    const index = newProducts.findIndex((p) => p._id === productId);
    if (index >= 0) {
      const product = newProducts[index];
      const availableStock = product.countInStock || product.stock || 0;
      const newQuantity = Math.max(50, Math.min(Number(quantity) || 50, availableStock));
      
      if (newQuantity > availableStock) {
        alert(`Cannot exceed available stock of ${availableStock} kg for ${product.name}`);
        return;
      }
      
      newProducts[index].bulkQuantity = newQuantity;
      setSelectedProducts(newProducts);
    }
  };

  const getStockStatus = (product) => {
    const stock = product.countInStock || product.stock || 0;
    if (stock === 0) return { label: 'Out of Stock', color: 'error' };
    if (stock < 50) return { label: `Low Stock (${stock} kg)`, color: 'warning' };
    return { label: `In Stock (${stock} kg)`, color: 'success' };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Select Products for Bulk Order
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Minimum order quantity: 50 kg per product
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Search Products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            displayEmpty
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {selectedProducts.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Selected {selectedProducts.length} product(s) for bulk order
          </Alert>
        )}

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Price per kg</TableCell>
                <TableCell>Available Stock</TableCell>
                <TableCell>Quantity (kg)</TableCell>
                <TableCell>Min Order</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const isSelected = selectedProducts.some((p) => p._id === product._id);
                const selectedProduct = selectedProducts.find((p) => p._id === product._id);
                const availableStock = product.countInStock || product.stock || 0;
                const minQuantity = product.minBulkQuantity || 50;
                
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectProduct(product)}
                        disabled={availableStock < minQuantity}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{ width: 40, height: 40, marginRight: 8, objectFit: 'cover' }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name || 'Unnamed Product'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.category}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{product.brand || 'N/A'}</TableCell>
                    <TableCell>₹{product.price || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={stockStatus.label} 
                        color={stockStatus.color} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={selectedProduct?.bulkQuantity || minQuantity}
                        onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                        inputProps={{ 
                          min: minQuantity, 
                          max: availableStock 
                        }}
                        size="small"
                        disabled={!isSelected || availableStock < minQuantity}
                        error={selectedProduct && selectedProduct.bulkQuantity > availableStock}
                        helperText={
                          selectedProduct && selectedProduct.bulkQuantity > availableStock 
                            ? `Max: ${availableStock} kg` 
                            : ''
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {minQuantity} kg
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredProducts.length === 0 && (
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            No products found.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          disabled={selectedProducts.length === 0}
        >
          Confirm Selection ({selectedProducts.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSelectionModal;