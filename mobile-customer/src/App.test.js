import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import store from './redux/store';

// Simple test screen
function TestScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>✅ App Loaded Successfully!</Text>
            <Text style={styles.subtext}>Rice Mill Express Mobile</Text>
        </View>
    );
}

const Stack = createStackNavigator();

function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="Test"
                    component={TestScreen}
                    options={{ title: 'Test Screen' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    console.log('App component rendering...');

    return (
        <Provider store={store}>
            <AppNavigator />
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 16,
        color: '#666',
    },
});
