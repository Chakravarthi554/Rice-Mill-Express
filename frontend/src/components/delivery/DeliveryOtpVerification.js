import React, { useState, useEffect } from 'react';
import { auth, RecaptchaVerifier } from '../../firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import axios from 'axios';
import './DeliveryOtpVerification.css';

/**
 * Delivery OTP Verification Component
 * For delivery partners to verify customer phone and mark order as delivered
 */
const DeliveryOtpVerification = ({ order, onSuccess, onCancel }) => {
    const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP, 3: Upload proof
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [photoProof, setPhotoProof] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [notes, setNotes] = useState('');
    const [codAmount, setCodAmount] = useState(order?.totalPrice || 0);

    // Initialize reCAPTCHA
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    // Pre-fill customer phone if available
    useEffect(() => {
        if (order?.user?.phone) {
            setPhoneNumber(order.user.phone);
        }
    }, [order]);

    // Send OTP to customer phone
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate phone number
            if (!phoneNumber.startsWith('+91') || phoneNumber.length !== 13) {
                throw new Error('Please enter valid Indian phone number (+91XXXXXXXXXX)');
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

            setConfirmationResult(confirmation);
            setStep(2);
            setLoading(false);
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
            setLoading(false);
        }
    };

    // Verify OTP entered by delivery partner
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!confirmationResult) {
                throw new Error('Please request OTP first');
            }

            // Verify OTP with Firebase
            const result = await confirmationResult.confirm(otp);

            // Get Firebase ID token
            const idToken = await result.user.getIdToken();

            // Move to photo upload step
            setStep(3);
            setLoading(false);

            // Store token for final submission
            window.deliveryOtpToken = idToken;

        } catch (err) {
            console.error('Verify OTP error:', err);
            setError('Invalid OTP. Please check and try again.');
            setLoading(false);
        }
    };

    // Handle photo upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Photo size must be less than 5MB');
                return;
            }
            setPhotoProof(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Final submission - mark order as delivered
    const handleSubmitDelivery = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const idToken = window.deliveryOtpToken;
            if (!idToken) {
                throw new Error('OTP verification token not found');
            }

            // Upload photo if provided
            let photoUrl = null;
            if (photoProof) {
                const formData = new FormData();
                formData.append('file', photoProof);
                formData.append('folder', 'delivery_proofs');

                const uploadRes = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                photoUrl = uploadRes.data.url;
            }

            // Submit delivery confirmation
            const response = await axios.post('/api/delivery/confirm', {
                orderId: order._id,
                idToken,
                photoProofUrl: photoUrl,
                codAmount: order.paymentMethod === 'cod' ? codAmount : null,
                location: null, // Can add geolocation here
                notes
            });

            // Success!
            setLoading(false);
            if (onSuccess) {
                onSuccess(response.data);
            }

        } catch (err) {
            console.error('Submit delivery error:', err);
            setError(err.response?.data?.message || 'Failed to submit delivery. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="delivery-otp-modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Confirm Delivery - Order #{order?.orderNumber}</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>

                <div className="modal-body">
                    {/* Step 1: Enter Customer Phone */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP}>
                            <div className="step-indicator">Step 1 of 3: Customer Phone</div>

                            <div className="form-group">
                                <label>Customer Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+919876543210"
                                    required
                                    disabled={loading}
                                />
                                <small>Customer will receive OTP on this number</small>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div id="recaptcha-container"></div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP to Customer'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Enter OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="step-indicator">Step 2 of 3: Verify OTP</div>

                            <div className="success-message">
                                ✅ OTP sent to {phoneNumber}
                            </div>

                            <div className="form-group">
                                <label>Enter OTP (from customer)</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    maxLength="6"
                                    required
                                    disabled={loading}
                                    autoFocus
                                />
                                <small>Ask customer for the 6-digit OTP</small>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="button-group">
                                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                                    Back
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Upload Proof & Submit */}
                    {step === 3 && (
                        <form onSubmit={handleSubmitDelivery}>
                            <div className="step-indicator">Step 3 of 3: Delivery Proof</div>

                            <div className="success-message">
                                ✅ OTP Verified Successfully!
                            </div>

                            <div className="form-group">
                                <label>Photo Proof (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    disabled={loading}
                                />
                                {photoPreview && (
                                    <img src={photoPreview} alt="Proof" className="photo-preview" />
                                )}
                            </div>

                            {order?.paymentMethod === 'cod' && (
                                <div className="form-group">
                                    <label>COD Amount Collected</label>
                                    <input
                                        type="number"
                                        value={codAmount}
                                        onChange={(e) => setCodAmount(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional notes..."
                                    rows="3"
                                    disabled={loading}
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="button-group">
                                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                                    Back
                                </button>
                                <button type="submit" className="btn-success" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Confirm Delivery'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryOtpVerification;
