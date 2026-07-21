import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput } from 'react-native';
import { Card, Button, DataTable } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const SellerPaymentsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const stats = {
    totalEarnings: 0,
    availableBalance: 0,
    pendingWithdrawals: 0
  };
  const [statsData, setStatsData] = useState(stats);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiService.getSellerPayments();
      
      if (res.data) {
        setStatsData({
          totalEarnings: res.data.stats?.totalEarnings || 0,
          availableBalance: res.data.stats?.availableBalance || 0,
          pendingWithdrawals: res.data.stats?.pendingPayouts || 0
        });
        
        // Map backend payment format to mobile table format
        const formattedPayments = (res.data.payments || []).map(p => ({
          id: p._id,
          date: new Date(p.createdAt).toLocaleDateString(),
          amount: p.sellerPayoutAmount || p.amount,
          status: p.status === 'completed' ? 'Completed' : 'Pending'
        }));
        
        setPayments(formattedPayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleWithdrawRequest = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (amount > statsData.availableBalance) {
      alert('Insufficient available balance');
      return;
    }
    if (amount < 500) {
      alert('Minimum withdrawal amount is ₹500');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.requestWithdrawal({ amount });
      alert('Withdrawal request submitted successfully');
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      fetchPayments();
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Payments & Earnings</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <Card.Content>
            <Text style={styles.statLabelLight}>Available Balance</Text>
            <Text style={styles.statValueLight}>₹{statsData.availableBalance}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>₹{statsData.pendingWithdrawals}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>₹{statsData.totalEarnings}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionContainer}>
        <Button 
          mode="contained" 
          icon="cash"
          style={styles.withdrawBtn}
          onPress={() => setWithdrawModalVisible(true)}
        >
          Request Withdrawal
        </Button>
      </View>

      <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Card style={styles.tableCard}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title numeric>Amount</DataTable.Title>
              <DataTable.Title numeric>Status</DataTable.Title>
            </DataTable.Header>

            {payments.map(payment => (
              <DataTable.Row key={payment.id}>
                <DataTable.Cell>{payment.date}</DataTable.Cell>
                <DataTable.Cell numeric>₹{payment.amount}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <Text style={{ color: payment.status === 'Completed' ? '#10B981' : '#F59E0B' }}>
                    {payment.status}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card>
      </View>

      <Modal visible={withdrawModalVisible} transparent animationType="slide" onRequestClose={() => setWithdrawModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Withdrawal</Text>
            <Text style={styles.modalSubtitle}>Available Balance: ₹{statsData.availableBalance}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="Enter amount (Min ₹500)"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setWithdrawModalVisible(false)} style={styles.modalBtn} disabled={submitting}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleWithdrawRequest} style={styles.modalBtn} loading={submitting} disabled={submitting}>
                Submit
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  statLabelLight: {
    fontSize: 13,
    color: '#D1FAE5',
  },
  statValueLight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  withdrawBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tableCard: {
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 12, marginBottom: 24, height: 50 },
  currencyPrefix: { fontSize: 18, fontWeight: '600', color: '#374151', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 18, color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { minWidth: 100 },
});

export default SellerPaymentsScreen;
