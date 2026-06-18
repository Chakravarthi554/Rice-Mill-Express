import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, IconButton,
    MenuItem, Grid, Autocomplete, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { submitRecipe } from '../../redux/actions/recipeActions';
import { listSellerProducts } from '../../redux/actions/productActions';

const RICE_TYPES = ['Sona Masuri', 'Samba Masuri', 'Telangana Sona', 'Swarna', 'Jagtial Sannalu', 'Tellahamsa', 'Brown Rice', 'Basmati'];

const SubmitRecipeDialog = ({ open, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { products = [] } = useSelector(state => state.productSellerList || {});
    const { loading, error } = useSelector(state => state.recipeSubmit || {});

    const [formData, setFormData] = useState({
        title: '',
        riceType: '',
        ingredients: [''],
        steps: [''],
        linkedProducts: []
    });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [video, setVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [videoError, setVideoError] = useState('');

    useEffect(() => {
        if (open) {
            dispatch(listSellerProducts());
        }
    }, [open, dispatch]);

    const handleIngredientChange = (index, value) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = value;
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const addIngredient = () => setFormData({ ...formData, ingredients: [...formData.ingredients, ''] });
    const removeIngredient = (index) => setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });

    const handleStepChange = (index, value) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const addStep = () => setFormData({ ...formData, steps: [...formData.steps, ''] });
    const removeStep = (index) => setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }
        setImages([...images, ...files]);
        
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const handleVideoChange = (e) => {
        setVideoError('');
        const file = e.target.files[0];
        if (file) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            videoElement.onloadedmetadata = () => {
                window.URL.revokeObjectURL(videoElement.src);
                if (videoElement.duration > 20) {
                    setVideoError('Video must not exceed 20 seconds');
                    setVideo(null);
                    setVideoPreview(null);
                } else {
                    setVideo(file);
                    setVideoPreview(URL.createObjectURL(file));
                }
            };
            videoElement.src = URL.createObjectURL(file);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    const removeVideo = () => {
        setVideo(null);
        setVideoPreview(null);
        setVideoError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.riceType || formData.ingredients.some(i => !i) || formData.steps.some(s => !s)) {
            return;
        }

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('riceType', formData.riceType);
        submitData.append('ingredients', JSON.stringify(formData.ingredients));
        submitData.append('steps', JSON.stringify(formData.steps));
        submitData.append('linkedProducts', JSON.stringify(formData.linkedProducts.map(p => p._id)));
        if (videoError) return;

        images.forEach(img => submitData.append('images', img));
        if (video) submitData.append('video', video);

        try {
            await dispatch(submitRecipe(submitData));
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                title: '',
                riceType: '',
                ingredients: [''],
                steps: [''],
                linkedProducts: []
            });
            setImages([]);
            setImagePreviews([]);
            setVideo(null);
            setVideoPreview(null);
            setVideoError('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle fontWeight={800}>Submit New Recipe</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Recipe Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                            />

                            <TextField
                                fullWidth
                                select
                                label="Primary Rice Type"
                                value={formData.riceType}
                                onChange={(e) => setFormData({ ...formData, riceType: e.target.value })}
                                required
                                sx={{ mb: 3 }}
                            >
                                {RICE_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </TextField>

                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Ingredients</Typography>
                            {formData.ingredients.map((ing, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={`Ingredient ${idx + 1}`}
                                        value={ing}
                                        onChange={(e) => handleIngredientChange(idx, e.target.value)}
                                        required
                                    />
                                    <IconButton size="small" color="error" onClick={() => removeIngredient(idx)} disabled={formData.ingredients.length === 1}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button startIcon={<AddIcon />} size="small" onClick={addIngredient} sx={{ mb: 3 }}>Add Ingredient</Button>

                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Steps</Typography>
                            {formData.steps.map((step, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        multiline
                                        placeholder={`Step ${idx + 1}`}
                                        value={step}
                                        onChange={(e) => handleStepChange(idx, e.target.value)}
                                        required
                                    />
                                    <IconButton size="small" color="error" onClick={() => removeStep(idx)} disabled={formData.steps.length === 1}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button startIcon={<AddIcon />} size="small" onClick={addStep} sx={{ mb: 3 }}>Add Step</Button>

                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Linked Products</Typography>
                            <Autocomplete
                                multiple
                                options={products}
                                getOptionLabel={(option) => option.name}
                                value={formData.linkedProducts}
                                onChange={(_, newValue) => setFormData({ ...formData, linkedProducts: newValue })}
                                renderInput={(params) => (
                                    <TextField {...params} variant="outlined" placeholder="Select products from your mill" />
                                )}
                                sx={{ mb: 2 }}
                            />
                            <Typography variant="caption" color="text.secondary">Link your own products used in this recipe for easy purchase by customers.</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box sx={{ border: '2px dashed #E5E7EB', borderRadius: 3, p: 2, textAlign: 'center', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                {imagePreviews.length > 0 ? (
                                    <Box sx={{ width: '100%', position: 'relative' }}>
                                        {imagePreviews.map((preview, index) => (
                                          <Box key={index} sx={{ mb: 2 }}>
                                            <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
                                            <Button size="small" onClick={() => removeImage(index)} sx={{ color: 'error.main' }}>Remove</Button>
                                          </Box>
                                        ))}
                                        {imagePreviews.length < 5 && (
                                          <label htmlFor="recipe-image-upload">
                                              <Button variant="outlined" component="span" size="small">Add More Images</Button>
                                          </label>
                                        )}
                                    </Box>
                                ) : (
                                    <>
                                        <UploadIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" gutterBottom>Upload Recipe Photos (Max 5)</Typography>
                                    </>
                                )}
                                <input accept="image/*" multiple style={{ display: 'none' }} id="recipe-image-upload" type="file" onChange={handleImageChange} />
                                {imagePreviews.length === 0 && (
                                  <label htmlFor="recipe-image-upload">
                                      <Button variant="outlined" component="span" size="small">Select Images</Button>
                                  </label>
                                )}
                            </Box>

                            <Box sx={{ border: '2px dashed #E5E7EB', borderRadius: 3, p: 2, textAlign: 'center', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {videoError && <Alert severity="error" sx={{ mb: 1, p: 0 }}>{videoError}</Alert>}
                                {videoPreview ? (
                                    <Box sx={{ width: '100%', position: 'relative' }}>
                                        <video src={videoPreview} controls style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
                                        <Button size="small" onClick={removeVideo} sx={{ mt: 1, color: 'error.main' }}>Remove</Button>
                                    </Box>
                                ) : (
                                    <>
                                        <UploadIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" gutterBottom>Upload Recipe Video (Max 20s)</Typography>
                                        <input accept="video/mp4,video/webm,video/quicktime" style={{ display: 'none' }} id="recipe-video-upload" type="file" onChange={handleVideoChange} />
                                        <label htmlFor="recipe-video-upload">
                                            <Button variant="outlined" component="span" size="small">Select Video</Button>
                                        </label>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700, px: 4 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Submit for Approval'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmitRecipeDialog;
