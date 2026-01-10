// Advanced Share Modal with multiple platforms and QR code
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Snackbar,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    WhatsApp as WhatsAppIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Email as EmailIcon,
    QrCode as QrCodeIcon,
    Share as ShareIcon,
} from '@mui/icons-material';
import QRCode from 'qrcode';

const ShareModal = ({ open, onClose, recipeId, recipeTitle, onShare }) => {
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const shareUrl = `${window.location.origin}/recipes/${recipeId}`;
    const shareText = `Check out this amazing recipe: ${recipeTitle}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setSnackbarMessage('Link copied to clipboard!');
            setShowSnackbar(true);
            if (onShare) onShare('clipboard');
        } catch (error) {
            setSnackbarMessage('Failed to copy link');
            setShowSnackbar(true);
        }
    };

    const shareToWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        if (onShare) onShare('whatsapp');
    };

    const shareToFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        if (onShare) onShare('facebook');
    };

    const shareToTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank', 'width=600,height=400');
        if (onShare) onShare('twitter');
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(recipeTitle);
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        if (onShare) onShare('email');
    };

    const generateQRCode = async () => {
        try {
            const qrDataUrl = await QRCode.toDataURL(shareUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            setQrCodeUrl(qrDataUrl);
            setShowQR(true);
        } catch (error) {
            console.error('Error generating QR code:', error);
            setSnackbarMessage('Failed to generate QR code');
            setShowSnackbar(true);
        }
    };

    const useNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipeTitle,
                    text: shareText,
                    url: shareUrl,
                });
                if (onShare) onShare('native');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        }
    };

    const shareOptions = [
        {
            icon: <CopyIcon />,
            label: 'Copy Link',
            onClick: copyToClipboard,
            color: '#757575',
        },
        {
            icon: <WhatsAppIcon />,
            label: 'Share on WhatsApp',
            onClick: shareToWhatsApp,
            color: '#25D366',
        },
        {
            icon: <FacebookIcon />,
            label: 'Share on Facebook',
            onClick: shareToFacebook,
            color: '#1877F2',
        },
        {
            icon: <TwitterIcon />,
            label: 'Share on Twitter',
            onClick: shareToTwitter,
            color: '#1DA1F2',
        },
        {
            icon: <EmailIcon />,
            label: 'Share via Email',
            onClick: shareViaEmail,
            color: '#EA4335',
        },
        {
            icon: <QrCodeIcon />,
            label: 'Generate QR Code',
            onClick: generateQRCode,
            color: '#9C27B0',
        },
    ];

    // Add native share if available
    if (navigator.share) {
        shareOptions.unshift({
            icon: <ShareIcon />,
            label: 'Share...',
            onClick: useNativeShare,
            color: '#2196F3',
        });
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                        Share Recipe
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    {!showQR ? (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Share "{recipeTitle}" with your friends and family
                            </Typography>

                            <List>
                                {shareOptions.map((option, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem disablePadding>
                                            <ListItemButton
                                                onClick={() => {
                                                    option.onClick();
                                                    if (option.label !== 'Generate QR Code') {
                                                        setTimeout(() => onClose(), 500);
                                                    }
                                                }}
                                                sx={{
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: option.color }}>
                                                    {option.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={option.label}
                                                    primaryTypographyProps={{
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>

                            <Divider sx={{ my: 2 }} />

                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.default',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {shareUrl}
                                </Typography>
                                <IconButton size="small" onClick={copyToClipboard}>
                                    <CopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Scan QR Code
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Scan this code with your phone camera to open the recipe
                            </Typography>
                            <Box
                                component="img"
                                src={qrCodeUrl}
                                alt="QR Code"
                                sx={{
                                    width: 300,
                                    height: 300,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 2,
                                    bgcolor: 'white',
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => setShowQR(false)}
                                sx={{ mt: 3 }}
                            >
                                Back to Share Options
                            </Button>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={3000}
                onClose={() => setShowSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSnackbar(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ShareModal;
