import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const OrderDetailsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const PRIMARY_ACCENT = '#FC8019'; // Swiggy Orange for high visibility

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryOrderById(orderId);
            const orderData = response.data?.order || response.data;
            setOrder(orderData);
        } catch (error) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Failed to load order');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleNavigate = (address) => {
        if (address) {
            const query = encodeURIComponent(`${address.houseNumber} ${address.street} ${address.city}`);
            Linking.openURL(`google.navigation:q=${query}`);
        }
    };

    const handleAction = async (actionType) => {
        try {
            setActionLoading(true);
            if (actionType === 'start') {
                await apiService.startNavigation(orderId);
            } else if (actionType === 'pickup') {
                await apiService.confirmPickup(orderId);
            }
            fetchOrderDetails();
        } catch (error) {
            Alert.alert('Error', 'Action failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRaiseIssue = () => {
        Alert.alert(
            "Raise an Issue",
            "What is the problem?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Customer Unavailable", 
                    onPress: () => submitIssue("Customer Unavailable") 
                },
                { 
                    text: "Wrong Address", 
                    onPress: () => submitIssue("Wrong Address") 
                }
            ]
        );
    };

    const submitIssue = async (issueType) => {
        try {
            await apiService.raiseIssue(orderId, { issueType, description: "Reported via app" });
            Alert.alert("Issue Raised", "Support has been notified. They will contact you shortly.");
        } catch (error) {
            Alert.alert("Error", "Could not raise issue. Call support directly.");
        }
    };

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
            </SafeAreaView>
        );
    }

    const isPickedUp = ['picked_up', 'in_transit', 'out_for_delivery'].includes(order.deliveryPartnerStatus);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order._id?.substring(18).toUpperCase()}</Text>
                <TouchableOpacity onPress={handleRaiseIssue}>
                    <Ionicons name="warning" size={28} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* STEP 1: PICKUP */}
                <View style={[styles.stepCard, isPickedUp && styles.stepCompleted]}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
                        <Text style={styles.stepTitle}>Pick up from Store</Text>
                        {isPickedUp && <Ionicons name="checkmark-circle" size={28} color="#34D399" />}
                    </View>
                    <Text style={styles.entityName}>{order.seller?.businessDetails?.businessName || 'Seller'}</Text>
                    <Text style={styles.addressText}>{order.seller?.address?.street || 'Address not available'}</Text>
                    
                    {!isPickedUp && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleCall(order.seller?.phone)}>
                                <Ionicons name="call" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleNavigate(order.seller?.address)}>
                                <Ionicons name="navigate" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.mainActionBtn, { backgroundColor: PRIMARY_ACCENT }]}
                                onPress={() => handleAction('pickup')}
                            >
                                {actionLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.mainActionText}>MARK PICKED UP</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* STEP 2: DELIVER */}
                <View style={[styles.stepCard, !isPickedUp && styles.stepDisabled]}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepBadge, !isPickedUp && {backgroundColor: '#374151'}]}><Text style={styles.stepBadgeText}>2</Text></View>
                        <Text style={styles.stepTitle}>Deliver to Customer</Text>
                    </View>
                    <Text style={styles.entityName}>{order.shippingAddress?.name}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress?.houseNumber}, {order.shippingAddress?.street}</Text>
                    
                    {isPickedUp && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleCall(order.shippingAddress?.phone)}>
                                <Ionicons name="call" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleNavigate(order.shippingAddress)}>
                                <Ionicons name="navigate" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* PAYMENT INFO */}
                <View style={styles.paymentCard}>
                    <Text style={styles.paymentLabel}>To Collect (Cash on Delivery)</Text>
                    <Text style={styles.paymentAmount}>₹{order.totalPrice}</Text>
                </View>

            </ScrollView>

            {/* MASSIVE BOTTOM BUTTON FOR COMPLETION */}
            {isPickedUp && (
                <View style={styles.bottomSafeArea}>
                    <TouchableOpacity 
                        style={[styles.massiveCompleteBtn, { backgroundColor: '#16A34A' }]}
                        onPress={() => navigation.navigate('DeliveryConfirmation', { orderId: order._id })}
                    >
                        <Text style={styles.massiveCompleteText}>COLLECT CASH & TAKE PHOTO</Text>
                        <Ionicons name="camera" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    stepCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    stepDisabled: { opacity: 0.5 },
    stepCompleted: { borderColor: '#34D399' },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FC8019', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    stepBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    stepTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1 },
    entityName: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    addressText: { color: '#9CA3AF', fontSize: 16, lineHeight: 24, marginBottom: 20 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    mainActionBtn: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    mainActionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    paymentCard: { backgroundColor: '#374151', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 40 },
    paymentLabel: { color: '#D1D5DB', fontSize: 16, marginBottom: 8 },
    paymentAmount: { color: '#FFF', fontSize: 40, fontWeight: '900' },
    bottomSafeArea: { padding: 20, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    massiveCompleteBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 72, borderRadius: 16, paddingHorizontal: 24 },
    massiveCompleteText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});

export default OrderDetailsScreen;
