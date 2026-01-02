import React from 'react';
import { useI18n } from '../../context/i18nContext';

/**
 * Price component that automatically formats currency based on user's selected currency
 * Usage: <Price amount={1250.50} />
 * Output: ₹1,250.50 or $1,250.50 depending on selected currency
 */
const Price = ({ amount, showSymbol = true, ...props }) => {
    const { formatCurrency, currency } = useI18n();

    if (amount === null || amount === undefined) {
        return <span {...props}>N/A</span>;
    }

    const formattedPrice = showSymbol ? formatCurrency(amount) : amount.toFixed(2);

    return <span {...props}>{formattedPrice}</span>;
};

export default Price;
