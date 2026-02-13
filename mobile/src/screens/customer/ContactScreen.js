import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, TextInput, Button, HelperText } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/env';

const ContactScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const categories = [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Technical Support', value: 'technical' },
        { label: 'Billing Issue', value: 'billing' },
        { label: 'Feedback/Suggestion', value: 'feedback' },
        { label: 'Legal Question', value: 'legal' }
    ];

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
        }
        
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }
        
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        } else if (formData.message.length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix the errors in the form');
            return;
        }

        try {
            setLoading(true);
            
            const response = await axios.post(`${API_URL}/api/legal/contact`, {
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message,
                category: formData.category
            });

            if (response.data.success) {
                Alert.alert(
                    'Success', 
                    response.data.message,
                    [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]
                );
                
                // Reset form
                setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    subject: '',
                    message: '',
                    category: 'general'
                });
            }
        } catch (error) {
            console.error('Contact form error:', error);
            Alert.alert(
                'Error', 
                error.response?.data?.message || 'Failed to send message. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title style={styles.title}>Contact Us</Title>
                    <Text style={styles.subtitle}>
                        Have questions or need help? Fill out the form below and we'll get back to you within 24-48 hours.
                    </Text>
                    
                    <TextInput
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({...formData, name: text})}
                        style={styles.input}
                        mode="outlined"
                        error={!!errors.name}
                    />
                    {errors.name && <HelperText type="error">{errors.name}</HelperText>}
                    
                    <TextInput
                        label="Email Address"
                        value={formData.email}
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={!!errors.email}
                    />
                    {errors.email && <HelperText type="error">{errors.email}</HelperText>}
                    
                    <TextInput
                        label="Subject"
                        value={formData.subject}
                        onChangeText={(text) => setFormData({...formData, subject: text})}
                        style={styles.input}
                        mode="outlined"
                        error={!!errors.subject}
                    />
                    {errors.subject && <HelperText type="error">{errors.subject}</HelperText>}
                    
                    <TextInput
                        label="Category"
                        value={categories.find(c => c.value === formData.category)?.label}
                        style={styles.input}
                        mode="outlined"
                        disabled
                    />
                    
                    <View style={styles.categoryContainer}>
                        {categories.map((cat) => (
                            <Button
                                key={cat.value}
                                mode={formData.category === cat.value ? "contained" : "outlined"}
                                onPress={() => setFormData({...formData, category: cat.value})}
                                style={[
                                    styles.categoryButton,
                                    formData.category === cat.value && styles.selectedCategory
                                ]}
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </View>
                    
                    <TextInput
                        label="Message"
                        value={formData.message}
                        onChangeText={(text) => setFormData({...formData, message: text})}
                        style={[styles.input, styles.textArea]}
                        mode="outlined"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        error={!!errors.message}
                    />
                    {errors.message && <HelperText type="error">{errors.message}</HelperText>}
                    
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.submitButton}
                    >
                        {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    card: {
        marginVertical: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    textArea: {
        height: 120,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    categoryButton: {
        marginBottom: 8,
        minWidth: '48%',
    },
    selectedCategory: {
        backgroundColor: '#4CAF50',
    },
    submitButton: {
        marginTop: 16,
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
    },
});

export default ContactScreen;