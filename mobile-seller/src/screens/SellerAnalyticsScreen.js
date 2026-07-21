import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

const SellerAnalyticsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCompleted: 0,
    activeProducts: 0
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [ordersRes, productsRes] = await Promise.all([
        apiService.getSellerOrders(),
        apiService.getSellerProducts()
      ]);

      const allOrders = ordersRes.data?.orders || ordersRes.data || [];
      const allProducts = productsRes.data?.products || productsRes.data || [];

      const completedOrders = allOrders.filter(o => o.orderStatus === 'delivered');
      const totalSalesAmt = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const activeProds = allProducts.filter(p => p.isActive !== false).length;

      setStats({
        totalSales: totalSalesAmt,
        ordersCompleted: completedOrders.length,
        activeProducts: activeProds
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Store Analytics</Text>
        <Text style={styles.subtitle}>Overview of your performance</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <MaterialIcons name="trending-up" size={24} color="#2563EB" />
            </View>
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>₹{stats.totalSales}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
            </View>
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{stats.ordersCompleted}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="inventory" size={24} color="#D97706" />
            </View>
            <View style={styles.statText}>
              <Text style={styles.statLabel}>Products</Text>
              <Text style={styles.statValue}>{stats.activeProducts}</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Monthly Revenue (Mock)</Text>
          <View style={styles.mockChart}>
            {/* Extremely simple mock bar chart for UI representation */}
            {[40, 70, 30, 90, 60, 100, 50].map((height, i) => (
              <View key={i} style={styles.barContainer}>
                <View style={[styles.bar, { height: height, backgroundColor: '#EC4899' }]} />
                <Text style={styles.barLabel}>M{i+1}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  mockChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  }
});

export default SellerAnalyticsScreen;
