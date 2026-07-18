import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, Title, HelperText, Checkbox, Menu, Divider } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { requestWithdrawal, getWalletData } from '../../redux/actions/walletActions';
import { WITHDRAW_RESET } from '../../constants/walletConstants';
import apiService from '../../services/api';

const MOCK_BANKS = [
    { name: 'State Bank of India (SBI)', prefix: 'SBIN' },
    { name: 'HDFC Bank', prefix: 'HDFC' },
    { name: 'ICICI Bank', prefix: 'ICIC' },
    { name: 'Axis Bank', prefix: 'UTIB' },
    { name: 'Punjab National Bank (PNB)', prefix: 'PUNB' },
    { name: 'Bank of Baroda', prefix: 'BARB' },
    { name: 'Canara Bank', prefix: 'CNRB' },
    { name: 'Union Bank of India', prefix: 'UBIN' },
    { name: 'Kotak Mahindra Bank', prefix: 'KKBK' },
    { name: 'IndusInd Bank', prefix: 'INDB' }
];

const DeliveryWithdrawalScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { walletData } = useSelector((state) => state.wallet);
    const { loading, success, error } = useSelector((state) => state.withdrawal);
    
    // Default to a small amount to prevent errors if settings not loaded
    const minWithdrawal = 300; 

    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState(null); // null = add new bank
    
    // Add New Bank Form State
    const [formData, setFormData] = useState({
        bankName: '',
        branchName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        accountHolderName: '',
    });
    const [saveForFuture, setSaveForFuture] = useState(true);
    
    // UI States
    const [errors, setErrors] = useState({});
    const [bankMenuVisible, setBankMenuVisible] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        // Fetch latest wallet data including saved banks
        dispatch(getWalletData());
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            Alert.alert('Success', 'Withdrawal request submitted successfully! It will be reviewed by the admin shortly.', [
                {
                    text: 'OK', onPress: () => {
                        dispatch({ type: WITHDRAW_RESET });
                        dispatch(getWalletData());
                        navigation.goBack();
                    }
                }
            ]);
        }
        if (error) {
            Alert.alert('Error', error);
            dispatch({ type: WITHDRAW_RESET });
        }
    }, [success, error, dispatch, navigation]);

    const validateNewBank = () => {
        let newErrors = {};
        if (!formData.bankName) newErrors.bankName = 'Bank name is required';
        if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
        if (formData.accountNumber !== formData.confirmAccountNumber) {
            newErrors.confirmAccountNumber = 'Account numbers do not match';
        }
        if (!formData.ifscCode) newErrors.ifscCode = 'IFSC code is required';
        else if (formData.ifscCode.length < 11) newErrors.ifscCode = 'Invalid IFSC code length';
        if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateAmount = () => {
        const amountNum = parseFloat(amount);
        if (!amount || isNaN(amountNum)) {
            Alert.alert('Validation Error', 'Enter a valid amount');
            return false;
        } else if (amountNum < minWithdrawal) {
            Alert.alert('Validation Error', `Minimum withdrawal is ₹${minWithdrawal}`);
            return false;
        } else if (amountNum > (walletData?.balance || 0)) {
            Alert.alert('Validation Error', 'Insufficient balance. Your balance is ₹' + (walletData?.balance || 0));
            return false;
        }
        return true;
    };

    const handleWithdraw = async () => {
        if (!validateAmount()) return;

        let finalBankDetails = null;

        if (selectedBank) {
            finalBankDetails = selectedBank;
        } else {
            if (!validateNewBank()) return;
            finalBankDetails = {
                bankName: formData.bankName,
                branchName: formData.branchName,
                accountNumber: formData.accountNumber,
                ifscCode: formData.ifscCode,
                accountHolderName: formData.accountHolderName
            };

            // Save bank account if checked
            if (saveForFuture) {
                try {
                    setSaveLoading(true);
                    await apiService.saveBankAccount({ ...finalBankDetails, isDefault: true });
                    dispatch(getWalletData()); // Refresh saved banks
                } catch (err) {
                    Alert.alert('Notice', 'Bank details could not be saved, but proceeding with withdrawal.');
                } finally {
                    setSaveLoading(false);
                }
            }
        }

        dispatch(requestWithdrawal({
            amount: parseFloat(amount),
            bankDetails: finalBankDetails
        }));
    };

    // Calculate weekly earnings
    const getWeeklyEarnings = () => {
        if (!walletData?.transactions) return 0;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return walletData.transactions
            .filter(t => new Date(t.createdAt) >= oneWeekAgo && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const weeklyEarnings = getWeeklyEarnings();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Balance Header */}
                <View style={styles.headerCard}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Available Balance</Text>
                        <Text style={styles.headerBalance}>₹{walletData?.balance || 0}</Text>
                    </View>
                    <MaterialIcons name="account-balance-wallet" size={48} color="#E0F2FE" />
                </View>

                {/* Weekly Earnings Card */}
                <View style={[styles.headerCard, { backgroundColor: '#34D399', marginTop: 16 }]}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.headerTitle, { color: '#064E3B' }]}>This Week's Earnings</Text>
                        <Text style={[styles.headerBalance, { color: '#064E3B' }]}>₹{weeklyEarnings}</Text>
                    </View>
                    <Ionicons name="stats-chart" size={48} color="#064E3B" />
                </View>

                {/* Amount Input */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Withdrawal Amount</Title>
                        <TextInput
                            label={`Amount (Min ₹${minWithdrawal})`}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            mode="outlined"
                            left={<TextInput.Affix text="₹ " />}
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Saved Banks Selection */}
                {walletData?.savedBanks && walletData.savedBanks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Destination Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {walletData.savedBanks.map((bank, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.savedBankCard, selectedBank?._id === bank._id && styles.savedBankCardSelected]}
                                    onPress={() => setSelectedBank(bank)}
                                >
                                    <View style={styles.savedBankIcon}>
                                        <MaterialIcons name="account-balance" size={24} color={selectedBank?._id === bank._id ? '#fff' : '#4F46E5'} />
                                    </View>
                                    <View>
                                        <Text style={[styles.savedBankName, selectedBank?._id === bank._id && styles.textWhite]}>{bank.bankName}</Text>
                                        <Text style={[styles.savedBankDetail, selectedBank?._id === bank._id && styles.textWhite]}>
                                            A/C: ****{bank.accountNumber?.slice(-4)}
                                        </Text>
                                    </View>
                                    {selectedBank?._id === bank._id && (
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 10 }} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity 
                                style={[styles.savedBankCard, !selectedBank && styles.savedBankCardSelected]}
                                onPress={() => setSelectedBank(null)}
                            >
                                <View style={styles.savedBankIcon}>
                                    <MaterialIcons name="add" size={24} color={!selectedBank ? '#fff' : '#4F46E5'} />
                                </View>
                                <Text style={[styles.savedBankName, !selectedBank && styles.textWhite]}>Add New</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {/* Add New Bank Form */}
                {(!selectedBank) && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title>Bank Account Details</Title>
                            
                            <Menu
                                visible={bankMenuVisible}
                                onDismiss={() => setBankMenuVisible(false)}
                                anchor={
                                    <TouchableOpacity onPress={() => setBankMenuVisible(true)}>
                                        <TextInput
                                            label="Select Bank"
                                            value={formData.bankName}
                                            mode="outlined"
                                            editable={false}
                                            right={<TextInput.Icon icon="chevron-down" />}
                                            style={styles.input}
                                            error={!!errors.bankName}
                                        />
                                    </TouchableOpacity>
                                }
                            >
                                {MOCK_BANKS.map((bank, idx) => (
                                    <Menu.Item 
                                        key={idx} 
                                        onPress={() => {
                                            setFormData(prev => ({ ...prev, bankName: bank.name, ifscCode: bank.prefix }));
                                            setBankMenuVisible(false);
                                        }} 
                                        title={bank.name} 
                                    />
                                ))}
                                <Divider />
                                <Menu.Item 
                                    onPress={() => {
                                        setFormData(prev => ({ ...prev, bankName: 'Other Bank' }));
                                        setBankMenuVisible(false);
                                    }} 
                                    title="Other Bank" 
                                />
                            </Menu>
                            <HelperText type="error" visible={!!errors.bankName}>{errors.bankName}</HelperText>

                            <TextInput
                                label="Branch / District Name"
                                value={formData.branchName}
                                onChangeText={(val) => setFormData({ ...formData, branchName: val })}
                                mode="outlined"
                                style={styles.input}
                                placeholder="e.g. Madhapur, Hyderabad"
                            />

                            <TextInput
                                label="IFSC Code"
                                value={formData.ifscCode}
                                onChangeText={(val) => setFormData({ ...formData, ifscCode: val.toUpperCase() })}
                                autoCapitalize="characters"
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.ifscCode}
                            />
                            <HelperText type="error" visible={!!errors.ifscCode}>{errors.ifscCode}</HelperText>

                            <TextInput
                                label="Account Number"
                                value={formData.accountNumber}
                                onChangeText={(val) => setFormData({ ...formData, accountNumber: val })}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.accountNumber}
                            />
                            <HelperText type="error" visible={!!errors.accountNumber}>{errors.accountNumber}</HelperText>

                            <TextInput
                                label="Confirm Account Number"
                                value={formData.confirmAccountNumber}
                                onChangeText={(val) => setFormData({ ...formData, confirmAccountNumber: val })}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.confirmAccountNumber}
                            />
                            <HelperText type="error" visible={!!errors.confirmAccountNumber}>{errors.confirmAccountNumber}</HelperText>

                            <TextInput
                                label="Account Holder Name"
                                value={formData.accountHolderName}
                                onChangeText={(val) => setFormData({ ...formData, accountHolderName: val.toUpperCase() })}
                                autoCapitalize="characters"
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.accountHolderName}
                            />
                            <HelperText type="error" visible={!!errors.accountHolderName}>{errors.accountHolderName}</HelperText>

                            <View style={styles.checkboxContainer}>
                                <Checkbox
                                    status={saveForFuture ? 'checked' : 'unchecked'}
                                    onPress={() => setSaveForFuture(!saveForFuture)}
                                    color="#4F46E5"
                                />
                                <Text style={styles.checkboxText}>Save securely for future withdrawals</Text>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                <Button
                    mode="contained"
                    onPress={handleWithdraw}
                    loading={loading || saveLoading}
                    disabled={loading || saveLoading}
                    style={styles.submitBtn}
                    labelStyle={styles.submitBtnLabel}
                >
                    Proceed to Withdraw
                </Button>

                <View style={styles.infoSection}>
                    <Ionicons name="shield-checkmark" size={24} color="#059669" />
                    <Text style={styles.infoText}>
                        Your withdrawal request will be reviewed by the admin. The amount will be credited to your account within 2-3 business days after approval.
                    </Text>
                </View>
                
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerCard: {
        backgroundColor: '#4F46E5',
        borderRadius: 16,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        color: '#E0F2FE',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    headerBalance: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    card: {
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    input: {
        marginTop: 8,
        backgroundColor: '#FFFFFF',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
        marginLeft: 4,
    },
    savedBankCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minWidth: 200,
    },
    savedBankCardSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    savedBankIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    savedBankName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    savedBankDetail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    textWhite: {
        color: '#FFFFFF',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    checkboxText: {
        fontSize: 14,
        color: '#4B5563',
    },
    submitBtn: {
        marginTop: 8,
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        paddingVertical: 6,
    },
    submitBtnLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoSection: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ECFDF5',
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        color: '#065F46',
        fontSize: 13,
        lineHeight: 20,
    },
});

export default DeliveryWithdrawalScreen;
