import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, SafeAreaView, Switch, ActivityIndicator, Animated, Vibration, Platform, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import {
    connectSocket,
    disconnectSocket,
    emitDeliveryPartnerOnline,
    emitDeliveryPartnerOffline,
    emitDeliveryLocationUpdate,
    subscribeToNewOrderAssigned,
    subscribeToOrderCancelled,
    subscribeToMessageReceived,
    unsubscribeFromDeliveryPartnerEvents,
} from '../services/socket';

const DeliveryPartnerDashboard = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ todayOrders: 0, floatingCash: 0, walletBalance: 0 });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    
    // Timer state for incoming orders
    const [timeLeft, setTimeLeft] = useState(30); 
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const locationIntervalRef = useRef(null);

    const { user } = useSelector(state => state.auth);

    const PRIMARY_ACCENT = '#FC8019';
    const GREEN_ACCENT = '#16A34A';
    const RED_ACCENT = '#EF4444';

    // Socket connection & event listeners
    useEffect(() => {
        let mounted = true;

        const initSocket = async () => {
            const socket = await connectSocket();
            if (!socket || !mounted) return;

            subscribeToNewOrderAssigned((data) => {
                console.log('🔔 New order assigned:', data);
                if (mounted) {
                    setTimeLeft(30);
                    fetchDashboardData();
                    Vibration.vibrate([0, 500, 200, 500]);
                }
            });

            subscribeToOrderCancelled((data) => {
                console.log('❌ Order cancelled:', data);
                if (mounted) {
                    Alert.alert('Order Cancelled', 'The order has been cancelled by the customer or seller.');
                    fetchDashboardData();
                }
            });

            subscribeToMessageReceived((data) => {
                console.log('💬 New message:', data);
                if (mounted) {
                    setUnreadMessages(prev => prev + 1);
                }
            });
        };

        initSocket();

        return () => {
            mounted = false;
            unsubscribeFromDeliveryPartnerEvents();
        };
    }, []);

    // Pulse animation for incoming order card
    useEffect(() => {
        const activeOrder = orders.length > 0 ? orders[0] : null;
        if (activeOrder && activeOrder.deliveryPartnerStatus === 'assigned') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.03, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [orders]);

    const handleToggleDuty = async (value) => {
        try {
            setIsOnline(value);
            await apiService.toggleDutyStatus(value);
            if (value) {
                emitDeliveryPartnerOnline(user?._id);
                startLocationTracking();
            } else {
                emitDeliveryPartnerOffline(user?._id);
                stopLocationTracking();
            }
        } catch (error) {
            setIsOnline(!value);
            Alert.alert('Error', 'Failed to update duty status.');
        }
    };

    const startLocationTracking = () => {
        // Emit GPS location every 30 seconds while online
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = setInterval(async () => {
            try {
                // Simplified: in production use expo-location
                emitDeliveryLocationUpdate({
                    userId: user?._id,
                    timestamp: Date.now(),
                });
            } catch (e) {
                console.warn('Location update failed:', e);
            }
        }, 30000);
    };

    const stopLocationTracking = () => {
        if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopLocationTracking();
    }, []);

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

    // Timer effect — 30 second countdown for incoming orders
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
            setTimeLeft(30);
        }
    }, [orders]);

    const handleAccept = async (orderId) => {
        try {
            setActionLoading(true);
            await apiService.acceptOrder(orderId);
            Alert.alert('Accepted! 🎉', 'Order accepted. Head to the pickup location.');
            fetchDashboardData();
        } catch (error) {
            Alert.alert('Error', 'Could not accept order. It may have been reassigned.');
            fetchDashboardData();
        } finally {
            setActionLoading(false);
        }
    };

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

    const openMapsNavigation = (address) => {
        if (address) {
            const query = encodeURIComponent(`${address.houseNumber || ''} ${address.street || ''} ${address.city || ''}`);
            const url = Platform.OS === 'ios'
                ? `maps:?daddr=${query}`
                : `google.navigation:q=${query}`;
            Linking.openURL(url).catch(() => {
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
            });
        }
    };

    const activeOrder = orders.length > 0 ? orders[0] : null;
    const isNewAssigned = activeOrder && activeOrder.deliveryPartnerStatus === 'assigned';
    const isActiveDelivery = activeOrder && ['accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(activeOrder.deliveryPartnerStatus);

    // Determine active delivery stage for status bar
    const getStatusStage = (status) => {
        const stages = ['accepted', 'picked_up', 'in_transit', 'delivered'];
        const idx = stages.indexOf(status);
        return idx >= 0 ? idx : 0;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Massive Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]}</Text>
                        <Text style={styles.date}>{new Date().toDateString()}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {unreadMessages > 0 && (
                            <TouchableOpacity style={styles.chatBadgeBtn} onPress={() => navigation.navigate('SupportChat')}>
                                <Ionicons name="chatbubbles" size={22} color="#FFF" />
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadBadgeText}>{unreadMessages}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
                            <Ionicons name="warning" size={24} color="#FFF" />
                            <Text style={styles.sosText}>SOS</Text>
                        </TouchableOpacity>
                    </View>
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
                {/* ===== INCOMING ORDER (New Assignment) ===== */}
                {isOnline && isNewAssigned && activeOrder ? (
                    <Animated.View style={[styles.incomingOrderCard, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={styles.incomingHeader}>
                            <MaterialCommunityIcons name="bell-ring" size={28} color={PRIMARY_ACCENT} />
                            <Text style={styles.incomingTitle}>NEW ORDER REQUEST!</Text>
                        </View>

                        {/* Timer Progress */}
                        <View style={styles.timerContainer}>
                            <View style={styles.timerBarBg}>
                                <View style={[styles.timerBarFill, { width: `${(timeLeft / 30) * 100}%`, backgroundColor: timeLeft > 10 ? PRIMARY_ACCENT : RED_ACCENT }]} />
                            </View>
                            <Text style={[styles.timerText, timeLeft <= 10 && { color: RED_ACCENT }]}>
                                {timeLeft}s
                            </Text>
                        </View>

                        {/* Route Info */}
                        <View style={styles.locationContainer}>
                            <View style={styles.locationRow}>
                                <View style={[styles.locDot, { backgroundColor: PRIMARY_ACCENT }]} />
                                <View style={styles.locInfo}>
                                    <Text style={styles.locLabel}>PICKUP</Text>
                                    <Text style={styles.locationText} numberOfLines={1}>{activeOrder.seller?.businessDetails?.businessName || 'Seller'}</Text>
                                </View>
                            </View>
                            <View style={styles.dashLine} />
                            <View style={styles.locationRow}>
                                <View style={[styles.locDot, { backgroundColor: GREEN_ACCENT }]} />
                                <View style={styles.locInfo}>
                                    <Text style={styles.locLabel}>DROP</Text>
                                    <Text style={styles.locationText} numberOfLines={2}>{activeOrder.shippingAddress?.houseNumber}, {activeOrder.shippingAddress?.street}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Earnings */}
                        <View style={styles.earningsRow}>
                            <View style={styles.earningItem}>
                                <Text style={styles.earningLabel}>COD Amount</Text>
                                <Text style={styles.earningValue}>₹{activeOrder.totalPrice}</Text>
                            </View>
                            <View style={styles.earningItem}>
                                <Text style={styles.earningLabel}>Items</Text>
                                <Text style={styles.earningValue}>{activeOrder.orderItems?.length || 0}</Text>
                            </View>
                        </View>

                        {/* Accept / Reject */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity 
                                style={[styles.halfButton, styles.rejectBtn]}
                                onPress={() => handleReject(activeOrder._id)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="close-circle" size={24} color="#FFF" />
                                <Text style={styles.halfButtonText}>REJECT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.halfButton, styles.acceptBtn]}
                                onPress={() => handleAccept(activeOrder._id)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                                        <Text style={styles.halfButtonText}>ACCEPT</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ) : isOnline && isActiveDelivery && activeOrder ? (
                    /* ===== ACTIVE DELIVERY IN PROGRESS ===== */
                    <View style={styles.activeOrderCard}>
                        <View style={styles.activeOrderHeader}>
                            <Text style={styles.activeOrderTitle}>CURRENT DELIVERY</Text>
                            <Text style={styles.activeOrderId}>#{activeOrder._id?.substring(18).toUpperCase()}</Text>
                        </View>
                        
                        {/* Status Steps */}
                        <View style={styles.statusStepsRow}>
                            {['Accepted', 'Picked Up', 'In Transit', 'Delivered'].map((label, i) => {
                                const currentStage = getStatusStage(activeOrder.deliveryPartnerStatus);
                                const isCompleted = i < currentStage;
                                const isCurrent = i === currentStage;
                                return (
                                    <View key={label} style={styles.statusStep}>
                                        <View style={[
                                            styles.statusDot,
                                            isCompleted && styles.statusDotCompleted,
                                            isCurrent && styles.statusDotCurrent,
                                        ]}>
                                            {isCompleted ? (
                                                <Ionicons name="checkmark" size={12} color="#FFF" />
                                            ) : (
                                                <Text style={[styles.statusDotNum, isCurrent && { color: '#FFF' }]}>{i + 1}</Text>
                                            )}
                                        </View>
                                        <Text style={[styles.statusStepLabel, (isCompleted || isCurrent) && { color: '#FFF' }]}>{label}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Pickup / Drop Info */}
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

                        {/* Quick Actions */}
                        <View style={styles.quickActionsRow}>
                            <TouchableOpacity style={styles.quickAction} onPress={() => openMapsNavigation(activeOrder.shippingAddress)}>
                                <Ionicons name="navigate" size={22} color="#60A5FA" />
                                <Text style={styles.quickActionText}>Navigate</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction} onPress={() => {
                                const phone = activeOrder.shippingAddress?.phone || activeOrder.user?.phone;
                                if (phone) Linking.openURL(`tel:${phone}`);
                            }}>
                                <Ionicons name="call" size={22} color="#34D399" />
                                <Text style={styles.quickActionText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('SupportChat', { orderId: activeOrder._id })}>
                                <Ionicons name="chatbubbles" size={22} color="#A78BFA" />
                                <Text style={styles.quickActionText}>Chat</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.massiveButton, { backgroundColor: PRIMARY_ACCENT }]}
                            onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder._id })}
                        >
                            <Text style={styles.massiveButtonText}>VIEW DETAILS</Text>
                            <Ionicons name="arrow-forward-circle" size={32} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* ===== EMPTY STATE ===== */
                    <View style={styles.emptyState}>
                        <Ionicons name={isOnline ? "bicycle" : "moon"} size={80} color="#4B5563" />
                        <Text style={styles.emptyStateTitle}>{isOnline ? 'Waiting for Orders...' : 'You are Offline'}</Text>
                        <Text style={styles.emptyStateSub}>
                            {isOnline ? 'Stay near Rice Mills to get orders faster.' : 'Go online to start receiving delivery orders.'}
                        </Text>
                    </View>
                )}

                {/* Performance Stats */}
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

                {/* Quick Stats & Earnings */}
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Earnings & Wallet</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{stats.todayOrders || 0}</Text>
                        <Text style={styles.statLabel}>Today's Trips</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}>
                        <Text style={styles.statValue}>₹{stats.walletBalance || 0}</Text>
                        <Text style={styles.statLabel}>Wallet Balance</Text>
                    </View>
                </View>
                
                {/* Cash to deposit separate row to highlight it */}
                <View style={[styles.statsRow, { marginTop: 16 }]}>
                    <View style={[styles.statBox, { backgroundColor: '#F59E0B', shadowColor: '#F59E0B', flex: 1 }]}>
                        <Text style={styles.statValue}>₹{stats.floatingCash || 0}</Text>
                        <Text style={styles.statLabel}>Floating Cash (To Deposit)</Text>
                    </View>
                </View>

                {/* New Partner Help / Incentives */}
                <TouchableOpacity 
                    style={styles.tutorialBanner}
                    onPress={() => navigation.navigate('Onboarding')}
                >
                    <View style={styles.tutorialIcon}>
                        <Ionicons name="school" size={24} color="#FFF" />
                    </View>
                    <View style={styles.tutorialTextContainer}>
                        <Text style={styles.tutorialTitle}>New to Delivery?</Text>
                        <Text style={styles.tutorialSub}>View tutorial, incentives, and withdrawal guide</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { padding: 20, backgroundColor: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#374151' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chatBadgeBtn: { position: 'relative', padding: 8 },
    unreadBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    unreadBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    greeting: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
    date: { fontSize: 16, color: '#9CA3AF', marginTop: 4 },
    sosButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, elevation: 8, shadowColor: '#EF4444', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 6 },
    sosText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    dutyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 24, elevation: 12, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10 },
    dutyLeft: { flexDirection: 'row', alignItems: 'center' },
    dutyDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
    dutyText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    // Incoming order
    incomingOrderCard: { backgroundColor: '#1F2937', borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 2, borderColor: '#FC8019', elevation: 20, shadowColor: '#FC8019', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16 },
    incomingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    incomingTitle: { color: '#FC8019', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginLeft: 12 },
    
    // Timer
    timerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    timerBarBg: { flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 3, marginRight: 12, overflow: 'hidden' },
    timerBarFill: { height: '100%', borderRadius: 3 },
    timerText: { color: '#FC8019', fontSize: 18, fontWeight: '900', width: 36, textAlign: 'right' },

    // Location
    locationContainer: { marginBottom: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 20 },
    locDot: { width: 12, height: 12, borderRadius: 6, marginRight: 14 },
    locInfo: { flex: 1 },
    locLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
    locationText: { color: '#F3F4F6', fontSize: 16, marginLeft: 16, fontWeight: '500' },
    dashLine: { width: 2, height: 20, backgroundColor: '#4B5563', marginLeft: 5, marginVertical: 4 },

    // Earnings row
    earningsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#374151', borderRadius: 12, padding: 16, marginBottom: 20 },
    earningItem: { alignItems: 'center' },
    earningLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 4 },
    earningValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },

    // Action buttons
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    halfButton: { flex: 1, flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
    rejectBtn: { backgroundColor: '#374151' },
    acceptBtn: { backgroundColor: '#16A34A', elevation: 8, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
    halfButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

    // Active order
    activeOrderCard: { backgroundColor: '#1F2937', borderRadius: 28, padding: 24, marginBottom: 24, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12 },
    activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    activeOrderTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    activeOrderId: { color: '#9CA3AF', fontSize: 16, fontWeight: '600' },
    
    // Status steps
    statusStepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
    statusStep: { alignItems: 'center', flex: 1 },
    statusDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    statusDotCompleted: { backgroundColor: '#16A34A' },
    statusDotCurrent: { backgroundColor: '#FC8019' },
    statusDotNum: { color: '#6B7280', fontSize: 12, fontWeight: 'bold' },
    statusStepLabel: { color: '#6B7280', fontSize: 10, fontWeight: '600', textAlign: 'center' },

    // Quick actions
    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#111827', borderRadius: 12, padding: 12 },
    quickAction: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    quickActionText: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginTop: 4 },

    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: 16, borderRadius: 12, marginBottom: 20 },
    paymentLabel: { color: '#D1D5DB', fontSize: 18, fontWeight: '600' },
    paymentAmount: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    massiveButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20, elevation: 8, shadowColor: '#FC8019', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8 },
    massiveButtonText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyStateTitle: { color: '#F3F4F6', fontSize: 24, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
    emptyStateSub: { color: '#9CA3AF', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
    sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 16, letterSpacing: 0.5 },
    performanceCard: { backgroundColor: '#1F2937', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, backgroundColor: '#3B82F6', padding: 20, borderRadius: 20, alignItems: 'center', marginHorizontal: 8, elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
    statValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 8 },
    statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700' },
    statBoxSmall: { flex: 1, alignItems: 'center' },
    statValueSmall: { color: '#34D399', fontSize: 26, fontWeight: '900', marginBottom: 4 },
    statLabelSmall: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },

    // Tutorial Banner
    tutorialBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', borderRadius: 20, padding: 16, marginTop: 24, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
    tutorialIcon: { backgroundColor: '#8B5CF6', padding: 12, borderRadius: 16, marginRight: 16 },
    tutorialTextContainer: { flex: 1 },
    tutorialTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    tutorialSub: { color: '#9CA3AF', fontSize: 13, lineHeight: 18 }
});

export default DeliveryPartnerDashboard;
