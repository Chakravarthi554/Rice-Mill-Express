import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Share, TouchableOpacity } from 'react-native';
import { Card, Button, Title, Paragraph, Divider, List } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getReferrals, getReferralCode } from '../../redux/actions/referralActions';

const ReferralScreen = () => {
    const dispatch = useDispatch();

    const referralState = useSelector((state) => state.referral);
    const { loading: refLoading, referrals } = referralState;

    const referralCodeState = useSelector((state) => state.referralCode);
    const { loading: codeLoading, code } = referralCodeState;

    useEffect(() => {
        dispatch(getReferrals());
        dispatch(getReferralCode());
    }, [dispatch]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join Rice Mill and get rewards! Use my referral code: ${code?.code || 'CHECKAPP'}. Download now: https://ricemill.example.com`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share referral code');
        }
    };

    if (codeLoading && !code) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="card-giftcard" size={80} color="white" />
                <Title style={styles.headerTitle}>Refer & Earn</Title>
                <Paragraph style={styles.headerSubtitle}>Invite your friends and get reward points for every successful purchase they make!</Paragraph>
            </View>

            <Card style={styles.codeCard}>
                <Card.Content style={styles.codeContent}>
                    <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{code?.code || 'LOADING...'}</Text>
                        <TouchableOpacity onPress={handleShare}>
                            <MaterialIcons name="share" size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>
                    <Button mode="contained" onPress={handleShare} style={styles.shareButton}>
                        INVITE FRIENDS
                    </Button>
                </Card.Content>
            </Card>

            <View style={styles.section}>
                <Title style={styles.sectionTitle}>My Referrals ({referrals?.length || 0})</Title>
                <Divider />

                {refLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#4CAF50" />
                ) : (
                    referrals?.map((ref, index) => (
                        <List.Item
                            key={index}
                            title={ref.referredUser?.name || 'User'}
                            description={`Joined on ${new Date(ref.createdAt).toLocaleDateString()}`}
                            left={props => <List.Icon {...props} icon="account" />}
                            right={props => (
                                <View style={styles.refStatusBadge}>
                                    <Text style={styles.refStatusText}>{ref.status === 'completed' ? 'Rewarded' : 'Pending'}</Text>
                                </View>
                            )}
                        />
                    ))
                )}

                {!refLoading && referrals?.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="people-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No referrals yet. Start inviting!</Text>
                    </View>
                )}
            </View>

            <View style={styles.howItWorks}>
                <Title style={styles.sectionTitle}>How it works?</Title>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <Text style={styles.stepText}>Share your code with friends</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <Text style={styles.stepText}>They make their first purchase</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <Text style={styles.stepText}>You both get reward points!</Text>
                </View>
            </View>
        </ScrollView>
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
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        padding: 30,
        paddingBottom: 60,
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 5,
    },
    codeCard: {
        marginHorizontal: 20,
        marginTop: -40,
        borderRadius: 12,
        elevation: 8,
    },
    codeContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    codeLabel: {
        fontSize: 12,
        color: '#999',
        letterSpacing: 1,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginVertical: 15,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    codeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 15,
        letterSpacing: 3,
    },
    shareButton: {
        width: '80%',
        borderRadius: 25,
    },
    section: {
        backgroundColor: 'white',
        marginTop: 20,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    refStatusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        justifyContent: 'center',
    },
    refStatusText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
    },
    howItWorks: {
        padding: 20,
        marginBottom: 30,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    stepNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
    },
    stepText: {
        fontSize: 16,
        color: '#444',
    },
});

export default ReferralScreen;
