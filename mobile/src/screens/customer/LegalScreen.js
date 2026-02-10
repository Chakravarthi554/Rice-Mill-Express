import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, Divider } from 'react-native-paper';

const LegalScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <List.Section>
                <List.Item
                    title="Terms of Service"
                    description="Read our terms and conditions"
                    left={props => <List.Icon {...props} icon="file-document-outline" />}
                    onPress={() => alert('Viewing Terms of Service')}
                />
                <Divider />
                <List.Item
                    title="Privacy Policy"
                    description="How we handle your personal data"
                    left={props => <List.Icon {...props} icon="shield-check-outline" />}
                    onPress={() => alert('Viewing Privacy Policy')}
                />
                <Divider />
                <List.Item
                    title="Refund & Cancellation Policy"
                    description="Rules for returns and cancellations"
                    left={props => <List.Icon {...props} icon="undo" />}
                    onPress={() => alert('Viewing Refund Policy')}
                />
                <Divider />
                <List.Item
                    title="Cookie Policy"
                    description="How we use cookies"
                    left={props => <List.Icon {...props} icon="cookie-outline" />}
                    onPress={() => alert('Viewing Cookie Policy')}
                />
            </List.Section>

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
    footer: {
        padding: 20,
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});

export default LegalScreen;
