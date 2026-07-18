import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { createForumPost, resetForumPostCreate } from '../redux/actions/forumActions';

const CreateForumPostScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { loading, success, error } = useSelector((state) => state.forumPostCreate);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');

    const categories = ['General', 'Recipes', 'Tips', 'Questions', 'Announcements'];

    React.useEffect(() => {
        if (success) {
            Alert.alert('Success', 'Your post has been submitted for review!', [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(resetForumPostCreate());
                        navigation.goBack();
                    },
                },
            ]);
        }
    }, [success, navigation, dispatch]);

    const handleSubmit = () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!content.trim()) {
            Alert.alert('Error', 'Please enter content');
            return;
        }

        dispatch(createForumPost({ title, content, category }));
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter post title"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.categoriesContainer}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                category === cat && styles.categoryChipSelected,
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.categoryChipText,
                                    category === cat && styles.categoryChipTextSelected,
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Content *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Share your thoughts..."
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                />

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons name="send" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Submit Post</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.note}>
                    Note: Your post will be reviewed by moderators before it appears in the forum.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: {
        minHeight: 150,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    categoryChipSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
    },
    categoryChipTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorContainer: {
        padding: 12,
        backgroundColor: '#ffebee',
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    note: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default CreateForumPostScreen;
