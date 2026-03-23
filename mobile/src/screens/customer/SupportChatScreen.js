import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { apiService } from '../../services/api';
import socketService from '../../services/socket';

const SupportChatScreen = ({ route, navigation }) => {
    const { conversationId, subject, ticketId } = route.params;
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef();

    useEffect(() => {
        fetchMessages();

        // Connect socket if not connected
        socketService.connectSocket();

        // Subscribe to messages
        socketService.subscribeToChatMessage((data) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) => [...prev, data.message]);
                // Scroll to bottom
                setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
            }
        });

        // Set header title to subject
        navigation.setOptions({ title: subject || 'Support Chat' });

        return () => {
            socketService.unsubscribeFromChatMessage();
        };
    }, [conversationId]);

    const fetchMessages = async () => {
        try {
            const response = await apiService.getChatMessageHistory(conversationId);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const content = newMessage.trim();
            setNewMessage('');

            // Identify recipient (admin)
            // In a support ticket, the conversation participant who is not the user is the admin
            // For now, the backend sendMessage handles finding the other participant if we don't pass receiverId? 
            // Wait, chatController.js expects receiverId.
            // I need to know the admin's ID. 
            // Alternatively, I can create a dedicated support-reply endpoint or fetch conversation details first.

            // Let's fetch conversation details to get the admin ID
            const convRes = await api.get('/api/chat/conversations');
            const conv = convRes.data.find(c => c._id === conversationId);
            const adminParticipant = conv?.participants.find(p => p._id !== user._id);

            if (!adminParticipant) {
                throw new Error('Support agent not found in conversation');
            }

            await api.post('/api/chat/send', {
                receiverId: adminParticipant._id,
                content,
                type: 'text'
            });

            // Note: socket will emit back the message so we don't need to manually add it to state here
            // but we could for better UX (optimistic update)
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender._id === user._id;
        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <MaterialIcons name="send" size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: 16,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#4CAF50',
        borderBottomRightRadius: 2,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        elevation: 5,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#4CAF50',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
});

export default SupportChatScreen;
