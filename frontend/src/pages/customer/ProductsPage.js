import React from 'react';
import Header from '../../components/common/Header';
import ProductFilter from '../../components/common/ProductFilter';
import { Box, Container, Paper, Typography } from '@mui/material';

// Theme & Tokens
import { colors, radius } from '../../theme/designTokens';

const ProductsPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: colors.surface.default }}>
            <Header />
            <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 0,
                        borderRadius: radius.xl,
                        overflow: 'hidden',
                        border: `1px solid ${colors.neutral[100]}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}
                >
                    <Box sx={{ bgcolor: '#fff', p: { xs: 3, md: 5 }, borderBottom: `1px solid ${colors.neutral[100]}` }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, color: colors.neutral[900], mb: 1 }}>
                            Premium Collection
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.neutral[500], maxWidth: 700 }}>
                            Directly from the finest mills to your kitchen. Explore our curated selection of Basmati, Sona Masoori, and Organic rice.
                        </Typography>
                    </Box>
                    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: colors.surface.default }}>
                        <ProductFilter />
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProductsPage;
