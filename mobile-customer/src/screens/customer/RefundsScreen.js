import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Card, Button, Title, Paragraph, RadioButton, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createRefundRequest, resetRefundCreate } from '../../redux/actions/refundActions';

const RefundsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [reason, setReason] = useState('wrong_item');
    const [comment, setComment] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    const dispatch = useDispatch();

    const refundCreate = useSelector((state) => state.refundCreate);
    const { loading, success, error } = refundCreate;

    useEffect(() => {
        if (success) {
            Alert.alert('Success', 'Refund request submitted successfully! We will review it shortly.', [
                {
                    text: 'OK', onPress: () => {
                        dispatch(resetRefundCreate());
                        navigation.navigate('Orders');
                    }
                }
            ]);
        }
        if (error) {
            Alert.alert('Error', error);
            dispatch(resetRefundCreate());
        }
    }, [success, error, dispatch, navigation]);

    const handleSubmit = () => {
        if (!comment.trim()) {
            Alert.alert('Required', 'Please provide more details about the issue.');
            return;
        }

        dispatch(createRefundRequest(orderId, {
            reason,
            comment,
            contactPhone
        }));
    };

    const reasons = [
        { value: 'wrong_item', label: 'Wrong Item Received' },
        { value: 'damaged', label: 'Item Damaged / Poor Quality' },
        { value: 'not_as_described', label: 'Item Not as Described' },
        { value: 'expired', label: 'Item Expired' },
        { value: 'others', label: 'Others' },
    ];

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Refund / Return Request</Title>
                    <Paragraph style={styles.subtitle}>Order ID: {orderId}</Paragraph>
                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Select Reason:</Text>
                    <RadioButton.Group onValueChange={value => setReason(value)} value={reason}>
                        {reasons.map((r) => (
                            <View key={r.value} style={styles.radioRow}>
                                <RadioButton value={r.value} color="#4CAF50" />
                                <Text onPress={() => setReason(r.value)}>{r.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>

                    <Text style={styles.label}>Additional Details:</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Please describe the issue in detail..."
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />

                    <Text style={styles.label}>Contact Phone (Optional):</Text>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Phone number for verification"
                        keyboardType="phone-pad"
                        value={contactPhone}
                        onChangeText={setContactPhone}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}
                        icon="send"
                    >
                        Submit Request
                    </Button>
                </Card.Content>
            </Card>

            <View style={styles.infoBox}>
                <MaterialIcons name="info" size={24} color="#666" />
                <Text style={styles.infoText}>
                    Our team will review your request and get back to you within 24-48 hours.
                    You status can be tracked in the Orders section.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        margin: 16,
        elevation: 4,
    },
    subtitle: {
        color: '#666',
        fontSize: 12,
    },
    divider: {
        marginVertical: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    phoneInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    submitButton: {
        marginTop: 24,
        paddingVertical: 4,
        backgroundColor: '#F44336',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 12,
        color: '#444',
    },
});

export default RefundsScreen;
