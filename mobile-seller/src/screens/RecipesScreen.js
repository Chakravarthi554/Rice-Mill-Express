import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getRecipes } from '../redux/actions/recipeActions';
import { getImageUrl } from '../utils/url';
import { COLORS, COMPONENTS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../styles/customerTheme';

const riceTypes = ['Basmati', 'Jasmine', 'Brown Rice', 'Arborio', 'Sushi Rice', 'Wild Rice', 'Other'];

const riceTypeStyles = {
    Basmati: { bg: '#FEF3C7', color: '#B45309', icon: 'grain' },
    Jasmine: { bg: '#E0F2FE', color: '#0369A1', icon: 'flower-pollen' },
    'Brown Rice': { bg: '#F5E6D3', color: '#9A3412', icon: 'barley' },
    Arborio: { bg: '#F3E8FF', color: '#7E22CE', icon: 'rice' },
    'Sushi Rice': { bg: '#FCE7F3', color: '#BE185D', icon: 'fish' },
    'Wild Rice': { bg: '#DCFCE7', color: '#166534', icon: 'sprout' },
    Other: { bg: '#E2E8F0', color: '#475569', icon: 'food-variant' },
};

const RecipesScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { recipes = [], loading, error } = useSelector((state) => state.recipeList || {});
    const [searchQuery, setSearchQuery] = useState('');
    const [riceType, setRiceType] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(getRecipes(searchQuery, '', riceType));
    }, [dispatch, riceType]);

    const handleRefresh = () => {
        setRefreshing(true);
        dispatch(getRecipes(searchQuery, '', riceType)).finally(() => setRefreshing(false));
    };

    const handleSearch = () => {
        dispatch(getRecipes(searchQuery, '', riceType));
    };

    const featuredRecipe = recipes?.[0];

    const filteredStats = useMemo(() => {
        const total = recipes.length;
        const linked = recipes.filter((item) => item.linkedProducts?.length > 0).length;
        return { total, linked };
    }, [recipes]);

    const renderRecipeCard = ({ item, index }) => {
        const chipStyle = riceTypeStyles[item.riceType] || riceTypeStyles.Other;
        const rating = Number(item.averageRating || item.rating || 0).toFixed(1);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: item._id })}
            >
                <View style={styles.imageWrap}>
                    {item.image ? (
                        <Image source={{ uri: getImageUrl(item.image) }} style={styles.recipeImage} />
                    ) : (
                        <View style={styles.imageFallback}>
                            <MaterialCommunityIcons name="rice" size={42} color={COLORS.greenPrimary} />
                        </View>
                    )}
                    <View style={[styles.recipeTypeChip, { backgroundColor: chipStyle.bg }]}>
                        <MaterialCommunityIcons name={chipStyle.icon} size={14} color={chipStyle.color} />
                        <Text style={[styles.recipeTypeText, { color: chipStyle.color }]}>{item.riceType || 'Recipe'}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                        <Feather name="star" size={12} color={COLORS.amber} />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.recipeTitle} numberOfLines={2}>{item.title}</Text>
                        {index < 2 && (
                            <View style={styles.trendingBadge}>
                                <Feather name="trending-up" size={12} color={COLORS.orangeDark} />
                            </View>
                        )}
                    </View>

                    <Text style={styles.recipeDescription} numberOfLines={2}>
                        {item.description || 'Discover a fresh rice recipe with authentic flavor and easy steps.'}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Feather name="user" size={13} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>{item.sellerId?.name || 'Rice Mill Kitchen'}</Text>
                        </View>
                        {item.linkedProducts?.length > 0 && (
                            <View style={styles.metaItem}>
                                <Feather name="shopping-bag" size={13} color={COLORS.textMuted} />
                                <Text style={styles.metaText} numberOfLines={1}>
                                    {item.linkedProducts.length} linked product{item.linkedProducts.length > 1 ? 's' : ''}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={styles.viewRecipeText}>View Recipe</Text>
                        <View style={styles.viewButton}>
                            <Feather name="arrow-right" size={14} color={COLORS.greenPrimary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.greenPrimary} />
                <Text style={styles.loadingText}>Preparing fresh recipe ideas...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={recipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item) => item._id}
                numColumns={1}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.greenPrimary]} />}
                ListHeaderComponent={
                    <>
                        <View style={styles.heroCard}>
                            <View style={styles.heroGlow} />
                            <Text style={styles.heroEyebrow}>Kitchen Stories</Text>
                            <Text style={styles.heroTitle}>Recipes curated for every rice lover</Text>
                            <Text style={styles.heroSubtitle}>
                                Explore home-style favorites, premium serving ideas, and dishes matched to your grain preferences.
                            </Text>

                            <View style={styles.searchBar}>
                                <Feather name="search" size={18} color={COLORS.textMuted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search pulao, biryani, pongal..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                />
                                <TouchableOpacity style={styles.searchAction} onPress={handleSearch}>
                                    <Feather name="arrow-right" size={16} color={COLORS.textInverse} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>{filteredStats.total}</Text>
                                    <Text style={styles.statLabel}>Recipes</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>{filteredStats.linked}</Text>
                                    <Text style={styles.statLabel}>Shop-ready</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>{riceType || 'All'}</Text>
                                    <Text style={styles.statLabel}>Rice Type</Text>
                                </View>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                        >
                            <TouchableOpacity
                                style={[styles.filterChip, !riceType && styles.filterChipActive]}
                                onPress={() => setRiceType('')}
                            >
                                <Text style={[styles.filterText, !riceType && styles.filterTextActive]}>All Recipes</Text>
                            </TouchableOpacity>
                            {riceTypes.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.filterChip, riceType === type && styles.filterChipActive]}
                                    onPress={() => setRiceType(type)}
                                >
                                    <Text style={[styles.filterText, riceType === type && styles.filterTextActive]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {featuredRecipe && (
                            <TouchableOpacity
                                style={styles.featuredCard}
                                activeOpacity={0.95}
                                onPress={() => navigation.navigate('RecipeDetail', { recipeId: featuredRecipe._id })}
                            >
                                <View style={styles.featuredCopy}>
                                    <Text style={styles.featuredLabel}>Featured Recipe</Text>
                                    <Text style={styles.featuredTitle} numberOfLines={2}>{featuredRecipe.title}</Text>
                                    <Text style={styles.featuredSubtitle} numberOfLines={2}>
                                        {featuredRecipe.description || 'Chef-picked flavors with a premium grain pairing.'}
                                    </Text>
                                </View>
                                <View style={styles.featuredArt}>
                                    <MaterialCommunityIcons name="chef-hat" size={34} color={COLORS.greenDeep} />
                                </View>
                            </TouchableOpacity>
                        )}

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Feather name="alert-triangle" size={18} color={COLORS.red} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}
                    </>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <MaterialCommunityIcons name="silverware-fork-knife" size={34} color={COLORS.greenPrimary} />
                            </View>
                            <Text style={styles.emptyTitle}>No recipes found</Text>
                            <Text style={styles.emptyText}>Try another search or switch the rice type filter.</Text>
                            <TouchableOpacity style={styles.emptyButton} onPress={() => { setSearchQuery(''); setRiceType(''); dispatch(getRecipes('', '', '')); }}>
                                <Text style={styles.emptyButtonText}>Clear Filters</Text>
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
        backgroundColor: COLORS.greenDeep,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    heroGlow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -70,
        right: -50,
    },
    heroEyebrow: {
        ...TYPOGRAPHY.label,
        color: 'rgba(255,255,255,0.72)',
        marginBottom: SPACING.sm,
    },
    heroTitle: {
        ...TYPOGRAPHY.display,
        color: COLORS.textInverse,
        marginBottom: SPACING.sm,
        lineHeight: 34,
    },
    heroSubtitle: {
        ...TYPOGRAPHY.body,
        color: 'rgba(255,255,255,0.82)',
        lineHeight: 21,
        marginBottom: SPACING.lg,
    },
    searchBar: {
        ...COMPONENTS.searchBar,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: SPACING.md,
    },
    searchInput: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    searchAction: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.greenPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: RADIUS.md,
        padding: SPACING.md,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textInverse,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.72)',
    },
    filterRow: {
        gap: SPACING.sm,
        paddingBottom: SPACING.lg,
    },
    filterChip: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.bgCard,
        borderWidth: 1,
        borderColor: COLORS.borderStrong,
    },
    filterChipActive: {
        backgroundColor: COLORS.greenPrimary,
        borderColor: COLORS.greenPrimary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.textInverse,
    },
    featuredCard: {
        ...COMPONENTS.card,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        padding: SPACING.lg,
        backgroundColor: '#F3FAF4',
    },
    featuredCopy: {
        flex: 1,
        paddingRight: SPACING.md,
    },
    featuredLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.greenPrimary,
        marginBottom: SPACING.xs,
    },
    featuredTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    featuredSubtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    featuredArt: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: COLORS.greenMid,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.redLight,
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
        overflow: 'hidden',
    },
    imageWrap: {
        position: 'relative',
        height: 196,
        backgroundColor: COLORS.greenLight,
    },
    recipeImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recipeTypeChip: {
        position: 'absolute',
        left: SPACING.md,
        top: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
    },
    recipeTypeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    ratingPill: {
        position: 'absolute',
        right: SPACING.md,
        bottom: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    cardBody: {
        padding: SPACING.md,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    recipeTitle: {
        ...TYPOGRAPHY.h3,
        flex: 1,
        lineHeight: 24,
    },
    trendingBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.orangeLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    recipeDescription: {
        ...TYPOGRAPHY.body,
        lineHeight: 20,
        marginBottom: SPACING.md,
    },
    metaRow: {
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    viewRecipeText: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.greenPrimary,
    },
    viewButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
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
    emptyButton: {
        ...COMPONENTS.pillBtnPrimary,
        paddingVertical: 12,
        paddingHorizontal: 22,
    },
    emptyButtonText: {
        color: COLORS.textInverse,
        fontSize: 14,
        fontWeight: '800',
    },
});

export default RecipesScreen;
