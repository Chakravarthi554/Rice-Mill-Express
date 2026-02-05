import React, { useState, useEffect } from 'react';
console.log('📄 BulkOrderDetailScreen loading...');
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  Card,
  Button,
  DataTable,
  Divider,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { updateBulkOrder } from '../redux/actions/bulkOrderActions';
import { getBulkOrderDetails } from '../redux/actions/bulkOrderActions';
import {
  BULK_ORDER_DETAILS_REQUEST,
  BULK_ORDER_DETAILS_SUCCESS,
  BULK_ORDER_DETAILS_FAIL,
} from '../constants/bulkOrderConstants';

const BulkOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { bulkOrder, loading: orderLoading, error } = useSelector(state => state.bulkOrderDetails);
  const { success: updateSuccess } = useSelector(state => state.bulkOrderUpdate);
  const { userInfo } = useSelector(state => state.userLogin);

  useEffect(() => {
    dispatch(getBulkOrderDetails(orderId));
  }, [dispatch, orderId, updateSuccess]);

  useEffect(() => {
    if (bulkOrder) {
      setLoading(false);
    }
  }, [bulkOrder]);

  const handleFulfillOrder = () => {
    dispatch(updateBulkOrder(bulkOrder._id, { action: 'fulfill' }));
    setSnackbarMessage('Order marked as fulfilled');
    setSnackbarVisible(true);
  };

  const calculateTotal = () => {
    return bulkOrder?.items.reduce((sum, item) => {
      const price = item.negotiatedPrice || (item.price * (1 - (bulkOrder.discount || 0) / 100));
      return sum + (price * item.quantity);
    }, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: '#FFA500',
      quote_sent: '#2196F3',
      negotiating: '#FFC107',
      confirmed: '#4CAF50',
      fulfilled: '#607D8B',
      cancelled: '#F44336'
    };
    return colors[status] || '#9E9E9E';
  };

  if (loading || orderLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={`Order #${bulkOrder.orderNumber}`}
          subtitle={`Status: ${bulkOrder.status.replace('_', ' ')}`}
          subtitleStyle={{ color: getStatusColor(bulkOrder.status) }}
        />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Product</DataTable.Title>
              <DataTable.Title numeric>Qty (kg)</DataTable.Title>
              <DataTable.Title numeric>Price</DataTable.Title>
              <DataTable.Title numeric>Total</DataTable.Title>
            </DataTable.Header>

            {bulkOrder.items.map((item, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{item.name}</DataTable.Cell>
                <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                <DataTable.Cell numeric>
                  ₹{(item.negotiatedPrice || (item.price * (1 - (bulkOrder.discount || 0) / 100))).toFixed(2)}
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  ₹{((item.negotiatedPrice || (item.price * (1 - (bulkOrder.discount || 0) / 100))) * item.quantity).toFixed(2)}
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Row>
              <DataTable.Cell>Discount</DataTable.Cell>
              <DataTable.Cell numeric></DataTable.Cell>
              <DataTable.Cell numeric>{bulkOrder.discount || 0}%</DataTable.Cell>
              <DataTable.Cell numeric>
                -₹{(calculateTotal() * (bulkOrder.discount || 0) / 100).toFixed(2)}
              </DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row style={styles.totalRow}>
              <DataTable.Cell>Grand Total</DataTable.Cell>
              <DataTable.Cell numeric></DataTable.Cell>
              <DataTable.Cell numeric></DataTable.Cell>
              <DataTable.Cell numeric>₹{calculateTotal().toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>

          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer Information</Text>
            <Text style={styles.infoText}>{bulkOrder.buyer.name}</Text>
            <Text style={styles.infoText}>{bulkOrder.buyer.email}</Text>
          </View>

          {bulkOrder.seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seller Information</Text>
              <Text style={styles.infoText}>{bulkOrder.seller.name}</Text>
              <Text style={styles.infoText}>{bulkOrder.seller.email}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.infoText}>{bulkOrder.shippingAddress.name}</Text>
            <Text style={styles.infoText}>{bulkOrder.shippingAddress.phone}</Text>
            <Text style={styles.infoText}>{bulkOrder.shippingAddress.street}</Text>
            <Text style={styles.infoText}>
              {bulkOrder.shippingAddress.city}, {bulkOrder.shippingAddress.state} - {bulkOrder.shippingAddress.pinCode}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.infoText}>
              {bulkOrder.paymentTerms === 'advance' ? '100% Advance Payment' :
                bulkOrder.paymentTerms === 'credit' ? 'Credit' : 'Cash on Delivery'}
            </Text>
          </View>

          {bulkOrder.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Text style={styles.infoText}>{bulkOrder.notes}</Text>
            </View>
          )}

          {userInfo.role === 'seller' && bulkOrder.status === 'confirmed' && (
            <Button
              mode="contained"
              onPress={handleFulfillOrder}
              style={styles.actionButton}
            >
              Mark as Fulfilled
            </Button>
          )}
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
    color: '#F44336',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    marginBottom: 4,
    color: '#555',
  },
  divider: {
    marginVertical: 16,
  },
  totalRow: {
    backgroundColor: '#f5f5f5',
  },
  actionButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  button: {
    marginTop: 20,
    width: '80%',
  },
});

export default BulkOrderDetailScreen;