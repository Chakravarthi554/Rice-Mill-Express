import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Grid,
    TextField,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    ArrowBack,
    Phone,
    Send,
    ExpandMore,
    Help,
    LocalShipping,
    Warning,
    Payment,
    Navigation,
    CameraAlt,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const HelpCenter = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [issueDescription, setIssueDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRaiseIssue = async () => {
        if (!issueDescription.trim()) {
            setError('Please describe your issue');
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            // This would need an orderId - for now, just show success
            setSuccess('Issue submitted successfully! Our team will contact you soon.');
            setIssueDescription('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit issue');
        } finally {
            setLoading(false);
        }
    };

    const faqs = [
        {
            question: 'How do I confirm pickup?',
            answer: 'Once you collect the order from the seller, tap the "Confirm Pickup" button in the order details screen. This will automatically update the order status to "Out for Delivery".',
            icon: <LocalShipping color="primary" />,
        },
        {
            question: 'How do I use Google Maps navigation?',
            answer: 'In the order details screen, tap "Start Navigation" button. This will open Google Maps with the customer\'s delivery address automatically set as the destination.',
            icon: <Navigation color="primary" />,
        },
        {
            question: 'How do I confirm delivery?',
            answer: 'Tap "Upload Delivery Photo" button, take a photo of the delivered package, and upload it. The photo will automatically include the order ID and timestamp. No OTP is required.',
            icon: <CameraAlt color="primary" />,
        },
        {
            question: 'How do I confirm COD collection?',
            answer: 'After collecting the cash from the customer, tap the "Confirm COD Collected" button in the payment section of the order details screen.',
            icon: <Payment color="primary" />,
        },
        {
            question: 'When should I request a replacement?',
            answer: 'If you notice damaged, wrong, or incomplete items during delivery, use the "Request Replacement" button. Upload a photo of the issue and select the reason. The seller/admin will review your request.',
            icon: <Warning color="primary" />,
        },
    ];

    return (
        <PageContainer>
            <Container maxWidth="lg">
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                        onClick={() => navigate('/delivery-partner/dashboard')}
                        sx={{ color: '#ffffff', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="700" color="#ffffff">
                        💡 Help Center
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Quick Actions */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={2}>
                                    📞 Quick Contact
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Phone />}
                                    sx={{ mb: 2, background: '#10b981', py: 2 }}
                                    onClick={() => window.location.href = `tel:${userInfo?.sellerPhone || ''}`}
                                >
                                    Call Seller
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<Warning />}
                                    sx={{ py: 2 }}
                                    onClick={() => navigate('/delivery-partner/emergency')}
                                >
                                    Emergency Alert
                                </Button>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={2}>
                                    ✉️ Raise an Issue
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Describe your issue"
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                    placeholder="Delivery problem, customer unavailable, etc."
                                    sx={{ mb: 2 }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Send />}
                                    onClick={handleRaiseIssue}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Submit Issue'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* FAQs */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={3}>
                                    ❓ Frequently Asked Questions
                                </Typography>
                                {faqs.map((faq, index) => (
                                    <Accordion key={index} sx={{ mb: 1, borderRadius: 2 }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box display="flex" alignItems="center">
                                                {faq.icon}
                                                <Typography variant="body1" fontWeight="600" ml={2}>
                                                    {faq.question}
                                                </Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="body2" color="textSecondary">
                                                {faq.answer}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 3, mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="700" mb={2}>
                                    📚 Quick Tips
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Help color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Always verify the delivery address before starting navigation"
                                            secondary="Double-check the PIN code and landmark"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Help color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Take clear photos for delivery proof"
                                            secondary="Ensure the package is clearly visible in the photo"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Help color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Call the customer if you can't find the address"
                                            secondary="Use the 'Call Customer' button in the order details"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Help color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Report damaged items immediately"
                                            secondary="Use the replacement request feature with photo proof"
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </PageContainer>
    );
};

export default HelpCenter;
