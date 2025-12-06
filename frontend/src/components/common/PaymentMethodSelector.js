import React from 'react';
import { FormControl, RadioGroup, FormControlLabel, Radio, FormLabel } from '@mui/material';

const PaymentMethodSelector = ({ value, onChange }) => {
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Payment Method</FormLabel>
      <RadioGroup value={value} onChange={e => onChange(e.target.value)}>
        <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery (COD)" />
        <FormControlLabel value="razorpay" control={<Radio />} label="Pay Online (Razorpay)" />
      </RadioGroup>
    </FormControl>
  );
};

export default PaymentMethodSelector;