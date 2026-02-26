import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Button } from 'react-native-paper';

const LegalScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container}>
            <List.Section>
                <List.Item
                    title="Terms of Service"
                    description="Read our terms and conditions"
                    left={props => <List.Icon {...props} icon="file-document-outline" />}
                    onPress={() => navigation.navigate('PolicyDetail', { type: 'terms', title: 'Terms of Service' })}
                />
                <Divider />
                <List.Item
                    title="Privacy Policy"
                    description="How we handle your personal data"
                    left={props => <List.Icon {...props} icon="shield-check-outline" />}
                    onPress={() => navigation.navigate('PolicyDetail', { type: 'privacy', title: 'Privacy Policy' })}
                />
                <Divider />
                <List.Item
                    title="Refund & Cancellation Policy"
                    description="Rules for returns and cancellations"
                    left={props => <List.Icon {...props} icon="undo" />}
                    onPress={() => navigation.navigate('PolicyDetail', { type: 'refund', title: 'Refund & Cancellation Policy' })}
                />
                <Divider />
                <List.Item
                    title="Contact Us"
                    description="Get help or send us a message"
                    left={props => <List.Icon {...props} icon="email-outline" />}
                    onPress={() => navigation.navigate('Contact')}
                />
            </List.Section>

            <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>
                    If you have any questions about our policies or need assistance,
                    please don't hesitate to contact our support team.
                </Text>
                <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Contact')}
                    style={styles.contactButton}
                >
                    Contact Support
                </Button>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Last Updated: June 2024</Text>
                <Text style={styles.footerText}>Rice Mill App © 2024</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    helpSection: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        margin: 16,
        borderRadius: 8,
        elevation: 1,
    },
    helpTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    helpText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    contactButton: {
        backgroundColor: '#4CAF50',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});

export default LegalScreen;
