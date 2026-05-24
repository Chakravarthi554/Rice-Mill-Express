import React from 'react';
import Header from '../../components/common/Header';
import ProductFilter from '../../components/common/ProductFilter';
import { Box, Container, Paper, Typography } from '@mui/material';

const ProductsPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
            <Header />
            <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
                <Paper elevation={0} sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                    <Box sx={{ bgcolor: '#fff', p: 3, borderBottom: '1px solid #F3F4F6' }}>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                            All Products & Offers
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Browse our complete catalog and find the best deals.
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <ProductFilter />
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProductsPage;
