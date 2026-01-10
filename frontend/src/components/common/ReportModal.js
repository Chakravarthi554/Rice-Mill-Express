import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlRadioButton,
    Radio,
    FormControlLabel,
    TextField,
    Checkbox,
    Typography,
    Box,
    Alert,
    Divider,
    Paper,
    Chip,
    CircularProgress
} from '@mui/material';
import { Report, Warning } from '@mui/icons-material';

const ReportModal = ({ open, onClose, post, onSubmit }) => {
    const [formData, setFormData] = useState({
        reportReason: '',
        reportCategory: '',
        additionalDetails: '',
        isAnonymous: false,
        severity: 'medium'
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const reportCategories = {
        spam: {
            label: 'Spam or Misleading',
            reasons: [
                'Spam or scam',
                'Misleading content',
                'Repetitive content'
            ]
        },
        inappropriate_content: {
            label: 'Inappropriate Content',
            reasons: [
                'Harassment or hate speech',
                'Violence or dangerous content',
                'Adult content',
                'Graphic content'
            ]
        },
        intellectual_property: {
            label: 'Intellectual Property',
            reasons: [
                'Copyright infringement',
                'Trademark violation'
            ]
        },
        false_information: {
            label: 'False Information',
            reasons: [
                'Misinformation',
                'Impersonation'
            ]
        },
        other: {
            label: 'Other',
            reasons: ['Other']
        }
    };

    const handleCategoryChange = (category) => {
        setFormData({
            ...formData,
            reportCategory: category,
            reportReason: '' // Reset reason when category changes
        });
        setErrors({ ...errors, reportCategory: '', reportReason: '' });
    };

    const handleReasonChange = (reason) => {
        setFormData({
            ...formData,
            reportReason: reason
        });
        setErrors({ ...errors, reportReason: '' });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.reportCategory) {
            newErrors.reportCategory = 'Please select a category';
        }

        if (!formData.reportReason) {
            newErrors.reportReason = 'Please select a reason';
        }

        if (formData.additionalDetails.length > 500) {
            newErrors.additionalDetails = 'Additional details must be 500 characters or less';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);
        try {
            await onSubmit(formData);
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to submit report' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            reportReason: '',
            reportCategory: '',
            additionalDetails: '',
            isAnonymous: false,
            severity: 'medium'
        });
        setErrors({});
        setSubmitting(false);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'error.light',
                color: 'error.contrastText'
            }}>
                <Report />
                <Typography variant="h6" fontWeight="bold">
                    Report Post
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {/* Post Preview */}
                {post && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                            Reporting:
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {post.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {post.content}
                        </Typography>
                    </Paper>
                )}

                {/* Error Alert */}
                {errors.submit && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.submit}
                    </Alert>
                )}

                {/* Category Selection */}
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Select Category *
                    </FormLabel>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(reportCategories).map(([key, { label }]) => (
                            <Paper
                                key={key}
                                onClick={() => handleCategoryChange(key)}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    border: 2,
                                    borderColor: formData.reportCategory === key ? 'primary.main' : 'transparent',
                                    bgcolor: formData.reportCategory === key ? 'primary.light' : 'background.paper',
                                    '&:hover': {
                                        bgcolor: formData.reportCategory === key ? 'primary.light' : 'action.hover'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Typography fontWeight={formData.reportCategory === key ? 'bold' : 'normal'}>
                                    {label}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                    {errors.reportCategory && (
                        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                            {errors.reportCategory}
                        </Typography>
                    )}
                </FormControl>

                {/* Reason Selection */}
                {formData.reportCategory && (
                    <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Select Reason *
                        </FormLabel>
                        <RadioGroup
                            value={formData.reportReason}
                            onChange={(e) => handleReasonChange(e.target.value)}
                        >
                            {reportCategories[formData.reportCategory].reasons.map((reason) => (
                                <FormControlLabel
                                    key={reason}
                                    value={reason}
                                    control={<Radio />}
                                    label={reason}
                                />
                            ))}
                        </RadioGroup>
                        {errors.reportReason && (
                            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                {errors.reportReason}
                            </Typography>
                        )}
                    </FormControl>
                )}

                {/* Additional Details */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>
                        Additional Details (Optional)
                    </FormLabel>
                    <TextField
                        multiline
                        rows={4}
                        placeholder="Provide any additional context that might help us review this report..."
                        value={formData.additionalDetails}
                        onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                        error={!!errors.additionalDetails}
                        helperText={
                            errors.additionalDetails ||
                            `${formData.additionalDetails.length}/500 characters`
                        }
                        fullWidth
                    />
                </FormControl>

                {/* Severity Level */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <FormLabel sx={{ fontWeight: 'bold', mb: 1 }}>
                        Severity Level
                    </FormLabel>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {['low', 'medium', 'high'].map((level) => (
                            <Chip
                                key={level}
                                label={level.charAt(0).toUpperCase() + level.slice(1)}
                                onClick={() => setFormData({ ...formData, severity: level })}
                                color={formData.severity === level ? 'primary' : 'default'}
                                variant={formData.severity === level ? 'filled' : 'outlined'}
                                sx={{ flex: 1 }}
                            />
                        ))}
                    </Box>
                </FormControl>

                {/* Anonymous Reporting */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={formData.isAnonymous}
                            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2" fontWeight="bold">
                                Submit anonymously
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Your identity will not be shared with the post author
                            </Typography>
                        </Box>
                    }
                />

                <Divider sx={{ my: 2 }} />

                {/* Warning */}
                <Alert severity="warning" icon={<Warning />}>
                    <Typography variant="body2">
                        False reports may result in restrictions on your account. Please only report content that genuinely violates our community guidelines.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="error"
                    disabled={submitting || !formData.reportReason}
                    startIcon={submitting ? <CircularProgress size={20} /> : <Report />}
                >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportModal;
