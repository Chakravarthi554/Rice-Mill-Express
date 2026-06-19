// SellerProductList – modern styled table using design tokens
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';

const SellerProductList = () => {
  const theme = useTheme();
  // Placeholder product data – replace with real selector when integrated
  const products = [];

  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: theme.shadows.md,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden',
        mt: 2,
      }}
    >
      <Table sx={{ minWidth: 650 }} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.background.default }}>
              Product
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.background.default }}>
              Price
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.background.default }}>
              Stock
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: theme.palette.background.default }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                No products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product._id} hover>
                <TableCell>{product.name}</TableCell>
                <TableCell>{`$${product.price}`}</TableCell>
                <TableCell>{product.countInStock}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button variant="contained" color="error" size="small">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SellerProductList;