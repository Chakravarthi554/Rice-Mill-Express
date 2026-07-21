import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

const AddProductScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    offerPrice: '',
    description: '',
    category: 'Rice Grains',
    countInStock: '',
    brand: 'Sona Masuri',
    weight: '',
    unit: 'kg',
  });

  const categories = ['Rice Grains', 'Processed Rice', 'Rice Flour', 'Organic Rice', 'Brown Rice'];
  const brands = ['Sona Masuri', 'Samba Masuri', 'Telangana Sona', 'Swarna', 'Jagtial Sannalu', 'Tellahamsa', 'Brown Rice', 'Basmati'];
  const units = ['kg', 'g', 'quintal', 'ton'];

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can add up to 5 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow photo access in settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can add up to 5 photos.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow camera access in settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.countInStock) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', Number(formData.price));
      if (formData.offerPrice) data.append('offerPrice', Number(formData.offerPrice));
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('countInStock', Number(formData.countInStock));
      data.append('brand', formData.brand);
      if (formData.weight) data.append('weight', formData.weight);
      data.append('unit', formData.unit);

      // Append images
      images.forEach((uri, index) => {
        const filename = uri.split('/').pop();
        const ext = filename.split('.').pop();
        data.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          name: filename,
        });
      });

      await apiService.createProduct(data);
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Add product error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formSection}>
        {/* Image Upload Section */}
        <Text style={[styles.label, { color: colors.onSurface }]}>Product Photos</Text>
        <View style={styles.imageSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <View style={styles.addImageButtons}>
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                  <MaterialIcons name="photo-library" size={28} color="#16A34A" />
                  <Text style={styles.addImageText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addImageBtn} onPress={takePhoto}>
                  <MaterialIcons name="camera-alt" size={28} color="#3B82F6" />
                  <Text style={styles.addImageText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <Text style={styles.imageHint}>{images.length}/5 photos added</Text>
        </View>

        <Text style={[styles.label, { color: colors.onSurface }]}>Product Name *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g. Premium Sona Masuri Rice"
          placeholderTextColor={colors.onSurfaceVariant}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Price (₹) *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="e.g. 1200"
              keyboardType="numeric"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Offer Price (₹)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
              value={formData.offerPrice}
              onChangeText={(text) => setFormData({ ...formData, offerPrice: text })}
              placeholder="e.g. 999"
              keyboardType="numeric"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Weight *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="e.g. 25"
              keyboardType="numeric"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Unit</Text>
            <View style={styles.chipContainer}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.miniChip, { backgroundColor: formData.unit === u ? colors.primary : colors.surfaceVariant }]}
                  onPress={() => setFormData({ ...formData, unit: u })}
                >
                  <Text style={{ color: formData.unit === u ? '#fff' : colors.onSurface, fontSize: 12, fontWeight: '600' }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.onSurface }]}>Stock Quantity *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
          value={formData.countInStock}
          onChangeText={(text) => setFormData({ ...formData, countInStock: text })}
          placeholder="Number of items in stock"
          keyboardType="numeric"
          placeholderTextColor={colors.onSurfaceVariant}
        />

        <Text style={[styles.label, { color: colors.onSurface }]}>Category</Text>
        <View style={styles.chipContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                { 
                  backgroundColor: formData.category === cat ? colors.primary : colors.surfaceVariant,
                  borderColor: formData.category === cat ? colors.primary : colors.outline
                }
              ]}
              onPress={() => setFormData({ ...formData, category: cat })}
            >
              <Text style={{ color: formData.category === cat ? '#fff' : colors.onSurface }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.onSurface, marginTop: 15 }]}>Brand</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {brands.map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[
                styles.chip,
                { 
                  backgroundColor: formData.brand === brand ? colors.primary : colors.surfaceVariant,
                  borderColor: formData.brand === brand ? colors.primary : colors.outline,
                  marginRight: 8
                }
              ]}
              onPress={() => setFormData({ ...formData, brand })}
            >
              <Text style={{ color: formData.brand === brand ? '#fff' : colors.onSurface }}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.onSurface, marginTop: 15 }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.outline, color: colors.onSurface }]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Describe your product..."
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.onSurfaceVariant}
        />

      </View>

      <TouchableOpacity 
        style={[styles.submitButton, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="add-circle-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Add Product</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  formSection: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horizontalScroll: { flexDirection: 'row', paddingBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  miniChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 12, marginBottom: 40,
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Image styles
  imageSection: { marginBottom: 8 },
  imageScroll: { flexDirection: 'row' },
  imagePreview: { width: 100, height: 100, borderRadius: 12, marginRight: 10, position: 'relative' },
  previewImage: { width: '100%', height: '100%', borderRadius: 12 },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
  },
  addImageButtons: { flexDirection: 'row', gap: 10 },
  addImageBtn: {
    width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
  },
  addImageText: { fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: '600' },
  imageHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
});

export default AddProductScreen;
