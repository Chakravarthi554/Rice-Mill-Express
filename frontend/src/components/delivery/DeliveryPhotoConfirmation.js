import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import './DeliveryPhotoConfirmation.css';

/**
 * Zepto-Style Photo-Based Delivery Confirmation
 * NO CUSTOMER OTP - Photo proof is the only verification
 * 
 * Flow:
 * 1. Delivery partner clicks "Confirm Delivery"
 * 2. Captures photo of delivered rice bag
 * 3. Photo uploads to Firebase Storage
 * 4. Optional: Capture current location
 * 5. Submit to backend with photo URL
 * 6. Order marked as delivered
 */
const DeliveryPhotoConfirmation = ({ order, onSuccess, onCancel }) => {
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState(null);
    const [notes, setNotes] = useState('');
    const [codAmount, setCodAmount] = useState(order?.totalPrice || 0);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Auto-capture location on mount (optional)
    useEffect(() => {
        captureLocation();
    }, []);

    // Capture device location using browser geolocation API (FREE)
    const captureLocation = () => {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported by browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                });
                setGettingLocation(false);
                console.log('✅ Location captured:', position.coords);
            },
            (error) => {
                console.warn('⚠️ Location capture failed:', error.message);
                setGettingLocation(false);
                // Don't show error to user - location is optional
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Handle photo selection from camera or gallery
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Photo size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setError('');
    };

    // Upload photo to Firebase Storage
    const uploadPhotoToFirebase = async (file) => {
        try {
            // Create unique filename
            const timestamp = Date.now();
            const filename = `delivery_proofs/${order._id}_${timestamp}_${file.name}`;

            // Create storage reference
            const storageRef = ref(storage, filename);

            // Upload file
            console.log('📤 Uploading photo to Firebase Storage...');
            const snapshot = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('✅ Photo uploaded successfully:', downloadURL);

            return downloadURL;
        } catch (error) {
            console.error('❌ Firebase upload error:', error);
            throw new Error('Failed to upload photo. Please try again.');
        }
    };

    // Submit delivery confirmation
    const handleSubmitDelivery = async (e) => {
        e.preventDefault();
        setError('');

        // Validate photo is required
        if (!photoFile) {
            setError('Photo proof is required to confirm delivery');
            return;
        }

        try {
            // Step 1: Upload photo to Firebase Storage
            setUploading(true);
            const photoUrl = await uploadPhotoToFirebase(photoFile);
            setUploading(false);

            // Step 2: Submit delivery confirmation to backend
            setSubmitting(true);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            const response = await axios.post('/api/delivery/confirm', {
                orderId: order._id,
                photoProofUrl: photoUrl,
                codAmount: order.paymentMethod === 'cod' ? codAmount : null,
                location: location,
                notes: notes.trim() || null
            }, {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            // Success!
            setSubmitting(false);
            console.log('✅ Delivery confirmed:', response.data);

            if (onSuccess) {
                onSuccess(response.data);
            }

        } catch (err) {
            console.error('❌ Submit delivery error:', err);
            setUploading(false);
            setSubmitting(false);
            setError(err.response?.data?.message || err.message || 'Failed to confirm delivery. Please try again.');
        }
    };

    const isLoading = uploading || submitting;

    return (
        <div className="delivery-photo-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>📦 Confirm Delivery</h2>
                    <button className="close-btn" onClick={onCancel} disabled={isLoading}>×</button>
                </div>

                <div className="modal-body">
                    {/* Order Info */}
                    <div className="order-info">
                        <p><strong>Order:</strong> #{order?.orderNumber || order?._id?.substring(0, 8)}</p>
                        <p><strong>Customer:</strong> {order?.user?.name}</p>
                        <p><strong>Amount:</strong> ₹{order?.totalPrice}</p>
                        {order?.paymentMethod === 'cod' && (
                            <p className="cod-badge">💰 Cash on Delivery</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmitDelivery}>
                        {/* Photo Capture - MANDATORY */}
                        <div className="form-group photo-section">
                            <label className="required">
                                📸 Photo Proof of Delivery
                                <span className="required-badge">Required</span>
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoChange}
                                disabled={isLoading}
                                required
                                id="photo-input"
                                style={{ display: 'none' }}
                            />

                            {!photoPreview ? (
                                <label htmlFor="photo-input" className="photo-upload-btn">
                                    <div className="upload-icon">📷</div>
                                    <div>Capture Photo of Delivered Item</div>
                                    <small>Tap to open camera or select from gallery</small>
                                </label>
                            ) : (
                                <div className="photo-preview-container">
                                    <img src={photoPreview} alt="Delivery Proof" className="photo-preview" />
                                    <label htmlFor="photo-input" className="change-photo-btn">
                                        Change Photo
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Location Info */}
                        <div className="location-info">
                            {gettingLocation ? (
                                <p className="info-text">📍 Capturing location...</p>
                            ) : location ? (
                                <p className="success-text">
                                    ✅ Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            ) : (
                                <p className="info-text">
                                    📍 Location capture failed (optional)
                                    <button type="button" onClick={captureLocation} className="retry-btn">
                                        Retry
                                    </button>
                                </p>
                            )}
                        </div>

                        {/* COD Amount (if applicable) */}
                        {order?.paymentMethod === 'cod' && (
                            <div className="form-group">
                                <label className="required">💰 Cash Collected</label>
                                <input
                                    type="number"
                                    value={codAmount}
                                    onChange={(e) => setCodAmount(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    min="0"
                                    step="0.01"
                                    className="cod-input"
                                />
                            </div>
                        )}

                        {/* Notes (Optional) */}
                        <div className="form-group">
                            <label>📝 Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional notes about the delivery..."
                                rows="3"
                                disabled={isLoading}
                                maxLength="500"
                            />
                            <small>{notes.length}/500 characters</small>
                        </div>

                        {/* Error Message */}
                        {error && <div className="error-message">❌ {error}</div>}

                        {/* Submit Buttons */}
                        <div className="button-group">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-success"
                                disabled={isLoading || !photoFile}
                            >
                                {uploading ? '📤 Uploading Photo...' :
                                    submitting ? '✅ Confirming Delivery...' :
                                        '✅ Confirm Delivery'}
                            </button>
                        </div>

                        {/* Info Text */}
                        <div className="info-box">
                            <p>ℹ️ <strong>No customer OTP required</strong></p>
                            <p>Simply capture a photo of the delivered rice bag and confirm.</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DeliveryPhotoConfirmation;
