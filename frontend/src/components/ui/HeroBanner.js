// HeroBanner — premium promotional banner (single or carousel-ready slide).
// Marketplace-grade: gradient overlay, badge, headline, CTA, decorative image.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { fadeInUp, tap } from '../../theme/animations';
import { radius, shadows } from '../../theme/designTokens';

const MotionBox = motion(Box);

const HeroBanner = ({
  badge,
  title,
  subtitle,
  cta = 'Shop Now',
  onCta,
  image,
  gradient = 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
  height = { xs: 180, sm: 240, md: 300 },
}) => (
  <MotionBox
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    sx={{
      position: 'relative',
      borderRadius: `${radius.xl}px`,
      overflow: 'hidden',
      minHeight: height,
      display: 'flex',
      alignItems: 'center',
      background: gradient,
      boxShadow: shadows.lg,
      color: '#fff',
    }}
  >
    {image && (
      <Box
        component="img"
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.28, mixBlendMode: 'overlay',
        }}
      />
    )}
    <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, sm: 4, md: 5 }, maxWidth: { xs: '100%', sm: '70%' } }}>
      {badge && (
        <Box
          component="span"
          sx={{
            display: 'inline-block', bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em',
            px: 1.5, py: 0.5, borderRadius: `${radius.pill}px`, mb: 1.5, textTransform: 'uppercase',
          }}
        >
          {badge}
        </Box>
      )}
      <Typography sx={{ fontSize: { xs: '1.4rem', sm: '2rem', md: '2.4rem' }, fontWeight: 800, lineHeight: 1.15, mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, opacity: 0.92, mb: 2.5, maxWidth: 460 }}>
          {subtitle}
        </Typography>
      )}
      {cta && onCta && (
        <Button
          component={motion.button}
          whileTap={tap}
          onClick={onCta}
          sx={{
            bgcolor: '#fff', color: '#1F2937', fontWeight: 800,
            px: 3, py: 1, '&:hover': { bgcolor: '#F9FAFB' },
          }}
        >
          {cta}
        </Button>
      )}
    </Box>
  </MotionBox>
);

HeroBanner.propTypes = {
  badge: PropTypes.string,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  cta: PropTypes.string,
  onCta: PropTypes.func,
  image: PropTypes.string,
  gradient: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
};

export default HeroBanner;
