import React from 'react';
import {
  Paper, Typography, Accordion, AccordionSummary,
  AccordionDetails, Box, Container
} from '@mui/material';
import { ExpandMore, HelpOutline } from '@mui/icons-material';

const faqs = [
  { q: 'How do I place an order?', a: 'Add items to cart → Checkout → Confirm payment.' },
  { q: 'What is the return policy?', a: 'Returns accepted within 7 days of delivery.' },
  { q: 'How can I track my order?', a: 'Go to Order History → Click the tracking icon.' },
  { q: 'How do I contact customer support?', a: 'Reach us via the Contact Form in your settings or email support@ricemill.com.' },
  { q: 'Can I cancel my order?', a: 'Orders can be cancelled within 1 hour of placement before processing begins.' },
];

const HelpCenter = () => (
  <Box sx={{ maxWidth: 600 }}>
    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <HelpOutline sx={{ color: '#7C3AED', fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
          Help Center / FAQs
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {faqs.map((f, i) => (
          <Accordion key={i} sx={{ borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid #F3F4F6', '&.Mui-expanded': { margin: 0 } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 3, fontWeight: 700, color: '#374151' }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{f.q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Typography sx={{ color: '#6B7280', fontSize: 14 }}>{f.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  </Box>
);

export default HelpCenter;
