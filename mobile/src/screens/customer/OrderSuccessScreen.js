// [Premium Figma-level Redesign — OrderSuccessScreen]
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

const OrderSuccessScreen = ({ navigation, route }) => {
    const { orderId } = route.params || {};
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.content}>
                {/* Success icon */}
                <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.successInner}>
                        <Feather name="check" size={48} color="#16A34A" />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                    <Text style={styles.title}>Order Placed! 🎉</Text>
                    <Text style={styles.subtitle}>Your order has been received and will be prepared right away.</Text>

                    {orderId && (
                        <View style={styles.orderIdCard}>
                            <Text style={styles.orderIdLabel}>Order ID</Text>
                            <Text style={styles.orderIdValue}>#{String(orderId).slice(-10).toUpperCase()}</Text>
                        </View>
                    )}

                    {/* Info tiles */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoTile}>
                            <Text style={{ fontSize: 24, marginBottom: 6 }}>📦</Text>
                            <Text style={styles.infoTileTitle}>Being Prepared</Text>
                            <Text style={styles.infoTileSub}>At the mill</Text>
                        </View>
                        <View style={styles.infoTile}>
                            <Text style={{ fontSize: 24, marginBottom: 6 }}>🚚</Text>
                            <Text style={styles.infoTileTitle}>Quick Delivery</Text>
                            <Text style={styles.infoTileSub}>Expected soon</Text>
                        </View>
                        <View style={styles.infoTile}>
                            <Text style={{ fontSize: 24, marginBottom: 6 }}>🔔</Text>
                            <Text style={styles.infoTileTitle}>Updates</Text>
                            <Text style={styles.infoTileSub}>Via notifications</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('CustomerTabs', { screen: 'Orders' })}
                >
                    <Feather name="package" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Track My Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' })}
                >
                    <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

    successCircle: {
        width: 130, height: 130, borderRadius: 65, backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center', marginBottom: 32,
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
    },
    successInner: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#DCFCE7',
        alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#16A34A',
    },

    title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

    orderIdCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 28, width: '100%', borderWidth: 1, borderColor: '#F3F4F6' },
    orderIdLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    orderIdValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

    infoGrid: { flexDirection: 'row', gap: 12, width: '100%' },
    infoTile: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    infoTileTitle: { fontSize: 12, fontWeight: '700', color: '#111827', textAlign: 'center' },
    infoTileSub: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

    footer: { padding: 20, paddingBottom: 32, gap: 12 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', borderRadius: 18, paddingVertical: 17, gap: 10, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    secondaryBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#E5E7EB' },
    secondaryBtnText: { color: '#374151', fontSize: 15, fontWeight: '700' },
});

export default OrderSuccessScreen;
