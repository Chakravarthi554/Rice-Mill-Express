import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Appbar } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { apiService } from '../../services/api';

const PolicyDetailScreen = ({ route, navigation }) => {
    const { type, title } = route.params;
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const response = await apiService.getLegalPolicy(type);
                if (response.data && response.data.success) {
                    setPolicy(response.data.data);
                } else {
                    throw new Error('Policy data missing');
                }
            } catch (err) {
                console.error(`Failed to fetch ${type} policy:`, err);
                setError('Unable to load policy detail. Please check your internet connection and try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPolicy();
    }, [type]);

    // Generate HTML with inline styles for WebView
    const generateHTML = () => {
        if (!policy) return '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                        background-color: #fff;
                    }
                    h2 {
                        color: #333;
                        margin-top: 20px;
                        margin-bottom: 10px;
                        font-size: 18px;
                    }
                    p {
                        color: #666;
                        margin-bottom: 15px;
                        line-height: 1.6;
                    }
                    strong {
                        color: #2C3E50;
                    }
                    ul, ol {
                        margin-left: 20px;
                        margin-bottom: 15px;
                    }
                    li {
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }
                    .version-text {
                        color: #999;
                        font-size: 12px;
                        margin-bottom: 4px;
                    }
                </style>
            </head>
            <body>
                ${policy.content}
                <div class="footer">
                    <div class="version-text">Version: ${policy.version}</div>
                    <div class="version-text">Last Updated: ${new Date(policy.lastUpdated).toLocaleDateString()}</div>
                </div>
            </body>
            </html>
        `;
    };

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={title} />
            </Appbar.Header>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Fetching dynamic content...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <WebView
                    originWhitelist={['*']}
                    source={{ html: generateHTML() }}
                    style={styles.webview}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    webview: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
        fontSize: 16,
        paddingHorizontal: 20,
    },
});

export default PolicyDetailScreen;
