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
    totalOrders: 0,
    totalProducts: 0,
    totalEarnings: 0,
  });

  const fetchDashboardData = async () => {
    try {
      // Temporarily fetch basic data for stats. Will be expanded later.
      const ordersRes = await apiService.getSellerOrders();
      const ordersCount = (ordersRes.data?.orders || ordersRes.data || []).length;
      
      setStats(prev => ({ ...prev, totalOrders: ordersCount }));
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
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statValue}>₹{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </Card.Content>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Dashboard</Text>
      
      <View style={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.gridItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              {renderIcon(item)}
            </View>
            <Text style={styles.gridTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});

export default SellerScreen;
