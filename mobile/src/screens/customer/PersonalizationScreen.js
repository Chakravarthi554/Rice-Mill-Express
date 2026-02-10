import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, List, Switch, Divider, RadioButton } from 'react-native-paper';

const PersonalizationScreen = () => {
    const [dashboardLayout, setDashboardLayout] = useState('grid');
    const [showRecommendations, setShowRecommendations] = useState(true);

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Dashboard Layout</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={value => setDashboardLayout(value)} value={dashboardLayout}>
                        <View style={styles.radioRow}>
                            <RadioButton value="grid" color="#4CAF50" />
                            <Text>Grid View (Compact)</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="list" color="#4CAF50" />
                            <Text>List View (Detailed)</Text>
                        </View>
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Discovery</List.Subheader>
                    <List.Item
                        title="Personalized Recommendations"
                        description="Show products based on your activity"
                        right={() => <Switch value={showRecommendations} onValueChange={setShowRecommendations} color="#4CAF50" />}
                    />
                </List.Section>
            </Card>
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
        elevation: 2,
    },
    divider: {
        marginBottom: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
});

export default PersonalizationScreen;
