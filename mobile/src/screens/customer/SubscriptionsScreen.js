import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Card, Button, Title, Paragraph, List, Divider, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getSubscriptions, cancelSubscription } from '../../redux/actions/referralActions';

const SubscriptionsScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const subscriptionList = useSelector((state) => state.subscriptionList);
    const { loading, error, subscriptions } = subscriptionList;

    useEffect(() => {
        dispatch(getSubscriptions());
    }, [dispatch]);

    const handleCancel = (id) => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel this subscription?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes, Cancel', style: 'destructive', onPress: () => dispatch(cancelSubscription(id)) }
            ]
        );
    };

    const renderSubscription = ({ item }) => (
        <Card style={styles.subCard}>
            <Card.Content>
                <View style={styles.subHeader}>
                    <Title style={styles.productName}>{item.product?.name || 'Product'}</Title>
                    <Chip style={[styles.statusChip, { backgroundColor: item.status === 'active' ? '#E8F5E9' : '#FFEBEE' }]}>
                        <Text style={{ color: item.status === 'active' ? '#4CAF50' : '#F44336', fontSize: 10, fontWeight: 'bold' }}>
                            {item.status.toUpperCase()}
                        </Text>
                    </Chip>
                </View>
                <Paragraph style={styles.subInfo}>Frequency: {item.frequency}</Paragraph>
                <Paragraph style={styles.subInfo}>Next Delivery: {new Date(item.nextDelivery).toLocaleDateString()}</Paragraph>
                <Paragraph style={styles.subPrice}>₹{item.price} / delivery</Paragraph>

                <Divider style={{ marginVertical: 12 }} />

                <View style={styles.subActions}>
                    <Button mode="outlined" onPress={() => navigation.navigate('ProductDetail', { productId: item.product?._id })}>
                        View Product
                    </Button>
                    {item.status === 'active' && (
                        <Button mode="text" textColor="#F44336" onPress={() => handleCancel(item._id)}>
                            Cancel
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    if (loading && subscriptions.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Title style={styles.headerTitle}>My Subscriptions</Title>
                <Paragraph style={styles.headerSubtitle}>Manage your recurring orders here</Paragraph>
            </View>

            <FlatList
                data={subscriptions}
                keyExtractor={(item) => item._id}
                renderItem={renderSubscription}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="event-repeat" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No active subscriptions</Text>
                        <Button
                            mode="contained"
                            style={{ marginTop: 20 }}
                            onPress={() => navigation.navigate('Home')}
                        >
                            Explore Products
                        </Button>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#666',
    },
    listContent: {
        padding: 16,
    },
    subCard: {
        marginBottom: 16,
        elevation: 2,
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productName: {
        fontSize: 18,
        flex: 1,
        marginRight: 10,
    },
    statusChip: {
        height: 24,
    },
    subInfo: {
        fontSize: 14,
        color: '#666',
        marginVertical: 1,
    },
    subPrice: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    subActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
    },
});

export default SubscriptionsScreen;
