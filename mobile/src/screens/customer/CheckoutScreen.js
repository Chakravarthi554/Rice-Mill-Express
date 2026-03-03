import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, RadioButton, Divider, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { clearCart } from '../../redux/actions/cartActions';
import { getRewards } from '../../redux/actions/rewardsActions';
import { API_URL } from '../../config/env';

const CheckoutScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { cartItems } = cart;

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);

    // Rewards State
    const [useRewards, setUseRewards] = useState(false);
    const rewardsState = useSelector((state) => state.rewards);
    const { rewards } = rewardsState;
    const rewardsBalance = rewards?.balance || 0; // Ensure backend sends 'balance'

    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
            dispatch(getRewards());
        }, [])
    );

    const fetchAddresses = async () => {
        try {
            setFetchingAddresses(true);
            const response = await apiService.getAddresses();
            const addrList = response.data || [];
            setAddresses(addrList);
            if (addrList.length > 0) {
                setSelectedAddress(addrList[0]);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setFetchingAddresses(false);
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.product?.price || 0) * (item.quantity || 1), 0);
    };

    const calculateDiscount = () => {
        if (!useRewards) return 0;
        const subtotal = calculateSubtotal();
        // Logic: 1 Point = ₹1, Max discount = Subtotal
        return Math.min(rewardsBalance, subtotal);
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    useEffect(() => {
        const handleDeepLink = (event) => {
            console.log('🔗 Deep link received:', event.url);
            if (event.url && event.url.includes('payment-success')) {
                // Extract orderId from ricemill://payment-success?orderId=...
                const match = event.url.match(/orderId=([^&]+)/);
                const orderId = match ? match[1] : null;

                if (orderId) {
                    console.log('✅ Payment success deep link for order:', orderId);
                    dispatch(clearCart());
                    navigation.navigate('OrderSuccess', { orderId });
                }
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened via a deep link
        Linking.getInitialURL().then(url => {
            if (url) handleDeepLink({ url });
        });

        return () => subscription.remove();
    }, [dispatch, navigation]);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please select a shipping address. If you have none, go to Addresses and add one.');
            return;
        }

        const total = calculateTotal();

        // Business Rule: Min ₹1500 for COD
        if (paymentMethod === 'cod' && total < 1500) {
            Alert.alert('Minimum Order Required', 'Cash on Delivery is only available for orders above ₹1500. Please add more items or use Online Payment.');
            return;
        }

        if (paymentMethod === 'online') {
            try {
                setLoading(true);
                // 1. Create Order on our backend first
                const orderData = {
                    shippingAddressId: selectedAddress._id,
                    paymentMethod: 'online',
                    orderItems: cartItems.map(item => ({
                        product: item.product?._id,
                        qty: item.quantity || item.qty || 1,
                    })),
                    useRewards // Pass flag to backend
                };
                const response = await apiService.createOrder(orderData);
                const order = Array.isArray(response.data.orders) ? response.data.orders[0] : (response.data.order || response.data);

                // 2. Redirect to a secure payment page on our backend
                const token = await apiService.getAuthToken();
                const paymentUrl = `${API_URL}/api/payments/razorpay/pay/${order._id}?token=${token}`;
                console.log('🔗 Redirecting to payment URL (with token):', paymentUrl);

                // Open terminal to let user know
                Alert.alert(
                    'Proceeding to Payment',
                    'You will be redirected to our secure payment gateway.',
                    [
                        {
                            text: 'OK',
                            onPress: async () => {
                                await Linking.openURL(paymentUrl);
                                // We don't clear cart or navigate here anymore.
                                // We wait for the deep link or for the user to return manually.
                                setLoading(false);
                            }
                        }
                    ]
                );
                return;
            } catch (error) {
                console.error('Online payment error:', error);
                Alert.alert('Payment Error', error.response?.data?.message || 'Failed to initiate payment.');
                setLoading(false);
                return;
            }
        }

        try {
            setLoading(true);
            const orderData = {
                shippingAddressId: selectedAddress._id,
                paymentMethod,
                orderItems: cartItems.map(item => ({
                    product: item.product?._id,
                    qty: item.quantity || item.qty || 1,
                })),
                useRewards // Pass flag to backend
            };

            const response = await apiService.createOrder(orderData);

            // Clear cart in Redux
            dispatch(clearCart());

            // Handle multiple orders response (if backend returns array)
            const createdOrder = Array.isArray(response.data.orders) ? response.data.orders[0] : response.data;
            navigation.navigate('OrderSuccess', { orderId: createdOrder._id });
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', 'Failed to place order. ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <MaterialIcons name="shopping-cart" size={100} color="#ccc" />
                <Text style={styles.emptyText}>Nothing to checkout!</Text>
                <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.btn}>
                    Go Shopping
                </Button>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Order Summary */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="shopping-basket" size={24} color="#4CAF50" />
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                    </View>
                    {cartItems.map((item, index) => (
                        <View key={index} style={styles.summaryItem}>
                            <Text style={styles.itemText}>{item.product?.name || 'Product'} x {item.quantity || 1}</Text>
                            <Text style={styles.itemPrice}>₹{(item.product?.price || 0) * (item.quantity || 1)}</Text>
                        </View>
                    ))}

                    {useRewards && (
                        <View style={styles.summaryItem}>
                            <Text style={[styles.itemText, { color: '#4CAF50' }]}>Reward Discount</Text>
                            <Text style={[styles.itemPrice, { color: '#4CAF50' }]}>- ₹{calculateDiscount()}</Text>
                        </View>
                    )}

                    <Divider style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Reward Points */}
            {
                rewardsBalance > 0 && (
                    <Card style={styles.card}>
                        <Card.Content style={styles.rewardContent}>
                            <View style={styles.rewardInfo}>
                                <MaterialIcons name="stars" size={24} color="#FFC107" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.rewardTitle}>Use Reward Points</Text>
                                    <Text style={styles.rewardSubtitle}>Available: {rewardsBalance} pts</Text>
                                </View>
                            </View>
                            <Switch
                                value={useRewards}
                                onValueChange={setUseRewards}
                                color="#4CAF50"
                            />
                        </Card.Content>
                    </Card>
                )
            }

            {/* Shipping Address */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-on" size={24} color="#4CAF50" />
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Addresses')}>
                            <Text style={styles.editLink}>Manage</Text>
                        </TouchableOpacity>
                    </View>

                    {fetchingAddresses ? (
                        <ActivityIndicator color="#4CAF50" style={{ margin: 20 }} />
                    ) : addresses.length === 0 ? (
                        <View style={styles.emptyAddress}>
                            <Text style={styles.emptyAddressText}>No saved addresses found.</Text>
                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('AddEditAddress')}
                                style={styles.miniBtn}
                            >
                                Add New Address
                            </Button>
                        </View>
                    ) : (
                        <RadioButton.Group onValueChange={id => setSelectedAddress(addresses.find(a => a._id === id))} value={selectedAddress?._id}>
                            {addresses.map((addr) => (
                                <TouchableOpacity
                                    key={addr._id}
                                    style={styles.addressItem}
                                    onPress={() => setSelectedAddress(addr)}
                                >
                                    <RadioButton value={addr._id} color="#4CAF50" />
                                    <View style={styles.addressDetails}>
                                        <Text style={styles.addressName}>{addr.name}</Text>
                                        <Text style={styles.addressText}>
                                            {addr.houseNumber}, {addr.colony && `${addr.colony}, `}{addr.street}
                                        </Text>
                                        {addr.landmark && (
                                            <Text style={styles.addressText}>Landmark: {addr.landmark}</Text>
                                        )}
                                        <Text style={styles.addressText}>{addr.city}, {addr.state} - {addr.pinCode}</Text>
                                        <Text style={styles.addressText}>Phone: {addr.phone}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </RadioButton.Group>
                    )}
                </Card.Content>
            </Card>

            {/* Payment Method */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="payment" size={24} color="#4CAF50" />
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                    </View>
                    <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
                        <TouchableOpacity style={styles.radioRow} onPress={() => setPaymentMethod('cod')}>
                            <RadioButton value="cod" color="#4CAF50" />
                            <Text style={styles.radioLabel}>Cash on Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.radioRow} onPress={() => setPaymentMethod('online')}>
                            <RadioButton value="online" color="#4CAF50" />
                            <Text style={styles.radioLabel}>Online Payment</Text>
                        </TouchableOpacity>
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handlePlaceOrder}
                loading={loading}
                disabled={loading || !selectedAddress}
                style={styles.placeOrderBtn}
                contentStyle={styles.placeOrderBtnContent}
            >
                PLACE ORDER - ₹{calculateTotal()}
            </Button>
            <View style={{ height: 40 }} />
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
        color: '#333',
    },
    editLink: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    divider: {
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    addressDetails: {
        flex: 1,
        marginLeft: 10,
    },
    addressName: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333',
    },
    addressText: {
        fontSize: 13,
        color: '#666',
    },
    emptyAddress: {
        alignItems: 'center',
        padding: 20,
    },
    emptyAddressText: {
        color: '#999',
        marginBottom: 15,
    },
    miniBtn: {
        borderColor: '#4CAF50',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    radioLabel: {
        fontSize: 15,
        marginLeft: 10,
    },
    placeOrderBtn: {
        marginTop: 10,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        elevation: 4,
    },
    placeOrderBtnContent: {
        paddingVertical: 8,
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginVertical: 20,
    },
    btn: {
        backgroundColor: '#4CAF50',
    },
    rewardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rewardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rewardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    rewardSubtitle: {
        fontSize: 12,
        color: '#666',
    },
});

export default CheckoutScreen;
