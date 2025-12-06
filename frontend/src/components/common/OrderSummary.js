import React from 'react';
import { Card, CardContent, Typography, List, ListItem, Divider } from '@mui/material';

const OrderSummary = ({ items }) => {
  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  return (
    <Card sx={{ marginTop: 2 }}>
      <CardContent>
        <Typography variant="h6">Order Summary</Typography>
        <List>
          {items.map((item, index) => (
            <React.Fragment key={item.product || index}>
              <ListItem>
                {item.name} x {item.qty || 0} = ₹{(item.price || 0) * (item.qty || 0)}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          <ListItem>
            <strong>Total: ₹{(total || 0).toFixed(2)}</strong>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;