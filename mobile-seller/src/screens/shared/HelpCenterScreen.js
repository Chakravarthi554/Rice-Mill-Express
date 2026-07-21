import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Card, Title, List, Searchbar, Button, Paragraph, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const HelpCenterScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        { q: 'How do I withdraw my earnings?', a: 'You can request a withdrawal from the Business & Payments section. Minimum withdrawal is ₹500.' },
        { q: 'How do I add a new delivery partner?', a: 'Go to the Delivery Partners tab and tap the + button to create a login for your driver.' },
        { q: 'When is a payout processed?', a: 'Withdrawal requests are typically processed within 2-3 business days directly to your registered bank account.' },
        { q: 'How do I update an order status?', a: 'Navigate to the Orders tab, select the order, and you can update its status or assign it to a delivery partner.' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Title style={styles.headerTitle}>How can we help you?</Title>
                <Searchbar
                    placeholder="Search FAQ..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />
            </View>

            <View style={styles.section}>
                <Title style={styles.sectionTitle}>Frequently Asked Questions</Title>
                {faqs.map((faq, index) => (
                    <List.Accordion
                        key={index}
                        title={faq.q}
                        left={props => <List.Icon {...props} icon="help-circle-outline" />}
                    >
                        <List.Item title={faq.a} titleNumberOfLines={4} />
                    </List.Accordion>
                ))}
            </View>

            <View style={styles.section}>
                <Title style={styles.sectionTitle}>Contact Us</Title>
                <Card style={styles.contactCard}>
                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:support@ricemill.com')}>
                        <MaterialIcons name="email" size={24} color="#4CAF50" />
                        <Text style={styles.contactText}>Email: support@ricemill.com</Text>
                    </TouchableOpacity>
                    <Divider />
                    <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:+919876543210')}>
                        <MaterialIcons name="phone" size={24} color="#4CAF50" />
                        <Text style={styles.contactText}>Customer Care: +91 9876543210</Text>
                    </TouchableOpacity>
                    <Divider />
                    <TouchableOpacity style={styles.contactItem} onPress={() => Alert.alert('Chat', 'Live chat coming soon!')}>
                        <MaterialIcons name="chat" size={24} color="#4CAF50" />
                        <Text style={styles.contactText}>Live Chat (Coming Soon)</Text>
                    </TouchableOpacity>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 30,
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        marginBottom: 20,
    },
    searchBar: {
        width: '100%',
        borderRadius: 8,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    contactCard: {
        elevation: 2,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    contactText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#444',
    },
});

export default HelpCenterScreen;
