import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { apiService } from '../services/api';

const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params || {};
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price?.toString() || '',
    description: product?.description || '',
    category: product?.category || 'Rice Grains',
    countInStock: product?.countInStock?.toString() || '',
    brand: product?.brand || 'Sona Masuri'
  });

  const categories = ['Rice Grains', 'Processed Rice', 'Rice Flour'];
  const brands = ['Sona Masuri', 'Samba Masuri', 'Telangana Sona', 'Swarna', 'Jagtial Sannalu', 'Tellahamsa', 'Brown Rice', 'Basmati'];

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.countInStock) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        countInStock: Number(formData.countInStock),
        brand: formData.brand,
      };

      await apiService.updateProduct(product._id, submitData);
      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update product error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.formSection}>
        <Text style={[styles.label, { color: colors.onSurface }]}>Product Name *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="e.g. Premium Sona Masuri Rice"
          placeholderTextColor={colors.onSurfaceVariant}
        />

        <Text style={[styles.label, { color: colors.onSurface }]}>Price (₹) *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.outline, color: colors.onSurface }]}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          placeholder="e.g. 1200"
          keyboardType="numeric"
          placeholderTextColor={colors.onSurfaceVariant}
        />

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
            <MaterialIcons name="save" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Update Product</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalScroll: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default EditProductScreen;
