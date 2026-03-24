import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const DeliveryPartnerProfileScreen = ({ navigation }) => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Top Bar matching the design */}
            <View style={styles.appBar}>
                <Text style={styles.appBarTitle}>Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.avatarCircle}>
                        <MaterialIcons name="person" size={50} color="#fff" />
                    </View>
                    <Text style={styles.heroName}>{user?.name || 'Narender'}</Text>
                    <Text style={styles.heroRole}>Delivery Partner</Text>
                </View>

                {/* Personal Information Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Personal Information</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name="person" size={22} color="#555" />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={styles.label}>Full Name</Text>
                            <Text style={styles.value}>{user?.name || 'Narender'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name="email" size={22} color="#555" />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{user?.email || '23a1a66g7@gmail.com'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <MaterialIcons name="phone" size={22} color="#555" />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>{user?.phone || '7418529630'}</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Settings</Text>

                    <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('DeliveryHistory')}>
                        <View style={styles.actionIconBox}>
                            <MaterialIcons name="history" size={24} color="#333" />
                        </View>
                        <Text style={styles.actionText}>Delivery History</Text>
                        <Feather name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Help', 'Contact Support at support@ricemillexpress.com')}>
                        <View style={styles.actionIconBox}>
                            <MaterialIcons name="help" size={24} color="#333" />
                        </View>
                        <Text style={styles.actionText}>Help & Support</Text>
                        <Feather name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Feather name="log-out" size={18} color="#FF3B30" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    appBar: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
        paddingBottom: 15,
        justifyContent: 'center'
    },
    appBarTitle: {
        fontSize: 22,
        fontWeight: '400',
        color: '#222',
        letterSpacing: 0.2
    },
    container: {
        flex: 1,
        backgroundColor: '#F7F8FC', // Very slight purple/grey tint as seen in image
    },
    heroSection: {
        backgroundColor: '#0FAD45', // Bright Green
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 60,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 10
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    heroName: {
        fontSize: 26,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4
    },
    heroRole: {
        fontSize: 15,
        color: '#E0F2E9',
        fontWeight: '400'
    },
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
        paddingTop: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4
    },
    iconBox: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    textWrap: {
        flex: 1,
        justifyContent: 'center'
    },
    label: {
        fontSize: 13,
        color: '#8A8A8E',
        marginBottom: 2
    },
    value: {
        fontSize: 16,
        fontWeight: '400',
        color: '#222'
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 14,
        marginLeft: 40
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10
    },
    actionIconBox: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center'
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '400'
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30'
    }
});

export default DeliveryPartnerProfileScreen;
