import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { submitRecipe, getMyRecipes } from '../redux/actions/recipeActions';
import { apiService } from '../services/api';
import { getImageUrl } from '../utils/url';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/customerTheme';

const RICE_TYPES = [
  'Sona Masuri',
  'Samba Masuri',
  'Telangana Sona',
  'Swarna',
  'Jagtial Sannalu',
  'Tellahamsa',
  'Brown Rice',
  'Basmati',
  'Arborio',
  'Jasmine',
  'Sushi Rice',
  'Wild Rice',
  'Other',
];

const CreateRecipeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading: submitting } = useSelector((state) => state.recipeSubmit || {});

  const [title, setTitle] = useState('');
  const [riceType, setRiceType] = useState(RICE_TYPES[0]);
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await apiService.getSellerProducts();
      setSellerProducts(res.data?.products || res.data || []);
    } catch (err) {
      console.error('Error loading seller products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Ingredient handlers
  const handleIngredientChange = (index, value) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };
  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Step handlers
  const handleStepChange = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };
  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Linked products toggle
  const toggleProductSelection = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Image picker
  const pickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.slice(0, 5 - images.length);
        setImages([...images, ...newImages]);
      }
    } catch (err) {
      console.error('Image pick error:', err);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Video picker
  const pickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 20000) {
          Alert.alert('Video too long', 'Recipe video must not exceed 20 seconds');
          return;
        }
        setVideo(asset);
      }
    } catch (err) {
      console.error('Video pick error:', err);
    }
  };

  const removeVideo = () => setVideo(null);

  // Submit Handler
  const handleSubmit = async () => {
    const cleanIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }
    if (cleanIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }
    if (cleanSteps.length === 0) {
      Alert.alert('Error', 'Please add at least one step');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('riceType', riceType);
      formData.append('ingredients', JSON.stringify(cleanIngredients));
      formData.append('steps', JSON.stringify(cleanSteps));
      formData.append('linkedProducts', JSON.stringify(selectedProductIds));

      images.forEach((img, idx) => {
        const filename = img.uri.split('/').pop() || `image_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri: img.uri,
          name: filename,
          type,
        });
      });

      if (video) {
        const filename = video.uri.split('/').pop() || 'video.mp4';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `video/${match[1]}` : 'video/mp4';
        formData.append('video', {
          uri: video.uri,
          name: filename,
          type,
        });
      }

      await dispatch(submitRecipe(formData));
      dispatch(getMyRecipes());
      Alert.alert(
        'Success',
        'Recipe submitted successfully! It will be live after admin review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Submission Error', err.message || 'Failed to submit recipe');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Recipe</Text>
          <Text style={styles.headerSubtitle}>
            Share authentic rice recipes with customers & link your products
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipe Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Authentic Hyderabadi Biryani"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Rice Type Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Rice Variety *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {RICE_TYPES.map((type) => {
              const active = riceType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setRiceType(type)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Ingredients *</Text>
            <TouchableOpacity onPress={addIngredient} style={styles.addBtn}>
              <Feather name="plus" size={16} color="#16A34A" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {ingredients.map((ing, idx) => (
            <View key={`ing_${idx}`} style={styles.dynamicRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Ingredient ${idx + 1}`}
                value={ing}
                onChangeText={(val) => handleIngredientChange(idx, val)}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.removeBtn}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions / Steps Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Preparation Steps *</Text>
            <TouchableOpacity onPress={addStep} style={styles.addBtn}>
              <Feather name="plus" size={16} color="#16A34A" />
              <Text style={styles.addBtnText}>Add Step</Text>
            </TouchableOpacity>
          </View>
          {steps.map((stepVal, idx) => (
            <View key={`step_${idx}`} style={styles.dynamicRow}>
              <Text style={styles.stepNum}>{idx + 1}.</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Step ${idx + 1} instructions`}
                multiline
                value={stepVal}
                onChangeText={(val) => handleStepChange(idx, val)}
              />
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => removeStep(idx)} style={styles.removeBtn}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Linked Products Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Link Your Products (Optional)</Text>
          <Text style={styles.sublabel}>
            Select your rice products featured in this recipe so customers can buy them directly!
          </Text>
          {loadingProducts ? (
            <ActivityIndicator size="small" color="#16A34A" style={{ marginVertical: 10 }} />
          ) : sellerProducts.length === 0 ? (
            <Text style={styles.emptyText}>No products added yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {sellerProducts.map((prod) => {
                const isSelected = selectedProductIds.includes(prod._id);
                return (
                  <TouchableOpacity
                    key={prod._id}
                    style={[styles.productChip, isSelected && styles.productChipSelected]}
                    onPress={() => toggleProductSelection(prod._id)}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'check-circle' : 'plus-circle-outline'}
                      size={16}
                      color={isSelected ? '#16A34A' : '#6B7280'}
                    />
                    <Text style={[styles.productChipText, isSelected && styles.productChipTextSelected]}>
                      {prod.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Photos (Up to 5)</Text>
          <View style={styles.mediaContainer}>
            {images.map((img, idx) => (
              <View key={`img_${idx}`} style={styles.previewBox}>
                <Image source={{ uri: img.uri }} style={styles.previewImg} />
                <TouchableOpacity onPress={() => removeImage(idx)} style={styles.closeMedia}>
                  <Feather name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
                <Feather name="camera" size={24} color="#6B7280" />
                <Text style={styles.uploadText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Video Upload Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Short Video Clip (Max 20s)</Text>
          {video ? (
            <View style={styles.videoPreviewCard}>
              <MaterialCommunityIcons name="video" size={32} color="#16A34A" />
              <Text style={styles.videoName} numberOfLines={1}>
                {video.uri.split('/').pop()}
              </Text>
              <TouchableOpacity onPress={removeVideo} style={styles.removeVideoBtn}>
                <Feather name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.videoUploadBox} onPress={pickVideo}>
              <Feather name="video" size={24} color="#6B7280" />
              <Text style={styles.uploadText}>Upload Short Video Clip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.submitButtonText}>Submit Recipe for Review</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  section: { marginBottom: 20, backgroundColor: '#fff', padding: 14, borderRadius: 12, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6 },
  sublabel: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipRow: { flexDirection: 'row', marginTop: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  chipText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  chipTextActive: { color: '#16A34A', fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  dynamicRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  stepNum: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  removeBtn: { padding: 6 },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  productChipSelected: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
  productChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  productChipTextSelected: { color: '#16A34A', fontWeight: '700' },
  emptyText: { fontSize: 12, color: '#9CA3AF' },
  mediaContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  previewBox: { width: 70, height: 70, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  previewImg: { width: '100%', height: '100%' },
  closeMedia: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  uploadBtn: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: { fontSize: 10, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  videoUploadBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#F9FAFB',
  },
  videoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  videoName: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#166534' },
  removeVideoBtn: { padding: 6 },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 2,
  },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CreateRecipeScreen;
