import React from 'react';
import {
  Paper, Typography, Accordion, AccordionSummary,
  AccordionDetails, Box
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const faqs = [
  { q: 'How do I place an order?', a: 'Add items to cart → Checkout → Confirm payment.' },
  { q: 'What is the return policy?', a: 'Returns accepted within 7 days of delivery.' },
  { q: 'How can I track my order?', a: 'Go to Order History → Click the tracking icon.' },
];

const HelpCenter = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Help Center / FAQs</Typography>
    {faqs.map((f, i) => (
      <Accordion key={i}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{f.q}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{f.a}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Paper>
);
export default HelpCenter;