// src/pages/customer/BulkOrderPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Grid,
  CircularProgress,
  MenuItem,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  createBulkOrder,
  getBulkOrders,
  updateBulkOrder,
  cancelBulkOrder,
} from '../../redux/actions/bulkOrderActions';
import { listProducts } from '../../redux/actions/productActions';
import ProductSelectionModal from '../../components/common/ProductSelectionModal';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

const BulkOrderPage = () => {
  const dispatch = useDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    houseNumber: '',
    colony: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
    landmark: '',
    location: null,
  });
  const [paymentTerms, setPaymentTerms] = useState('advance');
  const [locationLoading, setLocationLoading] = useState(false);
  const [creditDays, setCreditDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [action, setAction] = useState('');
  const [discount, setDiscount] = useState(0);
  const [negotiatedPrices, setNegotiatedPrices] = useState([]);

  // Redux State
  const { bulkOrders = [], loading: ordersLoading, error: ordersError } = useSelector(
    (state) => state.bulkOrderList || {}
  );
  const { loading: createLoading, error: createError, success: createSuccess } = useSelector(
    (state) => state.bulkOrderCreate || {}
  );
  const { loading: updateLoading, error: updateError, success: updateSuccess } = useSelector(
    (state) => state.bulkOrderUpdate || {}
  );
  const { products = [], loading: productsLoading } = useSelector((state) => state.productList || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});

  // Load data on mount
  useEffect(() => {
    if (userInfo) {
      dispatch(getBulkOrders());
      dispatch(listProducts());
    }
  }, [dispatch, createSuccess, updateSuccess, userInfo]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.address) {
            setShippingAddress((prev) => ({
              ...prev,
              street: data.address.road || data.address.suburb || prev.street,
              city: data.address.city || data.address.town || data.address.village || prev.city,
              state: data.address.state || prev.state,
              pinCode: data.address.postcode || prev.pinCode,
              location: { type: 'Point', coordinates: [longitude, latitude] },
            }));
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location');
        setLocationLoading(false);
      }
    );
  };

  const handleCreateOrder = async () => {
    if (!shippingAddress.houseNumber || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pinCode) {
      alert('Please fill all required shipping address fields (including House No)');
      return;
    }
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    const items = selectedProducts.map((product) => ({
      product: product._id,
      quantity: product.bulkQuantity || 50,
      requestedPrice: product.price || 0,
    }));

    const result = await dispatch(
      createBulkOrder({
        items,
        shippingAddress,
        paymentMethod: paymentTerms,
        creditDays: paymentTerms === 'credit' ? creditDays : undefined,
        advanceAmount: paymentTerms === 'advance' ? 100 : undefined,
        notes,
      })
    );

    if (result.success) {
      setSelectedProducts([]);
      setShippingAddress({
        name: userInfo?.name || '',
        phone: '',
        houseNumber: '',
        colony: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        landmark: '',
        location: null,
      });
      setPaymentTerms('advance');
      setNotes('');
      setOpenModal(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!currentOrder) return;

    const updateData = { action };
    if (action === 'send_quote') {
      updateData.discount = discount;
      updateData.negotiatedPrices = negotiatedPrices.map((item) => ({
        productId: item.productId,
        price: item.price,
      }));
    }

    const result = await dispatch(updateBulkOrder(currentOrder._id, updateData));
    if (result.success) {
      setOpenActionDialog(false);
      setDiscount(0);
      setNegotiatedPrices([]);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const cancellationReason = prompt('Please provide a reason for cancellation:');
    if (cancellationReason) {
      await dispatch(cancelBulkOrder(orderId, cancellationReason));
    }
  };

  const calculateTotal = (order) => {
    return (order?.items || []).reduce((sum, item) => {
      const actualPrice = item.negotiatedPrice || (item.product?.price || 0);
      const discountedPrice = order.discount ? actualPrice * (1 - order.discount / 100) : actualPrice;
      return sum + discountedPrice * (item.quantity || 0);
    }, 0);
  };

  const getStatusChip = (status) => {
    const colorMap = {
      requested: 'default',
      quote_sent: 'primary',
      negotiating: 'warning',
      confirmed: 'info',
      processing: 'secondary',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error',
    };
    const labelMap = {
      requested: 'Requested',
      quote_sent: 'Quote Sent',
      negotiating: 'Negotiating',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return (
      <Chip
        label={labelMap[status] || status}
        color={colorMap[status] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  // Filter orders by role
  const filteredOrders = userInfo
    ? bulkOrders.filter((order) => {
      if (userInfo.role === 'seller') return order.seller?._id === userInfo._id;
      return order.buyer?._id === userInfo._id;
    })
    : [];

  const requestedOrders = filteredOrders.filter((o) => o.status === 'requested');
  const activeOrders = filteredOrders.filter((o) =>
    ['quote_sent', 'negotiating', 'confirmed', 'processing', 'shipped'].includes(o.status)
  );
  const completedOrders = filteredOrders.filter((o) =>
    ['delivered', 'cancelled'].includes(o.status)
  );

  const getCurrentTabOrders = () => {
    switch (tabValue) {
      case 0: return activeOrders;
      case 1: return userInfo?.role === 'seller' ? requestedOrders : [];
      case 2: return completedOrders;
      default: return [];
    }
  };

  if (!userInfo) {
    return (
      <Container maxWidth="xl">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Please log in to access bulk orders.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Bulk Order Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {userInfo.role === 'customer'
          ? 'Place bulk orders for wholesale rice purchases'
          : 'Manage incoming bulk orders from customers'}
      </Typography>

      {/* Customer: Create Order Section */}
      {userInfo?.role === 'customer' && (
        <Box sx={{ mb: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Create New Bulk Order</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenModal(true)}
                  disabled={productsLoading}
                  startIcon={productsLoading ? <CircularProgress size={20} /> : null}
                >
                  {productsLoading ? 'Loading Products...' : 'Select Products'}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Minimum order quantity: 50kg per product. Get wholesale prices for bulk purchases.
              </Typography>
            </CardContent>
          </Card>

          <ProductSelectionModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            products={products}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
          />

          {selectedProducts.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Order Summary
              </Typography>

              {/* Product Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
                      <TableCell>Price per kg</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                style={{ width: 50, height: 50, marginRight: 10, objectFit: 'cover', borderRadius: 4 }}
                                onError={(e) => { e.target.src = '/default-product.jpg'; }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {product.name || 'Unnamed Product'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Stock: {product.countInStock || 0} kg
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{product.brand || 'N/A'}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={product.bulkQuantity || 50}
                            onChange={(e) => {
                              const newQuantity = Math.max(50, Number(e.target.value) || 50);
                              const updated = selectedProducts.map((p) =>
                                p._id === product._id ? { ...p, bulkQuantity: newQuantity } : p
                              );
                              setSelectedProducts(updated);
                            }}
                            inputProps={{ min: 50, max: product.countInStock || 1000 }}
                            size="small"
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>₹{product.price || 0}</TableCell>
                        <TableCell>₹{(product.price * (product.bulkQuantity || 50)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id))}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Shipping Address */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Shipping Information</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleDetectLocation}
                    disabled={locationLoading}
                    startIcon={locationLoading ? <CircularProgress size={16} /> : <span style={{ fontSize: '18px' }}>📍</span>}
                  >
                    {locationLoading ? 'Detecting...' : 'Detect My Current Location'}
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Recipient Full Name *"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Number *"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="House/Flat No *"
                      value={shippingAddress.houseNumber}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, houseNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Colony/Area/Society"
                      value={shippingAddress.colony}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, colony: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street Address *"
                      value={shippingAddress.street}
                      multiline
                      rows={2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Landmark (Optional)"
                      value={shippingAddress.landmark}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="City *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="State *"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="PIN Code *"
                      value={shippingAddress.pinCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, pinCode: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Payment Terms */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Payment Terms</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField select fullWidth label="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                      <MenuItem value="advance">100% Advance</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                      <MenuItem value="cod">Cash on Delivery</MenuItem>
                    </TextField>
                  </Grid>
                  {paymentTerms === 'credit' && (
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth type="number" label="Credit Days" value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value) || 0)} inputProps={{ min: 1, max: 90 }} />
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Notes */}
              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes (Optional)"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Box>

              {/* Total */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6">
                  Order Total: ₹{selectedProducts.reduce((sum, p) => sum + (p.price * (p.bulkQuantity || 50)), 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity: {selectedProducts.reduce((sum, p) => sum + (p.bulkQuantity || 50), 0)} kg
                </Typography>
              </Box>

              {/* Submit */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={() => setSelectedProducts([])}>Clear All</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateOrder}
                  disabled={createLoading || selectedProducts.length === 0}
                  startIcon={createLoading ? <CircularProgress size={20} /> : null}
                >
                  {createLoading ? 'Creating...' : 'Submit Order Request'}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Orders Tabs */}
      <Paper elevation={2} sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label={`Active Orders (${activeOrders.length})`} />
          {userInfo?.role === 'seller' && <Tab label={`New Requests (${requestedOrders.length})`} />}
          <Tab label={`Order History (${completedOrders.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {ordersLoading ? (
            <Loader />
          ) : ordersError ? (
            <Message severity="error">{ordersError}</Message>
          ) : getCurrentTabOrders().length === 0 ? (
            <Alert severity="info">
              {tabValue === 0 ? 'No active orders.' : tabValue === 1 ? 'No new requests.' : 'No completed orders.'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    {userInfo?.role === 'customer' && <TableCell>Seller</TableCell>}
                    {userInfo?.role === 'seller' && <TableCell>Buyer</TableCell>}
                    <TableCell>Items</TableCell>
                    <TableCell>Total Quantity</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getCurrentTabOrders().map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell><strong>{order.orderNumber || `#${order._id.slice(-8)}`}</strong></TableCell>
                      <TableCell>
                        {userInfo.role === 'customer'
                          ? order.seller?.businessName || order.seller?.name || 'Unknown'
                          : order.buyer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{order.items?.length} items</TableCell>
                      <TableCell>{order.items?.reduce((s, i) => s + i.quantity, 0)} kg</TableCell>
                      <TableCell><strong>₹{calculateTotal(order).toFixed(2)}</strong></TableCell>
                      <TableCell>{getStatusChip(order.status)}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setCurrentOrder(order);
                            setOpenActionDialog(true);
                          }}
                        >
                          {userInfo.role === 'seller' ? 'Manage' : 'View'}
                        </Button>
                        {userInfo.role === 'customer' && ['requested', 'quote_sent', 'negotiating'].includes(order.status) && (
                          <Button size="small" color="error" variant="outlined" onClick={() => handleCancelOrder(order._id)} sx={{ ml: 1 }}>
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Action Dialog */}
      <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage Bulk Order {currentOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {currentOrder && (
            <>
              <Stepper activeStep={['requested', 'quote_sent', 'negotiating', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(currentOrder.status)} sx={{ my: 3 }}>
                {['Requested', 'Quote Sent', 'Negotiating', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Shipping Address</Typography>
                    <Typography variant="body1" fontWeight="medium">{currentOrder.shippingAddress?.name}</Typography>
                    <Typography variant="body2">{currentOrder.shippingAddress?.houseNumber}, {currentOrder.shippingAddress?.colony && `${currentOrder.shippingAddress?.colony}, `}{currentOrder.shippingAddress?.street}</Typography>
                    {currentOrder.shippingAddress?.landmark && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Landmark: {currentOrder.shippingAddress?.landmark}</Typography>
                    )}
                    <Typography variant="body2">{currentOrder.shippingAddress?.city}, {currentOrder.shippingAddress?.state} - {currentOrder.shippingAddress?.pinCode}</Typography>
                    <Typography variant="body2">Phone: {currentOrder.shippingAddress?.phone}</Typography>
                    {currentOrder.shippingAddress?.location?.coordinates && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ mt: 1 }}
                        startIcon={<span>📍</span>}
                        onClick={() => {
                          const [lng, lat] = currentOrder.shippingAddress.location.coordinates;
                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                        }}
                      >
                        Navigate on Map
                      </Button>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Order Info</Typography>
                    <Typography variant="body2"><strong>Payment:</strong> {currentOrder.paymentDetails?.paymentMethod?.toUpperCase()}</Typography>
                    <Typography variant="body2"><strong>Placed On:</strong> {new Date(currentOrder.createdAt).toLocaleDateString()}</Typography>
                    {currentOrder.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Notes:</strong> {currentOrder.notes}</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Original Price</TableCell>
                      <TableCell>Negotiated Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentOrder.items.map((item) => (
                      <TableRow key={item.product._id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.quantity} kg</TableCell>
                        <TableCell>₹{item.product.price}</TableCell>
                        <TableCell>
                          {userInfo.role === 'seller' && currentOrder.status === 'requested' ? (
                            <TextField
                              type="number"
                              size="small"
                              value={negotiatedPrices.find(np => np.productId === item.product._id)?.price || item.product.price}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                setNegotiatedPrices(prev => {
                                  const exists = prev.find(np => np.productId === item.product._id);
                                  if (exists) return prev.map(np => np.productId === item.product._id ? { ...np, price } : np);
                                  return [...prev, { productId: item.product._id, price }];
                                });
                              }}
                            />
                          ) : (
                            `₹${item.negotiatedPrice || item.product.price}`
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {userInfo.role === 'seller' && currentOrder.status === 'requested' && (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    label="Discount (%)"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(50, Math.max(0, Number(e.target.value) || 0)))}
                    inputProps={{ min: 0, max: 50 }}
                    sx={{ width: 120 }}
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Close</Button>
          {userInfo.role === 'seller' && currentOrder?.status === 'requested' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => { setAction('send_quote'); handleUpdateOrder(); }}
              disabled={updateLoading}
            >
              {updateLoading ? <CircularProgress size={20} /> : 'Send Quote'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Messages */}
      {createError && <Message severity="error" sx={{ mt: 2 }}>{createError}</Message>}
      {updateError && <Message severity="error" sx={{ mt: 2 }}>{updateError}</Message>}
      {createSuccess && <Message severity="success" sx={{ mt: 2 }}>Bulk order created successfully!</Message>}
      {updateSuccess && <Message severity="success" sx={{ mt: 2 }}>Order updated successfully!</Message>}
    </Container>
  );
};

export default BulkOrderPage;