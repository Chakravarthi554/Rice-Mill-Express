import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Card, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';

const SellerKycScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    gstNumber: '',
    panNumber: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India'
    }
  });
  const [documents, setDocuments] = useState({
    idProof: null,
    addressProof: null,
    businessProof: null,
    gstCertificate: null,
    panCard: null
  });

  const handleNext = () => {
    if (step === 1 && (!formData.businessName || !formData.gstNumber || !formData.panNumber)) {
      alert('Please fill all required fields');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // Append business details
      formDataToSend.append('businessName', formData.businessName);
      formDataToSend.append('businessType', formData.businessType);
      formDataToSend.append('gstNumber', formData.gstNumber);
      formDataToSend.append('panNumber', formData.panNumber);
      formDataToSend.append('businessAddress', JSON.stringify(formData.businessAddress));

      // Append documents
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key, {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream'
          });
        }
      });

      await apiService.submitKyc(formDataToSend);

      Alert.alert(
        'Success',
        'KYC application submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('KYC submission error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit KYC application');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (fieldName) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (!result.canceled) {
        setDocuments(prev => ({
          ...prev,
          [fieldName]: result.assets[0]
        }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const takePhoto = async (fieldName) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setDocuments(prev => ({
          ...prev,
          [fieldName]: {
            uri: result.assets[0].uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image/jpeg'
          }
        }));
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.formContainer}>
            <TextInput
              label="Business Name *"
              value={formData.businessName}
              onChangeText={text => setFormData({ ...formData, businessName: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Business Type"
              value={formData.businessType}
              onChangeText={text => setFormData({ ...formData, businessType: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="GST Number *"
              value={formData.gstNumber}
              onChangeText={text => setFormData({ ...formData, gstNumber: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="PAN Number *"
              value={formData.panNumber}
              onChangeText={text => setFormData({ ...formData, panNumber: text })}
              style={styles.input}
              mode="outlined"
            />
            <Text style={styles.sectionTitle}>Business Address</Text>
            <TextInput
              label="Street Address"
              value={formData.businessAddress.street}
              onChangeText={text => setFormData({
                ...formData,
                businessAddress: { ...formData.businessAddress, street: text }
              })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="City"
              value={formData.businessAddress.city}
              onChangeText={text => setFormData({
                ...formData,
                businessAddress: { ...formData.businessAddress, city: text }
              })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="State"
              value={formData.businessAddress.state}
              onChangeText={text => setFormData({
                ...formData,
                businessAddress: { ...formData.businessAddress, state: text }
              })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="PIN Code"
              value={formData.businessAddress.pinCode}
              onChangeText={text => setFormData({
                ...formData,
                businessAddress: { ...formData.businessAddress, pinCode: text }
              })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Upload Required Documents</Text>

            <Card style={styles.documentCard}>
              <Card.Title title="ID Proof (Aadhar/Passport)" />
              <Card.Content>
                {documents.idProof ? (
                  <Text>{documents.idProof.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Not uploaded</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => pickDocument('idProof')}>Upload</Button>
                <Button onPress={() => takePhoto('idProof')}>Take Photo</Button>
              </Card.Actions>
            </Card>

            {/* Repeat similar Card components for other documents */}
            <Card style={styles.documentCard}>
              <Card.Title title="Address Proof" />
              <Card.Content>
                {documents.addressProof ? (
                  <Text>{documents.addressProof.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Not uploaded</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => pickDocument('addressProof')}>Upload</Button>
                <Button onPress={() => takePhoto('addressProof')}>Take Photo</Button>
              </Card.Actions>
            </Card>

            <Card style={styles.documentCard}>
              <Card.Title title="Business Proof" />
              <Card.Content>
                {documents.businessProof ? (
                  <Text>{documents.businessProof.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Not uploaded</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => pickDocument('businessProof')}>Upload</Button>
                <Button onPress={() => takePhoto('businessProof')}>Take Photo</Button>
              </Card.Actions>
            </Card>
          </View>
        );
      case 3:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Review Your Application</Text>

            <Card style={styles.reviewCard}>
              <Card.Title title="Business Details" />
              <Card.Content>
                <Text>Name: {formData.businessName}</Text>
                <Text>Type: {formData.businessType}</Text>
                <Text>GST: {formData.gstNumber}</Text>
                <Text>PAN: {formData.panNumber}</Text>
              </Card.Content>
            </Card>

            <Card style={styles.reviewCard}>
              <Card.Title title="Business Address" />
              <Card.Content>
                <Text>{formData.businessAddress.street}</Text>
                <Text>
                  {formData.businessAddress.city}, {formData.businessAddress.state}
                </Text>
                <Text>
                  {formData.businessAddress.pinCode}, {formData.businessAddress.country}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.reviewCard}>
              <Card.Title title="Documents" />
              <Card.Content>
                {Object.entries(documents).map(([key, file]) => (
                  <Text key={key}>
                    {key}: {file ? file.name : 'Not uploaded'}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>

      {renderStep()}

      <View style={styles.buttonContainer}>
        {step > 1 && (
          <Button
            mode="outlined"
            onPress={handlePrev}
            style={styles.button}
          >
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.button}
          >
            Next
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Submit Application
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  stepIndicator: {
    marginBottom: 20,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  documentCard: {
    marginBottom: 15,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  reviewCard: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default SellerKycScreen;