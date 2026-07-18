import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getForumPosts } from '../redux/actions/forumActions';
import { getSocket, connectSocket } from '../services/socket';
import { COLORS, COMPONENTS, RADIUS, SPACING, TYPOGRAPHY } from '../styles/customerTheme';

const CATEGORY_ACCENTS = {
    General: { bg: '#EFF6FF', color: '#2563EB', icon: 'message-text-outline' },
    Recipes: { bg: '#F0FDF4', color: '#16A34A', icon: 'chef-hat' },
    Farming: { bg: '#FEF3C7', color: '#B45309', icon: 'sprout' },
    Support: { bg: '#F5F3FF', color: '#7C3AED', icon: 'lifebuoy' },
};

const ForumScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { posts = [], loading, error } = useSelector((state) => state.forumPostList || {});
    const authState = useSelector((state) => state.auth || {});
    const currentUser = authState.userInfo || authState.user;
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(getForumPosts());

        let socket = getSocket();
        // Debounce helper to prevent rapid consecutive refetches
        let refetchTimer = null;
        const debouncedRefetch = () => {
            if (refetchTimer) clearTimeout(refetchTimer);
            refetchTimer = setTimeout(() => dispatch(getForumPosts()), 1500);
        };

        if (!socket) {
            connectSocket().then((s) => {
                socket = s;
                setupListeners(s);
            });
        } else {
            setupListeners(socket);
            if (!socket.connected) socket.connect();
        }

        function setupListeners(s) {
            if (!s) return;
            // Only refetch on structural changes (new post, delete, status change)
            // Do NOT refetch on SOCIAL_UPDATE (likes/comments) — those are handled by Redux
            s.on('NEW_FORUM_POST', debouncedRefetch);
            s.on('POST_DELETED', debouncedRefetch);
            s.on('POST_STATUS_CHANGED', debouncedRefetch);
        }

        return () => {
            if (refetchTimer) clearTimeout(refetchTimer);
            if (socket) {
                socket.off('NEW_FORUM_POST');
                socket.off('POST_DELETED');
                socket.off('POST_STATUS_CHANGED');
            }
        };
    }, [dispatch]);

    const handleRefresh = () => {
        setRefreshing(true);
        dispatch(getForumPosts(searchQuery)).finally(() => setRefreshing(false));
    };

    const handleSearch = () => {
        dispatch(getForumPosts(searchQuery));
    };

    const renderPostCard = ({ item, index }) => {
        const accent = CATEGORY_ACCENTS[item.category] || CATEGORY_ACCENTS.General;
        const authorName = item.user?.name || item.userId?.name || 'Rice Mill Community';
        const initial = authorName?.charAt(0)?.toUpperCase() || 'R';
        const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.94}
                onPress={() => navigation.navigate('ForumPostDetail', { postId: item._id })}
            >
                <View style={styles.cardTopRow}>
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={styles.authorMeta}>
                            <View style={styles.authorTitleRow}>
                                <Text style={styles.authorName}>{authorName}</Text>
                                {item.isPinned ? (
                                    <View style={styles.pinnedChip}>
                                        <Feather name="bookmark" size={11} color={COLORS.orangeDark} />
                                        <Text style={styles.pinnedText}>Pinned</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.authorSub}>{createdDate}</Text>
                        </View>
                    </View>
                    <View style={[styles.categoryChip, { backgroundColor: accent.bg }]}>
                        <MaterialCommunityIcons name={accent.icon} size={13} color={accent.color} />
                        <Text style={[styles.categoryText, { color: accent.color }]}>{item.category || 'General'}</Text>
                    </View>
                </View>

                <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>

                <View style={styles.cardFooter}>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Feather name="thumbs-up" size={14} color={COLORS.textMuted} />
                            <Text style={styles.statText}>{item.likesCount || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Feather name="message-circle" size={14} color={COLORS.textMuted} />
                            <Text style={styles.statText}>{item.commentsCount || 0}</Text>
                        </View>
                    </View>
                    <View style={styles.replyCta}>
                        <Text style={styles.replyText}>{index === 0 ? 'Trending' : 'Open'}</Text>
                        <Feather name="arrow-right" size={13} color={COLORS.greenPrimary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.greenPrimary} />
                <Text style={styles.loadingText}>Loading community posts...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={posts}
                renderItem={renderPostCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.greenPrimary]} />}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <View style={styles.heroCard}>
                            <Text style={styles.heroEyebrow}>Community Forum</Text>
                            <Text style={styles.heroTitle}>Ask, share, and learn from real rice buyers</Text>
                            <Text style={styles.heroSubtitle}>
                                Join conversations around recipes, delivery tips, grain quality, and everyday cooking ideas.
                            </Text>

                            <View style={styles.searchShell}>
                                <Feather name="search" size={18} color={COLORS.textMuted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search questions, topics, updates..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                />
                            </View>

                            <View style={styles.heroActions}>
                                <TouchableOpacity style={styles.secondaryAction} onPress={handleSearch}>
                                    <Feather name="filter" size={15} color={COLORS.greenPrimary} />
                                    <Text style={styles.secondaryActionText}>Search</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.primaryAction}
                                    onPress={() => navigation.navigate('CreateForumPost')}
                                >
                                    <Feather name="edit-3" size={15} color={COLORS.textInverse} />
                                    <Text style={styles.primaryActionText}>New Post</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.summaryStrip}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{posts.length}</Text>
                                <Text style={styles.summaryLabel}>Discussions</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>
                                    {posts.filter((item) => item.isPinned).length}
                                </Text>
                                <Text style={styles.summaryLabel}>Pinned</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>
                                    {posts.reduce((sum, item) => sum + (item.commentsCount || 0), 0)}
                                </Text>
                                <Text style={styles.summaryLabel}>Replies</Text>
                            </View>
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Feather name="alert-circle" size={18} color={COLORS.red} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}
                    </>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <MaterialCommunityIcons name="forum-outline" size={34} color={COLORS.greenPrimary} />
                            </View>
                            <Text style={styles.emptyTitle}>No posts found</Text>
                            <Text style={styles.emptyText}>Start a conversation about rice quality, recipes, or delivery.</Text>
                            <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('CreateForumPost')}>
                                <Feather name="plus" size={15} color={COLORS.textInverse} />
                                <Text style={styles.primaryActionText}>Create First Post</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        ...COMPONENTS.screen,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
        backgroundColor: COLORS.bgPage,
    },
    loadingText: {
        ...TYPOGRAPHY.body,
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xxxl,
    },
    heroCard: {
        ...COMPONENTS.heroCard,
        backgroundColor: COLORS.bgCard,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    heroEyebrow: {
        ...TYPOGRAPHY.label,
        color: COLORS.greenPrimary,
        marginBottom: SPACING.sm,
    },
    heroTitle: {
        ...TYPOGRAPHY.display,
        lineHeight: 34,
        marginBottom: SPACING.sm,
    },
    heroSubtitle: {
        ...TYPOGRAPHY.body,
        lineHeight: 21,
        marginBottom: SPACING.lg,
    },
    searchShell: {
        ...COMPONENTS.searchBar,
        marginBottom: SPACING.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    heroActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    secondaryAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: COLORS.greenMid,
        backgroundColor: COLORS.greenLight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryActionText: {
        color: COLORS.greenPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    primaryAction: {
        flex: 1,
        minHeight: 48,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.greenPrimary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...COMPONENTS.pillBtnPrimary,
    },
    primaryActionText: {
        color: COLORS.textInverse,
        fontSize: 14,
        fontWeight: '800',
    },
    summaryStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    summaryDivider: {
        width: 1,
        height: 28,
        backgroundColor: COLORS.borderStrong,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.redLight,
        borderRadius: RADIUS.md,
    },
    errorText: {
        flex: 1,
        color: COLORS.red,
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        ...COMPONENTS.card,
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.greenPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    avatarText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '800',
    },
    authorMeta: {
        flex: 1,
    },
    authorTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 2,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    authorSub: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    pinnedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.orangeLight,
    },
    pinnedText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.orangeDark,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: RADIUS.pill,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
    },
    postTitle: {
        ...TYPOGRAPHY.h3,
        lineHeight: 24,
        marginBottom: SPACING.sm,
    },
    postContent: {
        ...TYPOGRAPHY.body,
        lineHeight: 21,
        marginBottom: SPACING.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    statRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    replyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    replyText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.greenPrimary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxxl,
        paddingHorizontal: SPACING.xl,
    },
    emptyIcon: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: COLORS.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h2,
        marginBottom: SPACING.xs,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
});

export default ForumScreen;
