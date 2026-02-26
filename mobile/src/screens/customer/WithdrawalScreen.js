import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, HelperText } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { requestWithdrawal, getWalletData } from '../../redux/actions/walletActions';
import { WITHDRAW_RESET } from '../../constants/walletConstants';

const WithdrawalScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { walletData } = useSelector((state) => state.wallet);
    const { loading, success, error } = useSelector((state) => state.withdrawal);

    const [formData, setFormData] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (success) {
            Alert.alert('Success', 'Withdrawal request submitted successfully!', [
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

    const validate = () => {
        let newErrors = {};
        const amountNum = parseFloat(formData.amount);

        if (!formData.amount || isNaN(amountNum)) {
            newErrors.amount = 'Enter a valid amount';
        } else if (amountNum < 300) {
            newErrors.amount = 'Minimum withdrawal is ₹300';
        } else if (amountNum > (walletData?.balance || 0)) {
            newErrors.amount = 'Insufficient balance';
        }

        if (!formData.bankName) newErrors.bankName = 'Bank name is required';
        if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
        if (!formData.ifscCode) newErrors.ifscCode = 'IFSC code is required';
        if (!formData.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            dispatch(requestWithdrawal({
                amount: parseFloat(formData.amount),
                bankDetails: {
                    bankName: formData.bankName,
                    accountNumber: formData.accountNumber,
                    ifscCode: formData.ifscCode,
                    accountHolderName: formData.accountHolderName
                }
            }));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <MaterialIcons name="account-balance" size={60} color="#4CAF50" />
                    <Title style={styles.headerTitle}>Withdraw Money</Title>
                    <Text style={styles.subtitle}>Available Balance: ₹{walletData?.balance || 0}</Text>
                </View>

                <Card style={styles.formCard}>
                    <Card.Content>
                        <TextInput
                            label="Amount (Min ₹300)"
                            value={formData.amount}
                            onChangeText={(val) => setFormData({ ...formData, amount: val })}
                            keyboardType="numeric"
                            mode="outlined"
                            error={!!errors.amount}
                        />
                        <HelperText type="error" visible={!!errors.amount}>
                            {errors.amount}
                        </HelperText>

                        <TextInput
                            label="Bank Name"
                            value={formData.bankName}
                            onChangeText={(val) => setFormData({ ...formData, bankName: val })}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.bankName}
                        />
                        <HelperText type="error" visible={!!errors.bankName}>
                            {errors.bankName}
                        </HelperText>

                        <TextInput
                            label="Account Number"
                            value={formData.accountNumber}
                            onChangeText={(val) => setFormData({ ...formData, accountNumber: val })}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.accountNumber}
                        />
                        <HelperText type="error" visible={!!errors.accountNumber}>
                            {errors.accountNumber}
                        </HelperText>

                        <TextInput
                            label="IFSC Code"
                            value={formData.ifscCode}
                            onChangeText={(val) => setFormData({ ...formData, ifscCode: val.toUpperCase() })}
                            autoCapitalize="characters"
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.ifscCode}
                        />
                        <HelperText type="error" visible={!!errors.ifscCode}>
                            {errors.ifscCode}
                        </HelperText>

                        <TextInput
                            label="Account Holder Name"
                            value={formData.accountHolderName}
                            onChangeText={(val) => setFormData({ ...formData, accountHolderName: val })}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.accountHolderName}
                        />
                        <HelperText type="error" visible={!!errors.accountHolderName}>
                            {errors.accountHolderName}
                        </HelperText>

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                        >
                            Request Withdrawal
                        </Button>
                    </Card.Content>
                </Card>

                <View style={styles.infoSection}>
                    <MaterialIcons name="info-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Withdrawals are typically processed within 2-3 business days after admin approval.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 10,
    },
    subtitle: {
        color: '#666',
        fontSize: 16,
    },
    formCard: {
        borderRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    input: {
        marginTop: 5,
    },
    button: {
        marginTop: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    infoSection: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        color: '#666',
        fontSize: 12,
    },
});

export default WithdrawalScreen;
