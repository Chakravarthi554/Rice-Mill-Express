import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Card, Button, Divider, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getRewards, getRewardTransactions, redeemReward, getActiveCampaigns } from '../../redux/actions/rewardsActions';

const RewardsScreen = () => {
    const dispatch = useDispatch();

    const rewardsState = useSelector((state) => state.rewards);
    const { loading: rewardsLoading, rewards } = rewardsState;

    const transactionsState = useSelector((state) => state.rewardTransactions);
    const { loading: transLoading, transactions } = transactionsState;

    const redeemState = useSelector((state) => state.redeemReward);
    const { loading: redeemLoading, success: redeemSuccess, error: redeemError } = redeemState;

    const campaignsState = useSelector((state) => state.campaigns);
    const { loading: campaignsLoading, campaigns } = campaignsState;

    useEffect(() => {
        dispatch(getRewards());
        dispatch(getRewardTransactions());
        dispatch(getActiveCampaigns());
    }, [dispatch]);

    useEffect(() => {
        if (redeemSuccess) {
            Alert.alert('Success', 'Reward points redeemed successfully!');
        }
        if (redeemError) {
            Alert.alert('Error', redeemError);
        }
    }, [redeemSuccess, redeemError]);

    const handleRedeem = (points) => {
        Alert.alert(
            'Redeem Points',
            `Are you sure you want to redeem ${points} points for a discount?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Redeem', onPress: () => dispatch(redeemReward(points)) }
            ]
        );
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.transactionItem}>
            <View style={styles.transIconContainer}>
                <MaterialIcons
                    name={item.type === 'credit' ? 'add-circle' : 'remove-circle'}
                    size={24}
                    color={item.type === 'credit' ? '#4CAF50' : '#F44336'}
                />
            </View>
            <View style={styles.transDetails}>
                <Text style={styles.transDescription}>{item.description || 'Order Reward'}</Text>
                <Text style={styles.transDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transPoints, { color: item.type === 'credit' ? '#4CAF50' : '#F44336' }]}>
                {item.type === 'credit' ? '+' : '-'}{item.points}
            </Text>
        </View>
    );

    if (rewardsLoading && !rewards) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Card style={styles.balanceCard}>
                    <Card.Content style={styles.balanceContent}>
                        <MaterialIcons name="stars" size={48} color="#FFC107" />
                        <View style={styles.pointsInfo}>
                            <Title style={styles.pointsValue}>{rewards?.points || 0}</Title>
                            <Paragraph style={styles.pointsLabel}>Available Points</Paragraph>
                        </View>
                        <Button
                            mode="contained"
                            onPress={() => handleRedeem(100)}
                            disabled={redeemLoading || (rewards?.points || 0) < 100}
                            style={styles.redeemButton}
                        >
                            Redeem
                        </Button>
                    </Card.Content>
                </Card>
            </View>

            <View style={styles.historySection}>
                <Title style={styles.historyTitle}>Transaction History</Title>
                <Divider />
                {transLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#4CAF50" />
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTransaction}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="history" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>No transactions yet</Text>
                            </View>
                        }
                    />
                )}
            </View>
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
        padding: 16,
        backgroundColor: '#4CAF50',
        paddingBottom: 40,
    },
    balanceCard: {
        borderRadius: 12,
        elevation: 4,
    },
    balanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    pointsInfo: {
        flex: 1,
        marginLeft: 16,
    },
    pointsValue: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 36,
    },
    pointsLabel: {
        fontSize: 14,
        color: '#666',
    },
    redeemButton: {
        borderRadius: 20,
    },
    campaignsSection: {
        marginTop: 10,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    campaignsList: {
        paddingRight: 16,
    },
    campaignCard: {
        width: 280,
        marginRight: 16,
        borderRadius: 12,
        elevation: 3,
        marginBottom: 10,
    },
    campaignImage: {
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    campaignTitle: {
        fontSize: 16,
        marginTop: 5,
    },
    campaignDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    campaignBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FFC107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    campaignBadgeText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#333',
    },
    noCampaigns: {
        fontStyle: 'italic',
        color: '#999',
        marginLeft: 4,
    },
    historySection: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        padding: 20,
    },
    historyTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    listContent: {
        paddingTop: 10,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    transIconContainer: {
        marginRight: 16,
    },
    transDetails: {
        flex: 1,
    },
    transDescription: {
        fontSize: 16,
        fontWeight: '500',
    },
    transDate: {
        fontSize: 12,
        color: '#999',
    },
    transPoints: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
    },
});

export default RewardsScreen;
