import React from 'react';
import Header from '../../components/common/Header';
import ProductFilter from '../../components/common/ProductFilter';
import { Box, Container, Typography } from '@mui/material';

const ProductsPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
            <Header />
            {/* ── PAGE HEADER ── */}
            <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #F3F4F6' }}>
                <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 }, py: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#1F2937', mb: 0.5 }}>
                        Premium Rice Collection
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6B7280', maxWidth: 600, fontSize: '0.95rem' }}>
                        Directly from the finest mills to your kitchen. Explore Basmati, Sona Masoori, Organic & more.
                    </Typography>
                </Container>
            </Box>
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 }, py: 3 }}>
                <ProductFilter />
            </Container>
        </Box>
    );
};

export default ProductsPage;
