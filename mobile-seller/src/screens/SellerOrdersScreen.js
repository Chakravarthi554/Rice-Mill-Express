import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, RefreshControl, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const STATUS_OPTIONS = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  placed: 'Placed', packed: 'Packed', shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};
const STATUS_COLORS = {
  placed: '#6366F1', packed: '#7C3AED', shipped: '#F97316',
  out_for_delivery: '#EF4444', delivered: '#16A34A', cancelled: '#991B1B',
};

const DATE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

// Memoized Order Card
const OrderCard = React.memo(({ order, onPress, onUpdateStatus, onAssignPartner }) => (
  <Card style={styles.orderCard}>
    <Card.Content>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{order._id.substring(18)}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.orderStatus] || '#6B7280') + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.orderStatus] || '#6B7280' }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[order.orderStatus] || '#6B7280' }]}>
            {STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </Text>
        </View>
      </View>
      <Text style={styles.customerName}>{order.shippingAddress?.name || 'Unknown Customer'}</Text>
      <Text style={styles.customerAddress}>{order.shippingAddress?.street || 'No street'}, {order.shippingAddress?.city || 'No city'}</Text>
      <Text style={styles.orderAmount}>₹{order.totalAmount || order.totalPrice || 0}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onPress(order._id)}>
          <MaterialIcons name="visibility" size={16} color="#3B82F6" />
          <Text style={[styles.actionText, { color: '#3B82F6' }]}>Details</Text>
        </TouchableOpacity>
        {!['delivered', 'cancelled'].includes(order.orderStatus) && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onUpdateStatus(order)}>
              <MaterialIcons name="update" size={16} color="#16A34A" />
              <Text style={[styles.actionText, { color: '#16A34A' }]}>Update Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onAssignPartner(order)}>
              <MaterialIcons name="delivery-dining" size={16} color="#8B5CF6" />
              <Text style={[styles.actionText, { color: '#8B5CF6' }]}>Assign</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card.Content>
  </Card>
));

const SellerOrdersScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  // Status update modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Assign partner modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [partners, setPartners] = useState([]);
  const [assignOrder, setAssignOrder] = useState(null);

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
      setRefreshing(false);
    }
  };

  const filterByDate = useCallback((ordersToFilter) => {
    if (customDate && customDate.length === 10) {
      return ordersToFilter.filter(order => {
        const orderDateStr = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDateStr === customDate;
      });
    }

    if (dateFilter === 'all') return ordersToFilter;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return ordersToFilter.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (dateFilter === 'today') return orderDate >= startOfDay;
      if (dateFilter === 'week') {
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= monthStart;
      }
      return true;
    });
  }, [dateFilter, customDate]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      if (activeTab === 'pending') return ['placed', 'packed'].includes(order.orderStatus);
      return order.orderStatus === activeTab;
    });
    return filterByDate(result);
  }, [orders, activeTab, filterByDate]);

  const getValidTransitions = (currentStatus) => {
    if (currentStatus === 'placed') return ['packed', 'cancelled'];
    if (currentStatus === 'packed') return ['shipped', 'cancelled'];
    if (currentStatus === 'shipped') return ['out_for_delivery'];
    if (currentStatus === 'out_for_delivery') return ['delivered'];
    return [];
  };

  // Status update
  const handleUpdateStatus = useCallback((order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  }, []);

  const confirmStatusUpdate = async (newStatus) => {
    try {
      await apiService.updateOrderStatus(selectedOrder._id, newStatus);
      Alert.alert('Success', `Order status updated to ${STATUS_LABELS[newStatus]}`);
      setStatusModalVisible(false);
      fetchSellerOrders();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update status');
    }
  };

  // Assign delivery partner
  const handleAssignPartner = useCallback(async (order) => {
    setAssignOrder(order);
    try {
      const res = await apiService.getDeliveryPartners();
      setPartners(res.data?.deliveryPartners || res.data || []);
    } catch (e) {
      setPartners([]);
    }
    setAssignModalVisible(true);
  }, []);

  const confirmAssignPartner = async (partnerId) => {
    try {
      await apiService.assignDeliveryPartner(assignOrder._id, partnerId);
      Alert.alert('Success', 'Delivery partner assigned!');
      setAssignModalVisible(false);
      fetchSellerOrders();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to assign partner');
    }
  };

  const handleOrderPress = useCallback((id) => {
    navigation.navigate('OrderDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <OrderCard
      order={item}
      onPress={handleOrderPress}
      onUpdateStatus={handleUpdateStatus}
      onAssignPartner={handleAssignPartner}
    />
  ), [handleOrderPress, handleUpdateStatus, handleAssignPartner]);

  const onRefresh = () => { setRefreshing(true); fetchSellerOrders(); };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        {['pending', 'shipped', 'delivered'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'pending' ? 'Pending' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Filter */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <View style={styles.dateFilterRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity key={f.key} style={[styles.dateChip, dateFilter === f.key && !customDate && styles.dateChipActive]} onPress={() => { setDateFilter(f.key); setCustomDate(''); }}>
              <Text style={[styles.dateChipText, dateFilter === f.key && !customDate && styles.dateChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput 
          style={styles.dateInput} 
          placeholder="Or search specific date (YYYY-MM-DD)" 
          value={customDate} 
          onChangeText={setCustomDate} 
          maxLength={10} 
        />
      </View>

      {/* Order Count */}
      <Text style={styles.countText}>{filteredOrders.length} orders found</Text>

      {/* Orders List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} orders found</Text>}
        />
      )}

      {/* Add Product FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDeliveryPartner')}>
        <MaterialIcons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Status Update Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            <Text style={styles.modalSubtitle}>Current: {STATUS_LABELS[selectedOrder?.orderStatus] || ''}</Text>
            {STATUS_OPTIONS.map(status => {
              const isValid = getValidTransitions(selectedOrder?.orderStatus).includes(status);
              const isCurrent = selectedOrder?.orderStatus === status;
              return (
                <TouchableOpacity 
                  key={status} 
                  style={[
                    styles.statusOption, 
                    { borderLeftColor: isValid ? STATUS_COLORS[status] : '#E5E7EB' },
                    !isValid && { opacity: 0.5 }
                  ]} 
                  onPress={() => confirmStatusUpdate(status)}
                  disabled={!isValid}
                >
                  <Text style={[styles.statusOptionText, !isValid && { color: '#9CA3AF' }]}>
                    {STATUS_LABELS[status]} {isCurrent ? '(Current)' : ''}
                  </Text>
                  {isValid && <MaterialIcons name="arrow-forward-ios" size={14} color="#9CA3AF" />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Partner Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Delivery Partner</Text>
            {partners.length === 0 ? (
              <Text style={styles.emptyText}>No delivery partners available</Text>
            ) : (
              partners.map(p => (
                <TouchableOpacity key={p._id} style={styles.partnerOption} onPress={() => confirmAssignPartner(p._id)}>
                  <View style={styles.partnerAvatar}>
                    <Text style={styles.partnerAvatarText}>{(p.user?.name || 'D').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partnerName}>{p.user?.name || 'Unknown'}</Text>
                    <Text style={styles.partnerPhone}>{p.user?.phone || ''}</Text>
                  </View>
                  <View style={[styles.availDot, { backgroundColor: p.isAvailable ? '#16A34A' : '#EF4444' }]} />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tab: { flex: 1, padding: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#16A34A' },
  tabText: { fontWeight: '600', color: '#6B7280', fontSize: 14 },
  activeTabText: { color: '#16A34A', fontWeight: '700' },
  dateFilterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dateChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  dateChipActive: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
  dateChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dateChipTextActive: { color: '#16A34A', fontWeight: '700' },
  dateInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, fontSize: 13, color: '#374151' },
  countText: { paddingHorizontal: 16, paddingTop: 10, fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  listContent: { padding: 12, paddingBottom: 80 },
  orderCard: { marginBottom: 12, backgroundColor: '#fff', elevation: 2, borderRadius: 14 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#111827' },
  orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  customerName: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  customerAddress: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  orderAmount: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F9FAFB' },
  actionText: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', elevation: 6,
  },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  statusOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderLeftWidth: 4, backgroundColor: '#F9FAFB',
    marginBottom: 8, borderRadius: 10,
  },
  statusOptionText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  partnerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  partnerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  partnerAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  partnerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  partnerPhone: { fontSize: 12, color: '#6B7280' },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 12 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
});

export default SellerOrdersScreen;