import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Divider, List } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
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
                    onPress: () => {
                        dispatch(logout());
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <MaterialIcons name="person" size={60} color="#fff" />
                </View>
                <Text style={styles.nameText}>{user?.name || 'Delivery Partner'}</Text>
                <Text style={styles.roleText}>Delivery Partner</Text>
            </View>

            {/* Personal Information */}
            <Card style={styles.card}>
                <Card.Title title="Personal Information" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="person" size={20} color="#666" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Full Name</Text>
                            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.infoRow}>
                        <MaterialIcons name="email" size={20} color="#666" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={20} color="#666" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* App Settings */}
            <Card style={styles.card}>
                <Card.Title title="Settings" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <List.Item
                        title="Delivery History"
                        left={props => <List.Icon {...props} icon="history" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => navigation.navigate('DeliveryHistory')}
                    />
                    <Divider />
                    <List.Item
                        title="Help & Support"
                        left={props => <List.Icon {...props} icon="help-circle" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => Alert.alert('Help', 'Contact support at support@ricemill.com')}
                    />
                </Card.Content>
            </Card>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    icon="logout"
                    buttonColor="#F44336"
                >
                    Logout
                </Button>
            </View>

            {/* App Version */}
            <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    card: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        marginVertical: 4,
    },
    logoutContainer: {
        padding: 16,
        paddingTop: 24,
    },
    logoutButton: {
        paddingVertical: 8,
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 16,
        marginBottom: 32,
    },
});

export default DeliveryPartnerProfileScreen;
