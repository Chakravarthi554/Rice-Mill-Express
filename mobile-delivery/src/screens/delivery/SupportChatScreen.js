import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { getSocket, subscribeToChatMessage, unsubscribeFromChatMessage } from '../../services/socket';

const SupportChatScreen = ({ route, navigation }) => {
    const { orderId } = route?.params || {};
    const { user } = useSelector(state => state.auth);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const flatListRef = useRef(null);

    const PRIMARY_ACCENT = '#FC8019';

    useEffect(() => {
        loadConversation();

        // Listen for incoming messages
        subscribeToChatMessage((data) => {
            if (data && data.message) {
                setMessages(prev => [...prev, {
                    _id: data.message._id || Date.now().toString(),
                    text: data.message.text || data.message.content,
                    sender: data.message.sender,
                    senderName: data.message.senderName || 'Support',
                    createdAt: data.message.createdAt || new Date().toISOString(),
                    isOwn: data.message.sender === user?._id,
                }]);
            }
        });

        return () => {
            unsubscribeFromChatMessage();
        };
    }, []);

    const loadConversation = async () => {
        try {
            setLoading(true);
            // Try to get existing conversations
            const res = await apiService.getConversations();
            const conversations = res.data?.conversations || res.data || [];
            
            // Find conversation related to this order or create new
            let conv = null;
            if (orderId) {
                conv = conversations.find(c => c.orderId === orderId || c.order === orderId);
            }
            if (!conv && conversations.length > 0) {
                conv = conversations[0]; // Use most recent conversation
            }

            if (conv) {
                setConversationId(conv._id);
                // Load messages for this conversation
                const msgRes = await apiService.getChatMessageHistory(conv._id);
                const msgs = msgRes.data?.messages || msgRes.data || [];
                setMessages(msgs.map(m => ({
                    _id: m._id,
                    text: m.text || m.content || m.message,
                    sender: m.sender?._id || m.sender,
                    senderName: m.sender?.name || m.senderName || 'Support',
                    createdAt: m.createdAt,
                    isOwn: (m.sender?._id || m.sender) === user?._id,
                })));
            }
        } catch (error) {
            console.log('Chat load info:', error?.message);
            // Not necessarily an error - might just be no conversations yet
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const messageText = inputText.trim();
        setInputText('');

        // Optimistic UI update
        const tempMsg = {
            _id: Date.now().toString(),
            text: messageText,
            sender: user?._id,
            senderName: user?.name || 'You',
            createdAt: new Date().toISOString(),
            isOwn: true,
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            setSending(true);
            const socket = getSocket();
            
            // Try to send via API
            await apiService.sendMessage({
                conversationId: conversationId,
                orderId: orderId,
                text: messageText,
                recipientRole: 'admin', // Default to admin support
            });

            // Also emit via socket for real-time
            if (socket && socket.connected) {
                socket.emit('chat:send', {
                    conversationId,
                    orderId,
                    text: messageText,
                    sender: user?._id,
                    senderName: user?.name,
                });
            }
        } catch (error) {
            console.error('Send message error:', error);
            // Don't remove the optimistic message — it shows the user their intent
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }) => {
        const isOwn = item.isOwn;
        return (
            <View style={[styles.messageBubbleContainer, isOwn ? styles.ownContainer : styles.otherContainer]}>
                {!isOwn && <Text style={styles.senderName}>{item.senderName}</Text>}
                <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>{item.text}</Text>
                    <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>{formatTime(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Support Chat</Text>
                    <Text style={styles.headerSubtitle}>
                        {orderId ? `Order #${orderId.substring(18).toUpperCase()}` : 'General Support'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => {
                    if (orderId) navigation.navigate('RaiseIssue', { orderId });
                }}>
                    <Ionicons name="flag" size={24} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {loading ? (
                    <View style={styles.loadingArea}>
                        <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                        <Ionicons name="chatbubbles-outline" size={64} color="#374151" />
                        <Text style={styles.emptyChatTitle}>No messages yet</Text>
                        <Text style={styles.emptyChatSub}>Send a message to connect with support.</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    {['Where is my order?', 'Customer not responding', 'Wrong address'].map((text) => (
                        <TouchableOpacity 
                            key={text} 
                            style={styles.quickChip}
                            onPress={() => setInputText(text)}
                        >
                            <Text style={styles.quickChipText}>{text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#6B7280"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Ionicons name="send" size={22} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#374151' },
    headerInfo: { flex: 1, marginLeft: 16 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    
    chatArea: { flex: 1 },
    loadingArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#9CA3AF', marginTop: 12 },

    emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    emptyChatTitle: { color: '#D1D5DB', fontSize: 20, fontWeight: 'bold', marginTop: 16 },
    emptyChatSub: { color: '#6B7280', fontSize: 14, marginTop: 8 },

    messagesList: { padding: 16, paddingBottom: 8 },
    messageBubbleContainer: { marginBottom: 12, maxWidth: '80%' },
    ownContainer: { alignSelf: 'flex-end' },
    otherContainer: { alignSelf: 'flex-start' },
    senderName: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 4, marginLeft: 4 },
    messageBubble: { borderRadius: 16, padding: 12, paddingBottom: 6 },
    ownBubble: { backgroundColor: '#FC8019', borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: '#1F2937', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#374151' },
    messageText: { fontSize: 15, lineHeight: 22 },
    ownText: { color: '#FFF' },
    otherText: { color: '#E5E7EB' },
    messageTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
    ownTime: { color: 'rgba(255,255,255,0.7)' },
    otherTime: { color: '#6B7280' },

    quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
    quickChip: { backgroundColor: '#1F2937', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#374151' },
    quickChipText: { color: '#D1D5DB', fontSize: 12, fontWeight: '500' },

    inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingTop: 8, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    textInput: { flex: 1, backgroundColor: '#111827', color: '#FFF', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: '#374151' },
    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FC8019', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    sendBtnDisabled: { backgroundColor: '#374151' },
});

export default SupportChatScreen;
