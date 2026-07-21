import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, useTheme } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const SellerScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    balance: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const ordersRes = await apiService.getSellerOrders();
      const allOrders = ordersRes.data?.orders || ordersRes.data || [];
      
      const pendingCount = allOrders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'pending').length;
      const todayOrdersCount = allOrders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length;
      
      const revenueAmount = allOrders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0);
      const balanceAmount = revenueAmount * 0.85;

      const recent = [...allOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      setStats({
        todayOrders: todayOrdersCount,
        pendingOrders: pendingCount,
        revenue: revenueAmount,
        balance: balanceAmount
      });
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const menuItems = [
    { title: 'Products', icon: 'inventory', type: 'MaterialIcons', color: '#10B981', screen: 'SellerProducts' },
    { title: 'Orders', icon: 'shopping-cart', type: 'MaterialIcons', color: '#3B82F6', screen: 'SellerOrders' },
    { title: 'Payments', icon: 'account-balance-wallet', type: 'MaterialIcons', color: '#F59E0B', screen: 'SellerPayments' },
    { title: 'Delivery', icon: 'local-shipping', type: 'MaterialIcons', color: '#8B5CF6', screen: 'SellerDelivery' },
    { title: 'Analytics', icon: 'bar-chart', type: 'MaterialIcons', color: '#EC4899', screen: 'SellerAnalytics' },
    { title: 'Forum', icon: 'forum', type: 'MaterialIcons', color: '#6366F1', screen: 'Forum' },
    { title: 'Recipes', icon: 'restaurant-menu', type: 'MaterialIcons', color: '#F43F5E', screen: 'Recipes' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'placed': case 'pending': return '#DC2626';
      case 'processing': return '#D97706';
      case 'packed': return '#7C3AED';
      case 'shipped': return '#2563EB';
      case 'delivered': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'placed': case 'pending': return '#FEE2E2';
      case 'processing': return '#FEF3C7';
      case 'packed': return '#F5F3FF';
      case 'shipped': return '#DBEAFE';
      case 'delivered': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  };

  const renderIcon = (item) => {
    return <MaterialIcons name={item.icon} size={32} color={item.color} />;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.businessName}>{user?.businessName || user?.name || 'Seller'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#3B82F6', shadowColor: '#3B82F6' }]}>
            <Card.Content>
              <Text style={styles.statValueWhite}>{stats.todayOrders}</Text>
              <Text style={styles.statLabelWhite}>Today's Orders</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]}>
            <Card.Content>
              <Text style={styles.statValueWhite}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabelWhite}>Pending Orders</Text>
            </Card.Content>
          </Card>
        </View>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}>
            <Card.Content>
              <Text style={styles.statValueWhite}>₹{stats.revenue.toLocaleString()}</Text>
              <Text style={styles.statLabelWhite}>Total Revenue</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6' }]}>
            <Card.Content>
              <Text style={styles.statValueWhite}>₹{stats.balance.toLocaleString()}</Text>
              <Text style={styles.statLabelWhite}>Avail. Balance</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Dashboard</Text>
      
      <View style={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.gridItem, { shadowColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              {renderIcon(item)}
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Orders</Text>
      <View style={styles.recentOrdersContainer}>
        {recentOrders.length === 0 ? (
          <Text style={styles.noOrdersText}>No recent orders found.</Text>
        ) : (
          recentOrders.map((order, index) => (
            <TouchableOpacity 
              key={order._id || index} 
              style={styles.orderItem}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order._id?.substring(0, 8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(order.orderStatus) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                    {order.orderStatus?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.orderAmount}>₹{order.totalPrice}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  statValueWhite: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabelWhite: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  recentOrdersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  noOrdersText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  orderItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    color: '#6B7280',
    fontSize: 14,
  },
  orderAmount: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 14,
  },
});

export default SellerScreen;
