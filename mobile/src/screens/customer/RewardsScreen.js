import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Card, Button, Divider, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getRewards, getRewardTransactions, redeemReward, getActiveCampaigns, getPublicSettings } from '../../redux/actions/rewardsActions';
import { getWalletData } from '../../redux/actions/walletActions';
import io from 'socket.io-client';
import { API_URL } from '../../config/env';
import { apiService } from '../../services/api';

const RewardsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const rewardsState = useSelector((state) => state.rewards);
    const { loading: rewardsLoading, rewards } = rewardsState;

    const transactionsState = useSelector((state) => state.rewardTransactions);
    const { loading: transLoading, transactions } = transactionsState;

    const redeemState = useSelector((state) => state.redeemReward);
    const { loading: redeemLoading, success: redeemSuccess, error: redeemError } = redeemState;

    const campaignsState = useSelector((state) => state.campaigns);
    const { loading: campaignsLoading, campaigns } = campaignsState;

    const walletState = useSelector((state) => state.wallet);
    const { loading: walletLoading, walletData } = walletState;

    const { publicSettings } = useSelector((state) => state.publicSettings || {});
    const minWithdrawal = publicSettings?.referralSettings?.minWithdrawalAmount || 300;

    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        dispatch(getRewards());
        dispatch(getRewardTransactions());
        dispatch(getActiveCampaigns());
        dispatch(getWalletData());
        dispatch(getPublicSettings());
    }, [dispatch]);

    // ✅ Real-time rewards synchronization
    useEffect(() => {
        const handleRewardsUpdate = async (data) => {
            if (data.userId === user?._id) {
                setSyncing(true);
                try {
                    // Sync with backend to get latest data
                    await apiService.syncRewards();
                    dispatch(getRewards());
                    dispatch(getRewardTransactions());
                } catch (error) {
                    console.error('Failed to sync rewards:', error);
                } finally {
                    setSyncing(false);
                }
            }
        };

        const socket = io(API_URL, {
            transports: ['websocket'],
            auth: {
                token: user?.token
            }
        });

        socket.on('REWARDS_UPDATED', handleRewardsUpdate);

        return () => {
            socket.off('REWARDS_UPDATED', handleRewardsUpdate);
            socket.disconnect();
        };
    }, [user?._id, user?.token, dispatch]);

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
            {/* Sync Indicator */}
            {syncing && (
                <View style={styles.syncBanner}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.syncText}>Syncing rewards data...</Text>
                </View>
            )}

            <View style={styles.header}>
                <Title style={styles.headerTitle}>Rewards & Wallet</Title>
                <Paragraph style={styles.headerSubtitle}>Earn by referring and shop more!</Paragraph>

                <Card style={styles.balanceCard}>
                    <Card.Content style={styles.balanceContent}>
                        <View style={styles.pointsInfo}>
                            <Title style={styles.pointsValue}>{rewards?.points || 0}</Title>
                            <Paragraph style={styles.pointsLabel}>Reward Points</Paragraph>
                        </View>
                        <Divider style={styles.verticalDivider} />
                        <View style={styles.pointsInfo}>
                            <Title style={styles.pointsValue}>₹{walletData?.balance || 0}</Title>
                            <Paragraph style={styles.pointsLabel}>Wallet Balance</Paragraph>
                        </View>
                    </Card.Content>
                    <Card.Actions style={styles.cardActions}>
                        <Button
                            mode="outlined"
                            onPress={() => handleRedeem(100)}
                            disabled={redeemLoading || (rewards?.points || 0) < 100}
                            style={styles.actionButton}
                        >
                            Redeem Points
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('Withdraw')}
                            style={[styles.actionButton, styles.withdrawButton]}
                            disabled={(walletData?.balance || 0) < minWithdrawal}
                        >
                            Withdraw
                        </Button>
                    </Card.Actions>
                </Card>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>₹{walletData?.totalEarnings || 0}</Text>
                        <Text style={styles.statLabel}>Total Earned</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>₹{walletData?.pendingBalance || 0}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{walletData?.referralsCount || 0}</Text>
                        <Text style={styles.statLabel}>Referrals</Text>
                    </View>
                </View>
            </View>

            <View style={styles.historySection}>
                <Title style={styles.historyTitle}>Wallet Activity</Title>
                <Divider />
                {walletLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#4CAF50" />
                ) : (
                    <FlatList
                        data={walletData?.transactions || []}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <View style={styles.transactionItem}>
                                <View style={styles.transDetails}>
                                    <Text style={styles.transDescription}>{item.description}</Text>
                                    <Text style={styles.transDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={[styles.transPoints, { color: item.amount > 0 ? '#4CAF50' : '#F44336' }]}>
                                    {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount)}
                                </Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="account-balance-wallet" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>No wallet activity yet</Text>
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
    syncBanner: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    syncText: {
        color: 'white',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 20,
    },
    balanceCard: {
        borderRadius: 12,
        elevation: 4,
        padding: 10,
    },
    balanceContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    pointsInfo: {
        alignItems: 'center',
        flex: 1,
    },
    pointsValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    pointsLabel: {
        fontSize: 12,
        color: '#666',
    },
    verticalDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#eee',
    },
    cardActions: {
        justifyContent: 'space-around',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 5,
        borderRadius: 8,
    },
    withdrawButton: {
        backgroundColor: '#4CAF50',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 12,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 2,
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
        fontWeight: 'bold',
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
