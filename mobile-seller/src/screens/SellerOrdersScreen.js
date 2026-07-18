import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const SellerOrdersScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSellerOrders();
      setOrders(response.data?.orders || response.data || []);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return ['placed', 'packed'].includes(order.orderStatus);
    }
    return order.orderStatus === activeTab;
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.tabText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shipped' && styles.activeTab]}
          onPress={() => setActiveTab('shipped')}
        >
          <Text style={styles.tabText}>Shipped</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text style={styles.tabText}>Delivered</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionArea}>
        <Button
          mode="outlined"
          icon="account-plus"
          onPress={() => navigation.navigate('AddDeliveryPartner')}
          style={styles.partnerButton}
        >
          Register Delivery Partner
        </Button>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        ) : filteredOrders.length === 0 ? (
          <Text style={styles.noOrders}>No {activeTab} orders found</Text>
        ) : (
          filteredOrders.map(order => (
            <Card key={order._id} style={styles.orderCard}>
              <Card.Content>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order._id.substring(18)}</Text>
                  <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                </View>
                <Text style={styles.customerName}>
                  {order.shippingAddress?.name || 'Unknown Customer'}
                </Text>
                <Text style={styles.customerAddress}>
                  {order.shippingAddress?.street || 'No street'}, {order.shippingAddress?.city || 'No city'}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('OrderDetail', { id: order._id })}
                    style={styles.detailButton}
                  >
                    Details
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 10,
  },
  orderCard: {
    marginBottom: 10,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderId: {
    fontWeight: 'bold',
  },
  orderAmount: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  customerName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerAddress: {
    color: '#666',
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    color: '#666',
  },
  detailButton: {
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  noOrders: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  actionArea: {
    padding: 10,
    paddingBottom: 0,
  },
  partnerButton: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
});

export default SellerOrdersScreen;