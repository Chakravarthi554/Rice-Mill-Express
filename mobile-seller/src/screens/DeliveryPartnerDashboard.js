import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, SafeAreaView, Switch, Image, Linking, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { auth } from '../config/firebase';

const DeliveryPartnerDashboard = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        todayOrders: 0,
        activeOrders: 0,
        totalOrdersCount: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        floatingCash: 0,
        walletBalance: 0
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [autoAssign, setAutoAssign] = useState(true);

    const { user, token } = useSelector(state => state.auth);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersRes, statsRes, walletRes] = await Promise.all([
                apiService.getAssignedOrders(),
                apiService.getDPDashboard(),
                apiService.getWalletData().catch(err => {
                    console.log('Wallet fetch warning:', err.message);
                    return { data: { balance: 0 } };
                })
            ]);

            let ordersData = [];
            if (ordersRes.data && Array.isArray(ordersRes.data.orders)) {
                ordersData = ordersRes.data.orders;
            } else if (Array.isArray(ordersRes.data)) {
                ordersData = ordersRes.data;
            }
            setOrders(ordersData);

            if (statsRes.data && statsRes.data.stats) {
                const s = statsRes.data.stats;
                setStats({
                    totalOrders: s.totalDeliveries || 0,
                    todayOrders: s.todayOrders || 0,
                    activeOrders: s.activeDeliveries || 0,
                    totalOrdersCount: s.totalOrdersCount || 0,
                    totalEarnings: s.totalEarnings || 0,
                    todayEarnings: s.todayEarnings || 0,
                    floatingCash: s.floatingCash || 0,
                    walletBalance: walletRes.data?.balance || 0
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Don't show alert on every interval refresh to avoid spamming, 
            // but for the initial load it's helpful.
            if (!refreshing) {
                // Silent failure for periodic updates is often better in mobile,
                // but let's log the full URL to help debug
                const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
                console.log(`❌ Dashboard fetch failed for: ${fullUrl}`);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user && auth.currentUser) {
            fetchDashboardData();
        }
    }, [user, token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Use only active/assigned orders for the lists
    const activeOrdersList = useMemo(() => {
        if (!Array.isArray(orders)) return [];
        return orders.filter(order => !['delivered', 'cancelled'].includes(order.orderStatus));
    }, [orders]);

    const handleCall = (phone) => {
        if (!phone) {
            Alert.alert('Error', 'Customer phone number unavailable');
            return;
        }
        Linking.openURL(`tel:${phone}`).catch(err => {
            console.error('Error opening dialer:', err);
            Alert.alert('Error', 'Could not open phone dialer');
        });
    };

    const handleNavigate = (address) => {
        if (!address || (!address.street && !address.city)) {
            Alert.alert('Error', 'Address location unavailable');
            return;
        }
        
        const fullAddress = `${address.houseNumber || ''} ${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.pinCode || ''}`;
        const encodedAddress = encodeURIComponent(fullAddress);
        
        let url = Platform.select({
            ios: `maps:0,0?q=${encodedAddress}`,
            android: `geo:0,0?q=${encodedAddress}`,
        });

        // Fallback to google maps url
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(webUrl);
            }
        }).catch(err => {
            console.error('Error opening maps:', err);
            Linking.openURL(webUrl);
        });
    };

    const handleRemitNow = async () => {
        if (stats.floatingCash <= 0) {
            Alert.alert('No Cash', 'You have no floating cash to remit.');
            return;
        }

        Alert.alert(
            'Remit COD Cash',
            `Are you sure you want to remit ₹${stats.floatingCash} collected from COD orders?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Remit',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const res = await apiService.remitCash();
                            if (res.data && res.data.success) {
                                Alert.alert('Success', res.data.message || 'Remittance completed successfully');
                                fetchDashboardData();
                            }
                        } catch (error) {
                            console.error('Remittance error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to process remittance');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRaiseIssue = (orderId) => {
        if (!orderId) {
            Alert.alert('Error', 'Please select an order first');
            return;
        }
        
        Alert.alert(
            'Report Problem',
            'What is the issue with this delivery?',
            [
                { text: 'Customer Not Home', onPress: () => submitIssue(orderId, 'Customer Not Home') },
                { text: 'Location Wrong', onPress: () => submitIssue(orderId, 'Location Wrong') },
                { text: 'Order Damaged', onPress: () => submitIssue(orderId, 'Order Damaged') },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const submitIssue = async (orderId, reason) => {
        try {
            setLoading(true);
            await apiService.raiseIssue(orderId, {
                issueType: reason,
                description: `Issue reported by partner: ${reason}`
            });
            Alert.alert('Success', 'Problem reported to supervisor');
        } catch (error) {
            Alert.alert('Error', 'Could not report problem');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (orderId) => {
        if (orderId) {
            navigation.navigate('OrderDetails', { orderId });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.topHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoCircle}>
                        <FontAwesome5 name="seedling" size={16} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Rice Mill Express</Text>
                        <Text style={styles.headerSubtitle}>Delivery Partner • DP-2403-001</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.headerRight} onPress={() => navigation.navigate('DeliveryProfile')}>
                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Working</Text>
                    </View>
                    <View style={styles.profilePicPlaceholder}>
                        <Ionicons name="person" size={20} color="#666" />
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Earnings & Wallet Card */}
                <View style={styles.card}>
                    <View style={styles.earningsHeader}>
                        <View>
                            <Text style={styles.cardSubtitle}>MY EARNINGS TODAY & WALLET</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                                <Text style={styles.earningsAmount}>₹{stats.todayEarnings || 0}</Text>
                                <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>Today</Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                                <Text style={[styles.earningsAmount, { color: '#4F46E5', fontSize: 24 }]}>₹{stats.walletBalance || 0}</Text>
                                <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 8 }}>To Withdraw</Text>
                            </View>
                            
                            <Text style={[styles.earningsDetails, { marginTop: 8 }]}>{stats.todayOrders || 0} assigned • {stats.totalOrders || 0} delivered all-time</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingLabel}>Rating</Text>
                            <Text style={styles.ratingValue}>4.8 ★</Text>
                        </View>
                    </View>
                    <View style={styles.earningsActions}>
                         <TouchableOpacity style={styles.btnBlue} onPress={() => navigation.navigate('DeliveryHistory')}>
                            <Text style={styles.btnBlueText}>My Work History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnOutlineIcon} onPress={() => navigation.navigate('DeliveryHistory')}>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.btnGreenIcon, { marginLeft: 8, paddingHorizontal: 16 }]} 
                            onPress={() => navigation.navigate('Withdraw')}
                        >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Withdraw Money</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Floating Cash Card */}
                <View style={styles.card}>
                    <View style={styles.floatingHeader}>
                        <View>
                             <Text style={styles.cardSubtitle}>CASH TO PAY BACK</Text>
                            <Text style={{ ...styles.floatingAmount, color: '#EA580C' }}>₹{stats.floatingCash || 0}</Text>
                        </View>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.progressLabel}>My Limit</Text>
                            <Text style={styles.progressValue}>{Math.min(100, Math.round(((stats.floatingCash || 0) / 5000) * 100))}%</Text>
                        </View>
                    </View>
                     <Text style={styles.limitText}>Limit: ₹5,000 • Amount you have from cash orders</Text>
                    
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round(((stats.floatingCash || 0) / 5000) * 100))}%` }]} />
                    </View>

                    <View style={styles.remitActions}>
                         <TouchableOpacity style={styles.btnOrangeFull} onPress={handleRemitNow}>
                            <Text style={styles.btnOrangeText}>Pay to Office Now</Text>
                        </TouchableOpacity>
                         <TouchableOpacity style={styles.btnBlackIcon} onPress={handleRemitNow}>
                            <Ionicons name="wallet-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.tipText}>Tip: Use UPI QR for instant remittance and instant confirmation.</Text>
                </View>

                {/* Active Orders Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Deliveries ({activeOrdersList.length || 0})</Text>
                    <View style={styles.autoAssignBox}>
                        <Text style={styles.autoAssignText}>Auto-assign ON</Text>
                        <Switch 
                            value={autoAssign} 
                            onValueChange={setAutoAssign}
                            trackColor={{ false: "#d1d5db", true: "#dcfce3" }}
                            thumbColor={autoAssign ? "#16a34a" : "#9ca3af"}
                        />
                    </View>
                </View>

                {activeOrdersList.length === 0 ? (
                    <View style={styles.dummyOrderCard}>
                        {/* Placeholder design if activeOrders is empty - mimicking Image 1 data */}
                        <OrderCardMock 
                            id="RM240401-102"
                            title="Sona Masoori Premium 25kg x 2"
                            type="COD"
                            amount="₹1,250"
                            eta="12 mins"
                            isFirst={true}
                        />
                        <OrderCardMock 
                            id="RM240401-103"
                            title="Basmati Gold 10kg x 1"
                            type="Prepaid"
                            customer="Priya Verma"
                            dist="4.8 km"
                            eta="25 mins"
                        />
                        <OrderCardMock 
                            id="RM240401-104"
                            title="Organic Brown Rice 5kg x 1"
                            type="COD"
                            amount="₹600"
                            customer="Sunita Rao"
                            dist="6.1 km"
                            eta="40 mins"
                        />
                    </View>
                ) : (
                    activeOrdersList.map((order, idx) => (
                        <TouchableOpacity 
                            key={order._id} 
                            style={styles.orderCard} 
                            onPress={() => handleViewDetails(order._id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.orderCardRow}>
                                <View style={styles.orderImgPlaceholder}>
                                    <Ionicons name="image-outline" size={24} color="#ccc" />
                                </View>
                                <View style={styles.orderInfo}>
                                    <Text style={styles.orderIdText}>#{order._id.substring(18).toUpperCase()}</Text>
                                    <Text style={styles.orderItemText} numberOfLines={2}>
                                        {/* Typically items would be mapped here. Using placeholder for missing data */}
                                        Rice Product Delivery
                                    </Text>
                                    <Text style={styles.customerText}>
                                        {order.shippingAddress?.name || 'Customer'} • 4.8 km
                                    </Text>
                                </View>
                                <View style={styles.orderMeta}>
                                    <Text style={[styles.orderType, { color: order.paymentMethod === 'COD' ? '#ea580c' : '#16a34a' }]}>
                                        {order.paymentMethod === 'COD' ? `COD ₹${order.totalAmount}` : 'Prepaid'}
                                    </Text>
                                    <Text style={styles.etaText}>ETA: 25 mins</Text>
                                </View>
                            </View>
                            <View style={styles.orderActions}>
                                <TouchableOpacity style={styles.btnWhiteIcon} onPress={() => handleCall(order.shippingAddress?.phone)}>
                                    <Ionicons name="call" size={16} color="#000" />
                                    <Text style={styles.btnWhiteText}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnGreenIcon} onPress={() => handleNavigate(order.shippingAddress)}>
                                    <Ionicons name="navigate" size={16} color="#fff" />
                                    <Text style={styles.btnGreenText}>Navigate</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* Quick Remittance */}
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Quick Remittance</Text>
                <View style={styles.card}>
                    <View style={styles.qrRow}>
                        <View style={styles.qrImgPlaceholder}>
                            <Ionicons name="qr-code" size={40} color="#333" />
                        </View>
                        <View style={styles.qrInfo}>
                            <Text style={styles.qrTitle}>Pay ₹{stats.floatingCash || 0} to Rice Mill Office</Text>
                            <Text style={styles.qrSubtitle}>Scan QR with PhonePe / GPay / BHIM</Text>
                            <View style={styles.qrButtons}>
                                 <TouchableOpacity style={styles.btnOrangeSmall} onPress={handleRemitNow}>
                                    <Text style={styles.btnOrangeText}>I have paid</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnOutlineSmall} onPress={fetchDashboardData}>
                                    <Text style={styles.btnOutlineText}>Refresh</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.bankRow}>
                        <View>
                            <Text style={styles.bankTextLight}>Or deposit cash at bank / CDM</Text>
                            <Text style={styles.bankTextBold}>A/C: Rice Mill Express Pvt Ltd</Text>
                            <Text style={styles.bankTextLight}>A/C: 1234567890 • IFSC: HDFC0001234</Text>
                        </View>
                         <TouchableOpacity style={styles.btnOutlineSmall} onPress={() => Alert.alert('Upload Receipt', 'Functionality coming soon: Please remit via UPI for instant confirmation.')}>
                            <Text style={styles.btnOutlineText}>Upload Receipt</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Remittance History */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>Remittance History</Text>
                    <Text style={styles.historyLink}>Last 4 transactions</Text>
                </View>
                <View style={styles.historyCard}>
                    <HistoryItem title="UPI — ₹2,500" desc="Completed • 19 Mar, 10:23 AM" status="Verified" statusColor="#16a34a" />
                    <HistoryItem title="Cash Deposit — ₹1,000" desc="Pending verification • 17 Mar, 3:12 PM" status="Pending" statusColor="#ea580c" />
                    <HistoryItem title="UPI — ₹750" desc="Completed • 15 Mar, 9:02 PM" status="Verified" statusColor="#16a34a" />
                    <HistoryItem title="Hub Drop — ₹2,000" desc="Completed • 10 Mar, 12:20 PM" status="Verified" statusColor="#16a34a" noBorder={true} />
                </View>

                {/* Spacing for bottom bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Floating Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.holdingInfo}>
                    <Text style={styles.holdingLabel}>Cash with me</Text>
                    <Text style={styles.holdingAmount}>₹{stats.floatingCash || 0}</Text>
                </View>
                 <TouchableOpacity style={styles.btnOrangeFlex} onPress={handleRemitNow}>
                    <Text style={styles.btnOrangeText}>Pay Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnOutlineFlex} onPress={() => handleRaiseIssue(activeOrdersList[0]?._id)}>
                    <Text style={styles.btnOutlineText}>Report Problem</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- Mock Components for exact UI design match ---
const OrderCardMock = ({ id, title, type, amount, eta, customer, dist, isFirst }) => (
    <View style={styles.orderCard}>
        <View style={styles.orderCardRow}>
            <View style={styles.orderImgPlaceholder}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
            <View style={styles.orderInfo}>
                <Text style={styles.orderIdText}>#{id}</Text>
                <Text style={styles.orderItemText} numberOfLines={2}>{title}</Text>
                {customer && <Text style={styles.customerText}>{customer} • {dist}</Text>}
            </View>
            <View style={styles.orderMeta}>
                <Text style={[styles.orderType, { color: type === 'COD' ? '#ea580c' : '#16a34a' }]}>
                    {type} {amount}
                </Text>
                <Text style={styles.etaText}>ETA: {eta}</Text>
            </View>
        </View>
        {!isFirst && (
             <View style={styles.orderActions}>
                 <TouchableOpacity style={styles.btnWhiteIcon} onPress={() => Alert.alert('Info', `Calling customer for mock order #${id}`)}>
                    <Ionicons name="call" size={16} color="#000" />
                    <Text style={styles.btnWhiteText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGreenIcon} onPress={() => Alert.alert('Info', `Navigating to ${title}`)}>
                    <Ionicons name="location-outline" size={16} color="#fff" />
                    <Text style={styles.btnGreenText}>Navigate</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

const HistoryItem = ({ title, desc, status, statusColor, noBorder }) => (
    <View style={[styles.historyItem, !noBorder && styles.historyBorder]}>
        <View>
            <Text style={styles.historyTitle}>{title}</Text>
            <Text style={styles.historyDesc}>{desc}</Text>
        </View>
        <Text style={[styles.historyStatus, { color: statusColor }]}>{status}</Text>
    </View>
);

// --- Styles mapping the exact imagery ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16A34A',
        marginRight: 4,
    },
    onlineText: {
        fontSize: 12,
        color: '#16A34A',
        fontWeight: '600',
    },
    profilePicPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    earningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    earningsAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#16A34A',
    },
    earningsDetails: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    ratingBox: {
        alignItems: 'flex-end',
    },
    ratingLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    ratingValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    earningsActions: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'center',
    },
    btnBlue: {
        flex: 1,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 12,
    },
    btnBlueText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    btnOutlineIcon: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    floatingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    floatingAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#EA580C',
        marginTop: 2,
    },
    progressTextContainer: {
        alignItems: 'flex-end',
    },
    progressLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    limitText: {
        fontSize: 13,
        color: '#6B7280',
        marginVertical: 8,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        marginBottom: 16,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#EA580C',
        borderRadius: 3,
    },
    remitActions: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    btnOrangeFull: {
        flex: 1,
        backgroundColor: '#EA580C',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 12,
    },
    btnOrangeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    btnBlackIcon: {
        backgroundColor: '#111827',
        borderRadius: 8,
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipText: {
        fontSize: 12,
        color: '#9CA3AF',
        lineHeight: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    autoAssignBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    autoAssignText: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 8,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    orderCardRow: {
        flexDirection: 'row',
    },
    orderImgPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderIdText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    orderItemText: {
        fontSize: 13,
        color: '#4B5563',
        marginTop: 2,
    },
    customerText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    orderMeta: {
        alignItems: 'flex-end',
    },
    orderType: {
        fontSize: 13,
        fontWeight: '700',
    },
    etaText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    orderActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    btnWhiteIcon: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    btnWhiteText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    btnGreenIcon: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#14532D',
        borderRadius: 8,
        paddingVertical: 8,
    },
    btnGreenText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    qrRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    qrImgPlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    qrInfo: {
        flex: 1,
    },
    qrTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    qrSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    qrButtons: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    btnOrangeSmall: {
        backgroundColor: '#EA580C',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    btnOutlineSmall: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    btnOutlineText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    bankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bankTextLight: {
        fontSize: 11,
        color: '#6B7280',
    },
    bankTextBold: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginVertical: 2,
    },
    historyLink: {
        fontSize: 12,
        color: '#6B7280',
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    historyBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    historyDesc: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    historyStatus: {
        fontSize: 13,
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
        gap: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    holdingInfo: {
        marginRight: 4,
    },
    holdingLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
    holdingAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#EA580C',
    },
    btnOrangeFlex: {
        flex: 1,
        backgroundColor: '#EA580C',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnOutlineFlex: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    }
});

export default DeliveryPartnerDashboard;

