import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const SellerDeliveryScreen = ({ navigation }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDeliveryPartners();
      setPartners(res.data?.deliveryPartners || res.data || []);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      // Fallback mock data for UI testing
      setPartners([
        { _id: '1', user: { name: 'Ramesh Kumar', phone: '9876543210' }, isAvailable: true, activeDeliveries: 2 },
        { _id: '2', user: { name: 'Suresh Singh', phone: '8765432109' }, isAvailable: false, activeDeliveries: 5 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const renderPartner = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user?.name?.charAt(0) || 'D'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.user?.name || 'Unknown'}</Text>
          <Text style={styles.phone}>📞 {item.user?.phone || 'No phone'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{item.isAvailable ? 'Available' : 'Busy'}</Text>
            <Text style={styles.deliveries}> • {item.activeDeliveries || 0} active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.assignBtn}>
          <MaterialIcons name="assignment" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={partners}
        keyExtractor={item => item._id}
        renderItem={renderPartner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPartners(); }} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="directions-bike" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No delivery partners found.</Text>
            </View>
          )
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        label="Add Partner"
        onPress={() => navigation.navigate('AddDeliveryPartner')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phone: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#374151',
  },
  deliveries: {
    fontSize: 12,
    color: '#6B7280',
  },
  assignBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  }
});

export default SellerDeliveryScreen;
