import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking, Alert } from 'react-native';
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
      setPartners([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCall = useCallback((phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'This partner has no phone number on file.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call from this device.');
    });
  }, []);

  const handleWhatsApp = useCallback((phone) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    const number = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    Linking.openURL(`whatsapp://send?phone=${number}`).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed.');
    });
  }, []);

  const renderPartner = useCallback(({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={[styles.avatar, { backgroundColor: item.isAvailable ? '#10B981' : '#8B5CF6' }]}>
          <Text style={styles.avatarText}>{(item.user?.name || 'D').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.user?.name || 'Unknown'}</Text>
          <Text style={styles.phone}>📞 {item.user?.phone || 'No phone'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>{item.isAvailable ? 'Available' : 'Busy'}</Text>
            <Text style={styles.deliveries}> • {item.activeDeliveries || 0} active deliveries</Text>
          </View>
        </View>
      </Card.Content>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]} onPress={() => handleCall(item.user?.phone)}>
          <MaterialIcons name="call" size={18} color="#16A34A" />
          <Text style={[styles.actionText, { color: '#16A34A' }]}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]} onPress={() => handleWhatsApp(item.user?.phone)}>
          <MaterialIcons name="chat" size={18} color="#25D366" />
          <Text style={[styles.actionText, { color: '#25D366' }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => {
          Alert.alert(
            item.user?.name || 'Delivery Partner',
            `📞 Phone: ${item.user?.phone || 'N/A'}\n📧 Email: ${item.user?.email || 'N/A'}\n📦 Active Deliveries: ${item.activeDeliveries || 0}\n🟢 Status: ${item.isAvailable ? 'Available' : 'Busy'}`,
          );
        }}>
          <MaterialIcons name="info-outline" size={18} color="#3B82F6" />
          <Text style={[styles.actionText, { color: '#3B82F6' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </Card>
  ), [handleCall, handleWhatsApp]);

  return (
    <View style={styles.container}>
      <FlatList
        data={partners}
        keyExtractor={item => item._id}
        renderItem={renderPartner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPartners(); }} colors={['#16A34A']} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="directions-bike" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No delivery partners found.</Text>
              <Text style={styles.emptySubtext}>Tap + to register a new partner</Text>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  listContainer: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 14, backgroundColor: '#fff', elevation: 2, borderRadius: 14, overflow: 'hidden' },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  phone: { fontSize: 13, color: '#4B5563', marginTop: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  deliveries: { fontSize: 12, color: '#6B7280' },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#8B5CF6' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#6B7280', marginTop: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});

export default SellerDeliveryScreen;
