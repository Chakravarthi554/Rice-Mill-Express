import React, { useState, useEffect } from 'react';
console.log('📋 BulkOrderScreen loading...');
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Button,
  TextInput,
  RadioButton,
  DataTable,
  Dialog,
  Portal,
  Provider as PaperProvider
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { getBulkOrders, createBulkOrder, updateBulkOrder } from '../redux/actions/bulkOrderActions';
import { listProducts } from '../redux/actions/productActions';

const BulkOrderScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({});
  const [paymentTerms, setPaymentTerms] = useState('advance');
  const [notes, setNotes] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [action, setAction] = useState('');
  const [discount, setDiscount] = useState(0);

  const { bulkOrders, loading: ordersLoading } = useSelector(state => state.bulkOrderList);
  const { loading: createLoading } = useSelector(state => state.bulkOrderCreate);
  const { loading: updateLoading } = useSelector(state => state.bulkOrderUpdate);
  const { products } = useSelector(state => state.productList);
  const { userInfo } = useSelector(state => state.userLogin);

  useEffect(() => {
    dispatch(getBulkOrders());
    dispatch(listProducts({}));
  }, [dispatch]);

  const filteredOrders = bulkOrders.filter(order => {
    if (userInfo.role === 'seller') {
      return order.seller._id === userInfo._id;
    }
    return order.buyer._id === userInfo._id;
  });

  const requestedOrders = filteredOrders.filter(o => o.status === 'requested');
  const activeOrders = filteredOrders.filter(o =>
    ['quote_sent', 'negotiating', 'confirmed'].includes(o.status));
  const completedOrders = filteredOrders.filter(o =>
    ['fulfilled', 'cancelled'].includes(o.status));

  const handleCreateOrder = () => {
    const items = selectedProducts.map(product => ({
      product: product._id,
      quantity: product.bulkQuantity || 50
    }));

    dispatch(createBulkOrder({
      items,
      shippingAddress: shippingInfo,
      paymentTerms,
      notes
    }));

    setSelectedProducts([]);
    setShippingInfo({});
    setPaymentTerms('advance');
    setNotes('');
  };

  const handleUpdateOrder = () => {
    dispatch(updateBulkOrder(currentOrder._id, {
      action,
      discount: action === 'send_quote' ? discount : undefined
    }));
    setShowActionDialog(false);
  };

  const calculateTotal = (order) => {
    return order.items.reduce((sum, item) => {
      const price = item.negotiatedPrice ||
        (item.product.price * (1 - (order.discount || 0) / 100));
      return sum + (price * item.quantity);
    }, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: '#FFA500', // Orange
      quote_sent: '#2196F3', // Blue
      negotiating: '#FFC107', // Amber
      confirmed: '#4CAF50', // Green
      fulfilled: '#607D8B', // Blue Grey
      cancelled: '#F44336' // Red
    };
    return colors[status] || '#9E9E9E';
  };

  return (
    <PaperProvider>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Bulk Order Portal</Text>

        {userInfo.role === 'customer' && (
          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={() => setShowProductModal(true)}
              style={styles.button}
            >
              Create New Bulk Order
            </Button>

            {selectedProducts.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Order Summary" />
                key={order._id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('BulkOrderDetail', { orderId: order._id })}

                <Card.Content>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Product</DataTable.Title>
                      <DataTable.Title numeric>Qty (kg)</DataTable.Title>
                      <DataTable.Title numeric>Total</DataTable.Title>
                    </DataTable.Header>

                    {selectedProducts.map(product => (
                      <DataTable.Row key={product._id}>
                        <DataTable.Cell>
                          <Text numberOfLines={1} style={styles.productName}>
                            {product.name}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          <TextInput
                            style={styles.quantityInput}
                            keyboardType="numeric"
                            value={String(product.bulkQuantity || 50)}
                            onChangeText={(text) => {
                              const newProducts = [...selectedProducts];
                              const index = newProducts.findIndex(p => p._id === product._id);
                              newProducts[index].bulkQuantity = Math.max(50, parseInt(text) || 50);
                              setSelectedProducts(newProducts);
                            }}
                          />
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          ₹{(product.price * (product.bulkQuantity || 50)).toFixed(2)}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>

                  <Text style={styles.sectionTitle}>Shipping Information</Text>
                  <TextInput
                    label="Name"
                    value={shippingInfo.name || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, name: text })}
                    style={styles.input}
                  />
                  <TextInput
                    label="Phone"
                    value={shippingInfo.phone || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, phone: text })}
                    style={styles.input}
                  />
                  <TextInput
                    label="Address"
                    value={shippingInfo.street || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, street: text })}
                    multiline
                    style={styles.input}
                  />
                  <TextInput
                    label="City"
                    value={shippingInfo.city || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, city: text })}
                    style={styles.input}
                  />
                  <TextInput
                    label="State"
                    value={shippingInfo.state || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, state: text })}
                    style={styles.input}
                  />
                  <TextInput
                    label="PIN Code"
                    value={shippingInfo.pinCode || ''}
                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, pinCode: text })}
                    style={styles.input}
                  />

                  <Text style={styles.sectionTitle}>Payment Terms</Text>
                  <RadioButton.Group
                    onValueChange={setPaymentTerms}
                    value={paymentTerms}
                  >
                    <View style={styles.radioOption}>
                      <RadioButton value="advance" />
                      <Text>100% Advance</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="credit" />
                      <Text>Credit</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="cod" />
                      <Text>Cash on Delivery</Text>
                    </View>
                  </RadioButton.Group>

                  <TextInput
                    label="Additional Notes"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    onPress={handleCreateOrder}
                    disabled={createLoading || !shippingInfo.street}
                    style={styles.submitButton}
                  >
                    Submit Order Request
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={activeTab === 'active' ? styles.activeTabText : styles.tabText}>
              Active Orders
            </Text>
          </TouchableOpacity>
          {userInfo.role === 'seller' && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={activeTab === 'requests' ? styles.activeTabText : styles.tabText}>
                New Requests
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={activeTab === 'history' ? styles.activeTabText : styles.tabText}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {ordersLoading ? (
          <Text>Loading orders...</Text>
        ) : (
          <View style={styles.ordersContainer}>
            {(activeTab === 'active' ? activeOrders :

              activeTab === 'requests' ? requestedOrders :
                completedOrders).length === 0 ? (
              <Text style={styles.noOrdersText}>No orders found</Text>
            ) : (
              (activeTab === 'active' ? activeOrders :
                activeTab === 'requests' ? requestedOrders :
                  completedOrders).map(order => (
                    <Card key={order._id} style={styles.orderCard}>
                      <Card.Title
                        title={`Order #${order.orderNumber}`}
                        subtitle={`Status: ${order.status.replace('_', ' ')}`}
                        subtitleStyle={{ color: getStatusColor(order.status) }}
                        right={() => (
                          <Text style={styles.orderTotal}>
                            ₹{calculateTotal(order).toFixed(2)}
                          </Text>
                        )}
                      />
                      <Card.Content>
                        <DataTable>
                          <DataTable.Header>
                            <DataTable.Title>Product</DataTable.Title>
                            <DataTable.Title numeric>Qty (kg)</DataTable.Title>
                            <DataTable.Title numeric>Price</DataTable.Title>
                          </DataTable.Header>

                          {order.items.map(item => (
                            <DataTable.Row key={item._id}>
                              <DataTable.Cell>{item.product.name}</DataTable.Cell>
                              <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                              <DataTable.Cell numeric>
                                ₹{(item.negotiatedPrice ||
                                  (item.product.price * (1 - (order.discount || 0) / 100))).toFixed(2)}
                              </DataTable.Cell>
                            </DataTable.Row>
                          ))}
                        </DataTable>

                        <View style={styles.orderMeta}>
                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Buyer: </Text>
                            {order.buyer.name}
                          </Text>
                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Seller: </Text>
                            {order.seller.name}
                          </Text>
                          <Text style={styles.metaText}>
                            <Text style={styles.metaLabel}>Created: </Text>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Text>
                          {order.status === 'quote_sent' && userInfo.role === 'customer' && (
                            <View style={styles.negotiationBox}>
                              <Text style={styles.negotiationText}>
                                Seller has sent a quote. Would you like to accept?
                              </Text>
                              <View style={styles.negotiationButtons}>
                                <Button
                                  mode="outlined"
                                  onPress={() => {
                                    setCurrentOrder(order);
                                    setAction('accept_quote');
                                    setShowActionDialog(true);
                                  }}
                                  style={styles.negotiationButton}
                                >
                                  Accept
                                </Button>
                                <Button
                                  mode="outlined"
                                  onPress={() => {
                                    setCurrentOrder(order);
                                    setAction('negotiate');
                                    setShowActionDialog(true);
                                  }}
                                  style={styles.negotiationButton}
                                >
                                  Negotiate
                                </Button>
                              </View>
                            </View>
                          )}
                          {order.status === 'negotiating' && userInfo.role === 'seller' && (
                            <View style={styles.negotiationBox}>
                              <Text style={styles.negotiationText}>
                                Customer is negotiating the price.
                              </Text>
                              <Button
                                mode="contained"
                                onPress={() => {
                                  setCurrentOrder(order);
                                  setAction('update_quote');
                                  setShowActionDialog(true);
                                }}
                                style={styles.negotiationButton}
                              >
                                Update Quote
                              </Button>
                            </View>
                          )}
                          {order.status === 'requested' && userInfo.role === 'seller' && (
                            <View style={styles.actionButtons}>
                              <Button
                                mode="contained"
                                onPress={() => {
                                  setCurrentOrder(order);
                                  setAction('send_quote');
                                  setShowActionDialog(true);
                                }}
                                style={styles.actionButton}
                              >
                                Send Quote
                              </Button>
                              <Button
                                mode="outlined"
                                onPress={() => {
                                  setCurrentOrder(order);
                                  setAction('reject');
                                  setShowActionDialog(true);
                                }}
                                style={styles.actionButton}
                              >
                                Reject
                              </Button>
                            </View>
                          )}
                        </View>
                      </Card.Content>
                    </Card>
                  ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Product Selection Modal */}
      <Portal>
        <Dialog
          visible={showProductModal}
          onDismiss={() => setShowProductModal(false)}
          style={styles.modal}
        >
          <Dialog.Title>Select Products</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.modalContent}>
              {products.map(product => (
                <Card
                  key={product._id}
                  style={[
                    styles.productCard,
                    selectedProducts.some(p => p._id === product._id) && styles.selectedProductCard
                  ]}
                  onPress={() => {
                    if (selectedProducts.some(p => p._id === product._id)) {
                      setSelectedProducts(selectedProducts.filter(p => p._id !== product._id));
                    } else {
                      setSelectedProducts([...selectedProducts, { ...product, bulkQuantity: 50 }]);
                    }
                  }}
                >
                  <Card.Content style={styles.productContent}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>₹{product.price}/kg</Text>
                    {selectedProducts.some(p => p._id === product._id) && (
                      <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                    )}
                  </Card.Content>
                  key={order._id}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('BulkOrderDetail', { orderId: order._id })}

                </Card>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowProductModal(false)}>Cancel</Button>
            <Button
              onPress={() => {
                setShowProductModal(false);
              }}
              disabled={selectedProducts.length === 0}
            >
              Done
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Action Dialog */}
      <Portal>
        <Dialog
          visible={showActionDialog}
          onDismiss={() => setShowActionDialog(false)}
        >
          <Dialog.Title>
            {action === 'send_quote' ? 'Send Quote' :
              action === 'accept_quote' ? 'Accept Quote' :
                action === 'negotiate' ? 'Negotiate Price' :
                  action === 'update_quote' ? 'Update Quote' :
                    'Confirm Action'}
          </Dialog.Title>
          <Dialog.Content>
            {action === 'send_quote' && (
              <>
                <Text>You're about to send a quote for this order.</Text>
                <TextInput
                  label="Discount Percentage"
                  keyboardType="numeric"
                  value={String(discount)}
                  onChangeText={text => setDiscount(Math.min(100, Math.max(0, parseInt(text) || 0)))}
                  style={styles.discountInput}
                />
              </>
            )}
            {action === 'accept_quote' && (
              <Text>Are you sure you want to accept this quote and confirm the order?</Text>
            )}
            {action === 'negotiate' && (
              <Text>You'll be able to negotiate the price with the seller after submitting.</Text>
            )}
            {action === 'update_quote' && (
              <>
                <Text>Update the quote for this order.</Text>
                <TextInput
                  label="Discount Percentage"
                  keyboardType="numeric"
                  value={String(discount)}
                  onChangeText={text => setDiscount(Math.min(100, Math.max(0, parseInt(text) || 0)))}
                  style={styles.discountInput}
                />
              </>
            )}
            {action === 'reject' && (
              <Text>Are you sure you want to reject this order request?</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowActionDialog(false)}>Cancel</Button>
            <Button
              onPress={handleUpdateOrder}
              loading={updateLoading}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </PaperProvider>
  );
};
// Add these state variables
const [negotiationMode, setNegotiationMode] = useState(false);
const [priceOffers, setPriceOffers] = useState({});

// Add negotiation handler
const handleNegotiatePrice = (productId, price) => {
  setPriceOffers(prev => ({
    ...prev,
    [productId]: price
  }));
};

// Add to the render
{
  negotiationMode && (
    <View style={styles.negotiationContainer}>
      {currentOrder.items.map(item => (
        <View key={item.product._id} style={styles.negotiationItem}>
          <Text>{item.product.name}</Text>
          <TextInput
            value={String(priceOffers[item.product._id] || '')}
            onChangeText={text => handleNegotiatePrice(
              item.product._id,
              parseFloat(text) || 0
            )}
            keyboardType="numeric"
            placeholder="Your offer"
            style={styles.negotiationInput}
          />
        </View>
      ))}
      <Button
        onPress={() => {
          setNegotiationMode(false);
          handleUpdateOrder({
            action: 'negotiate',
            negotiatedPrices: Object.entries(priceOffers).map(([productId, price]) => ({
              productId,
              price
            }))
          });
        }}
      >
        Submit Offer
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 16,
    backgroundColor: '#4CAF50',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  quantityInput: {
    width: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  ordersContainer: {
    marginBottom: 20,
  },
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  orderTotal: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  orderMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  metaText: {
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: 'bold',
  },
  negotiationBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  negotiationText: {
    marginBottom: 8,
  },
  negotiationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  negotiationButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  modal: {
    maxHeight: '80%',
  },
  modalContent: {
    maxHeight: 400,
  },
  productCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedProductCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  productContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  discountInput: {
    marginTop: 12,
    backgroundColor: 'white',
  },
});

export default BulkOrderScreen;