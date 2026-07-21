import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, SafeAreaView, Switch, Image, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from '../services/api';

const DeliveryPartnerDashboard = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ todayOrders: 0, floatingCash: 0, walletBalance: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Timer state for incoming orders
    const [timeLeft, setTimeLeft] = useState(60); 

    const { user } = useSelector(state => state.auth);

    const PRIMARY_ACCENT = '#FC8019'; // Swiggy Orange
    const GREEN_ACCENT = '#16A34A';
    const RED_ACCENT = '#EF4444';

    const handleToggleDuty = async (value) => {
        try {
            setIsOnline(value);
            await apiService.toggleDutyStatus(value);
        } catch (error) {
            setIsOnline(!value);
            Alert.alert('Error', 'Failed to update duty status.');
        }
    };

    const handleSOS = () => {
        Alert.alert(
            "🚨 SOS Emergency",
            "Are you in an emergency?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "TRIGGER SOS", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.triggerSOS({ latitude: 0, longitude: 0 });
                            Alert.alert('SOS Sent', 'Support team notified!');
                        } catch (error) {
                            Alert.alert('SOS Failed', 'Call emergency services directly.');
                        }
                    }
                }
            ]
        );
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersRes, statsRes] = await Promise.all([
                apiService.getAssignedOrders(),
                apiService.getDPDashboard()
            ]);

            if (ordersRes.data && Array.isArray(ordersRes.data.orders)) {
                setOrders(ordersRes.data.orders);
            }

            if (statsRes.data && statsRes.data.stats) {
                setStats(statsRes.data.stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Timer effect
    useEffect(() => {
        const activeOrder = orders.length > 0 ? orders[0] : null;
        if (activeOrder && activeOrder.deliveryPartnerStatus === 'assigned') {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleReject(activeOrder._id, true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeLeft(60); // Reset
        }
    }, [orders]);

    const handleReject = async (orderId, isTimeout = false) => {
        try {
            setActionLoading(true);
            await apiService.rejectOrder(orderId);
            if (!isTimeout) {
                Alert.alert('Rejected', 'Order has been reassigned.');
            }
            fetchDashboardData();
        } catch (error) {
            Alert.alert('Error', 'Could not reject order.');
        } finally {
            setActionLoading(false);
        }
    };

    const activeOrder = orders.length > 0 ? orders[0] : null;
    const isNewAssigned = activeOrder && activeOrder.deliveryPartnerStatus === 'assigned';

    return (
        <SafeAreaView style={styles.container}>
            {/* Massive Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]}</Text>
                        <Text style={styles.date}>{new Date().toDateString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                        <Ionicons name="warning" size={24} color="#FFF" />
                        <Text style={styles.sosText}>SOS</Text>
                    </TouchableOpacity>
                </View>

                {/* Duty Toggle Massive Card */}
                <View style={[styles.dutyCard, { backgroundColor: isOnline ? '#2563EB' : '#4B5563', shadowColor: isOnline ? '#2563EB' : '#000' }]}>
                    <View style={styles.dutyLeft}>
                        <View style={[styles.dutyDot, { backgroundColor: isOnline ? '#34D399' : '#9CA3AF' }]} />
                        <Text style={styles.dutyText}>{isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}</Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={handleToggleDuty}
                        trackColor={{ false: "#4B5563", true: "#60A5FA" }}
                        thumbColor={isOnline ? "#fff" : "#9CA3AF"}
                        style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
                    />
                </View>
            </View>

            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} tintColor="#FFF"/>}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Active Order Massive Card */}
                {isOnline && activeOrder ? (
                    <View style={[styles.activeOrderCard, isNewAssigned && styles.newOrderPulse]}>
                        <View style={styles.activeOrderHeader}>
                            <Text style={[styles.activeOrderTitle, isNewAssigned && {color: PRIMARY_ACCENT}]}>
                                {isNewAssigned ? '🔔 INCOMING ORDER!' : 'CURRENT ORDER'}
                            </Text>
                            <Text style={styles.activeOrderId}>#{activeOrder._id?.substring(18).toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.locationContainer}>
                            <View style={styles.locationRow}>
                                <Ionicons name="storefront" size={24} color={PRIMARY_ACCENT} />
                                <Text style={styles.locationText} numberOfLines={1}>Pickup: {activeOrder.seller?.businessDetails?.businessName || 'Seller'}</Text>
                            </View>
                            <View style={styles.dashLine} />
                            <View style={styles.locationRow}>
                                <Ionicons name="home" size={24} color="#34D399" />
                                <Text style={styles.locationText} numberOfLines={2}>Drop: {activeOrder.shippingAddress?.houseNumber}, {activeOrder.shippingAddress?.street}</Text>
                            </View>
                        </View>

                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>To Collect (COD)</Text>
                            <Text style={styles.paymentAmount}>₹{activeOrder.totalPrice}</Text>
                        </View>

                        {isNewAssigned ? (
                            <View style={styles.acceptanceActions}>
                                <Text style={styles.timerText}>Auto-reject in {timeLeft}s</Text>
                                <View style={styles.actionButtonsRow}>
                                    <TouchableOpacity 
                                        style={[styles.halfButton, { backgroundColor: '#374151' }]}
                                        onPress={() => handleReject(activeOrder._id)}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.halfButtonText}>REJECT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.halfButton, { backgroundColor: GREEN_ACCENT }]}
                                        onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder._id })}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.halfButtonText}>ACCEPT</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.massiveButton, { backgroundColor: PRIMARY_ACCENT }]}
                                onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder._id })}
                            >
                                <Text style={styles.massiveButtonText}>VIEW DETAILS</Text>
                                <Ionicons name="arrow-forward-circle" size={32} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name={isOnline ? "bicycle" : "moon"} size={80} color="#4B5563" />
                        <Text style={styles.emptyStateTitle}>{isOnline ? 'Waiting for Orders...' : 'You are Offline'}</Text>
                        <Text style={styles.emptyStateSub}>
                            {isOnline ? 'Stay near restaurants or mills to get orders faster.' : 'Go online to start receiving delivery orders.'}
                        </Text>
                    </View>
                )}

                {/* Performance Stats (Phase 1) */}
                <View style={styles.performanceCard}>
                    <Text style={styles.sectionTitle}>Performance</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBoxSmall}>
                            <Text style={styles.statValueSmall}>98%</Text>
                            <Text style={styles.statLabelSmall}>Acceptance</Text>
                        </View>
                        <View style={styles.statBoxSmall}>
                            <Text style={styles.statValueSmall}>100%</Text>
                            <Text style={styles.statLabelSmall}>On-Time</Text>
                        </View>
                        <View style={styles.statBoxSmall}>
                            <Text style={styles.statValueSmall}>4.9⭐</Text>
                            <Text style={styles.statLabelSmall}>Rating</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Earnings</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.todayOrders || 0}</Text>
                        <Text style={styles.statLabel}>Today's Trips</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}>
                        <Text style={styles.statValue}>₹{stats.floatingCash || 0}</Text>
                        <Text style={styles.statLabel}>Cash to Deposit</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { padding: 20, backgroundColor: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#374151' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
    date: { fontSize: 16, color: '#9CA3AF', marginTop: 4 },
    sosButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, elevation: 8, shadowColor: '#EF4444', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 6 },
    sosText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    dutyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 24, elevation: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10 },
    dutyLeft: { flexDirection: 'row', alignItems: 'center' },
    dutyDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
    dutyText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    scrollContent: { padding: 20 },
    activeOrderCard: { backgroundColor: '#1F2937', borderRadius: 28, padding: 24, marginBottom: 24, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12 },
    newOrderPulse: { borderColor: '#FC8019', borderWidth: 2, shadowColor: '#FC8019', elevation: 20, shadowOpacity: 0.8, shadowRadius: 16 },
    activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    activeOrderTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    activeOrderId: { color: '#9CA3AF', fontSize: 18, fontWeight: '600' },
    locationContainer: { marginBottom: 24 },
    locationRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 },
    locationText: { color: '#F3F4F6', fontSize: 18, marginLeft: 16, fontWeight: '500' },
    dashLine: { width: 2, height: 24, backgroundColor: '#4B5563', marginLeft: 11, marginVertical: 4 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: 16, borderRadius: 12, marginBottom: 24 },
    paymentLabel: { color: '#D1D5DB', fontSize: 18, fontWeight: '600' },
    paymentAmount: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    massiveButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20, elevation: 8, shadowColor: '#FC8019', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8 },
    massiveButtonText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    acceptanceActions: { marginTop: 8 },
    timerText: { color: '#EF4444', textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    halfButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
    halfButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyStateTitle: { color: '#F3F4F6', fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
    emptyStateSub: { color: '#9CA3AF', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 16, letterSpacing: 0.5 },
    performanceCard: { backgroundColor: '#1F2937', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, backgroundColor: '#3B82F6', padding: 20, borderRadius: 20, alignItems: 'center', marginHorizontal: 8, elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
    statValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
    statBoxSmall: { flex: 1, alignItems: 'center' },
    statValueSmall: { color: '#34D399', fontSize: 26, fontWeight: '900', marginBottom: 4, textShadowColor: 'rgba(52, 211, 153, 0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    statLabelSmall: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' }
});

export default DeliveryPartnerDashboard;
