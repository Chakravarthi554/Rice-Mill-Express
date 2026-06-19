// [AI: Redesigned listing to match design image 1 (Cards with stock badges & toggles)]
import React, { useState, useEffect } from "react";
import {
  Container, Typography, Button, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Box, Alert, Grid,
  IconButton, Chip, FormControlLabel, Switch, InputAdornment, Menu, Divider
} from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Visibility, Edit, Delete, Warning, Add, Search, MoreVert, Inventory2 } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  listProducts, createProduct, updateProduct, deleteProduct, listSellerProducts,
} from "../../redux/actions/productActions";

const BRAND_OPTIONS = ['Sona Masuri', 'Samba Masuri', 'Telangana Sona', 'Swarna', 'Jagtial Sannalu', 'Tellahamsa', 'Brown Rice', 'Basmati'];
const CATEGORY_OPTIONS = ['Rice Grains', 'Processed Rice', 'Organic Rice', 'Premium Rice', 'Bulk Rice'];
const TYPE_OPTIONS = ['White Rice', 'Brown Rice', 'Red Rice', 'Black Rice', 'Parboiled Rice', 'Basmati Rice'];
const QUALITY_OPTIONS = ['Premium', 'Standard', 'Broken rice', 'Grade A'];
const DIET_PREFERENCE_OPTIONS = ['Diabetic-friendly', 'Gluten-free', 'Organic certified', 'Non-GMO'];
const COOKING_PURPOSE_OPTIONS = ['Biryani rice', 'Daily use', 'Idly/Dosa rice', 'Sweet rice', 'Fried rice'];
const UNIT_OPTIONS = ['kg', 'g', 'packet'];

const SellerProducts = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.productSellerList);
  const { userInfo } = useSelector((state) => state.userLogin);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [viewImages, setViewImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ brand: 'All', status: 'All' });

  const [formData, setFormData] = useState({
    name: "", brand: "", category: "", description: "", price: 0, offerPrice: 0,
    countInStock: 0, weight: 0, unit: "kg", type: "", quality: "",
    dietPreference: [], cookingPurpose: [], discounts: "", stockAvailability: "In-stock",
  });

  useEffect(() => { if (userInfo?._id) dispatch(listSellerProducts()); }, [dispatch, userInfo]);

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        dietPreference: Array.isArray(product.dietPreference) ? product.dietPreference : [],
        cookingPurpose: Array.isArray(product.cookingPurpose) ? product.cookingPurpose : [],
      });
      setSelectedImages(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "", brand: "", category: "", description: "", price: 0, offerPrice: 0,
        countInStock: 0, weight: 0, unit: "kg", type: "", quality: "",
        dietPreference: [], cookingPurpose: [], discounts: "", stockAvailability: "In-stock",
      });
      setSelectedImages([]);
    }
    setImageError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setEditingProduct(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dietPreference' || name === 'cookingPurpose') {
      setFormData({ ...formData, [name]: typeof value === 'string' ? value.split(',') : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageError('');
    if (files.length < 3 || files.length > 5) { setImageError('Please upload between 3 to 5 images'); return; }
    const invalidFiles = files.filter(file => file.size <= 1.5 * 1024 * 1024);
    if (invalidFiles.length > 0) { setImageError('Each image must be larger than 1.5MB for high quality display'); return; }
    setSelectedImages(files);
  };

  const handleSave = () => {
    if (!formData.name || !formData.brand || !formData.category || !formData.description || !formData.price || formData.countInStock === undefined || !formData.weight) {
      alert('Please fill in all required fields'); return;
    }
    if (!editingProduct && selectedImages.length === 0) {
      alert('Please upload 3-5 high-quality images (>1.5MB each)'); return;
    }

    if (editingProduct) {
      dispatch(updateProduct(editingProduct._id, formData)).then(() => dispatch(listSellerProducts()));
    } else {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) formData[key].forEach(value => data.append(key, value));
        else data.append(key, formData[key]);
      });
      selectedImages.forEach((image) => data.append('images', image));
      dispatch(createProduct(data)).then(() => dispatch(listSellerProducts()));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) dispatch(deleteProduct(id)).then(() => dispatch(listSellerProducts()));
  };

  const handleToggleActive = (product) => {
    // Treat countInStock=0 as inactive, >0 as active for this toggle, or if there's an isActive field.
    // Simulating toggle by adjusting stock status if no active field exists
    const updated = { ...product, isActive: product.isActive === undefined ? false : !product.isActive };
    dispatch(updateProduct(product._id, updated)).then(() => dispatch(listSellerProducts()));
  };

  const handleFilterClick = (event) => setFilterAnchor(event.currentTarget);
  const handleFilterClose = () => setFilterAnchor(null);
  const handleFilterSelect = (type, value) => {
    setActiveFilters({ ...activeFilters, [type]: value });
    handleFilterClose();
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = activeFilters.brand === 'All' || p.brand === activeFilters.brand;
    const matchesStatus = activeFilters.status === 'All' ||
      (activeFilters.status === 'In Stock' && p.countInStock > 0) ||
      (activeFilters.status === 'Out of Stock' && p.countInStock === 0);
    return matchesSearch && matchesBrand && matchesStatus;
  });
  const lowStockProducts = (products || []).filter(p => p.countInStock > 0 && p.countInStock <= 10);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Product Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, fontWeight: 700, borderRadius: 2 }}>
          Add Product
        </Button>
      </Box>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, border: '1px solid #FDE68A', bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Warning sx={{ color: '#F59E0B' }} />
            <Box>
              <Typography fontWeight={700} color="#92400E">Low Stock Alert</Typography>
              <Typography variant="body2" color="#B45309">{lowStockProducts.length} products running low on stock</Typography>
            </Box>
          </Box>
          <Button variant="contained" size="small" sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' }, borderRadius: 1.5, fontWeight: 700, color: 'white' }}>
            View & Restock
          </Button>
        </Paper>
      )}

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth placeholder="Search products..." size="small" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#9CA3AF' }} /></InputAdornment>, sx: { borderRadius: 2, bgcolor: '#fff' } }}
        />
        <Button
          variant="outlined"
          onClick={handleFilterClick}
          sx={{ borderColor: '#E5E7EB', color: '#374151', borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {activeFilters.brand === 'All' && activeFilters.status === 'All' ? 'Filter' : 'Filtered'}
        </Button>
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={handleFilterClose}>
          <Typography variant="overline" sx={{ px: 2, fontWeight: 800 }}>Brand</Typography>
          <MenuItem onClick={() => handleFilterSelect('brand', 'All')}>All Brands</MenuItem>
          {BRAND_OPTIONS.map(b => (
            <MenuItem key={b} onClick={() => handleFilterSelect('brand', b)} selected={activeFilters.brand === b}>{b}</MenuItem>
          ))}
          <Divider />
          <Typography variant="overline" sx={{ px: 2, fontWeight: 800 }}>Status</Typography>
          <MenuItem onClick={() => handleFilterSelect('status', 'All')}>All Status</MenuItem>
          <MenuItem onClick={() => handleFilterSelect('status', 'In Stock')} selected={activeFilters.status === 'In Stock'}>In Stock</MenuItem>
          <MenuItem onClick={() => handleFilterSelect('status', 'Out of Stock')} selected={activeFilters.status === 'Out of Stock'}>Out of Stock</MenuItem>
        </Menu>
      </Box>

      {/* Product Cards Grid */}
      <Grid container spacing={2}>
        {filteredProducts.map((product) => {
          const isOut = product.countInStock === 0;
          const isLow = product.countInStock > 0 && product.countInStock <= 10;
          const statusColors = isOut ? { bg: '#FEE2E2', text: '#B91C1C', label: 'Out of Stock' }
            : isLow ? { bg: '#FEF3C7', text: '#D97706', label: `Low Stock (${product.countInStock})` }
              : { bg: '#DCFCE7', text: '#166534', label: `In Stock (${product.countInStock})` };

          // Use the first image or a placeholder
          const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');
          const imgUrl = (product.images && product.images[0])
            ? (product.images[0].startsWith('http') ? product.images[0] : `${baseUrl}${product.images[0]}`)
            : null;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Image Area */}
                <Box sx={{ height: 140, bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Box sx={{ color: '#9CA3AF', textAlign: 'center' }}>
                      <Inventory2 sx={{ fontSize: 40 }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => { setViewImages(product.images || []); setImageDialogOpen(true); }} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#fff' } }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(product)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#fff' } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(product._id)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Details Area */}
                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom textTransform="uppercase">{product.brand}</Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ mb: 1, lineHeight: 1.2, height: 40, overflow: 'hidden' }}>{product.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={statusColors.label} size="small" sx={{ bgcolor: statusColors.bg, color: statusColors.text, fontWeight: 700, fontSize: '0.7rem' }} />
                    <Chip 
                      label={product.approvalStatus === 'approved' ? 'Approved' : product.approvalStatus === 'rejected' ? 'Rejected' : 'Pending Approval'} 
                      size="small" 
                      title={product.approvalStatus === 'rejected' ? `Reason: ${product.approvalRejectionReason || 'No reason provided'}` : ''}
                      sx={{ 
                        bgcolor: product.approvalStatus === 'approved' ? '#DCFCE7' : product.approvalStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7', 
                        color: product.approvalStatus === 'approved' ? '#166534' : product.approvalStatus === 'rejected' ? '#B91C1C' : '#D97706', 
                        fontWeight: 700, 
                        fontSize: '0.7rem' 
                      }} 
                    />
                  </Box>
                  {product.approvalStatus === 'rejected' && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: -1, mb: 1, fontWeight: 600 }}>
                      Reason: {product.approvalRejectionReason || 'No reason provided'}
                    </Typography>
                  )}

                  <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', pt: 1.5 }}>
                    <Typography variant="h6" fontWeight={800} color="#3B82F6">₹{product.price}</Typography>
                    <Switch
                      size="small"
                      checked={product.isActive !== false}
                      onChange={() => handleToggleActive(product)}
                      color="success"
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Editor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogContent dividers>
          {!editingProduct && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Upload 3-5 high-quality images (&gt;1.5MB each) for the best customer experience.</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            <TextField label="Name" name="name" value={formData.name} onChange={handleChange} fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField select label="Brand" name="brand" value={formData.brand} onChange={handleChange} fullWidth size="small">{BRAND_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select label="Category" name="category" value={formData.category} onChange={handleChange} fullWidth size="small">{CATEGORY_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={3} size="small" />
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Price" name="price" type="number" value={formData.price} onChange={handleChange} fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="Offer Price" name="offerPrice" type="number" value={formData.offerPrice} onChange={handleChange} fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="Count In Stock" name="countInStock" type="number" value={formData.countInStock} onChange={handleChange} fullWidth size="small" /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Weight" name="weight" type="number" value={formData.weight} onChange={handleChange} fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField select label="Unit" name="unit" value={formData.unit} onChange={handleChange} fullWidth size="small">{UNIT_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField></Grid>
            </Grid>
            {/* Image Upload Input for New Products */}
            {!editingProduct && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>Product Images (3-5 required)</Typography>
                <input accept="image/*" type="file" multiple onChange={handleImageUpload} style={{ display: 'none' }} id="image-upload" />
                <label htmlFor="image-upload">
                  <Button variant="outlined" component="span" fullWidth sx={{ py: 2, border: '2px dashed #E5E7EB', borderRadius: 2, color: '#6B7280' }}>
                    Upload Images ({selectedImages.length}/5 selected)
                  </Button>
                </label>
                {imageError && <Typography variant="caption" color="error">{imageError}</Typography>}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#6B7280', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#3B82F6', fontWeight: 700, borderRadius: 1.5 }}>
            {editingProduct ? "Update Product" : "Save Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Product Images</DialogTitle>
        <DialogContent>
          {viewImages.length > 0 ? (
            <Box sx={{ p: 2 }}>
              <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1}>
                {viewImages.map((img, index) => (
                  <Box key={index} sx={{ display: 'flex !important', justifyContent: 'center', alignItems: 'center', height: '400px', outline: 'none' }}>
                    <img src={img?.startsWith('http') ? img : `${process.env.REACT_APP_API_URL || ''}${img}`} alt={`Product ${index + 1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : <Typography align="center" sx={{ py: 4 }}>No images available.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setImageDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>

    </Box>
  );
};

export default SellerProducts;
