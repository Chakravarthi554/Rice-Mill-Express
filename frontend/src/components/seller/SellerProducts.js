// [AI: Product dropdowns and image validation overhaul]
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Alert,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../redux/actions/productActions";

// ✅ PREDEFINED OPTIONS FOR DROPDOWNS
const BRAND_OPTIONS = [
  'Sona Masuri', 'Samba Masuri (BPT 5204)', 'Telangana Sona (RNR 15048)',
  'Swarna (MTU 7029)', 'Jagtial Sannalu (JGL 1798, JGL 3844)',
  'Kunaram Sannalu (KNM 118, KNM 1189)', 'Tellahamsa',
  'Red Rice (Erramallelu, Champa)', 'Brown Rice', 'Basmati', 'Parboiled Rice'
];

const CATEGORY_OPTIONS = [
  'Rice Grains', 'Processed Rice', 'Organic Rice', 'Premium Rice', 'Bulk Rice'
];

const TYPE_OPTIONS = [
  'White Rice', 'Brown Rice', 'Red Rice', 'Black Rice', 'Parboiled Rice',
  'Basmati Rice', 'Jasmine Rice', 'Wild Rice', 'Arborio Rice'
];

const QUALITY_OPTIONS = [
  'Premium (export grade, organic certified)',
  'Standard (fine rice for daily use)',
  'Broken rice (budget-friendly)',
  'Grade A (premium quality)',
  'Grade B (standard quality)',
  'Grade C (economy quality)'
];

const DIET_PREFERENCE_OPTIONS = [
  'Diabetic-friendly (low GI rice)',
  'Gluten-free',
  'Organic certified',
  'Non-GMO',
  'Vegan',
  'Halal certified',
  'Kosher certified'
];

const COOKING_PURPOSE_OPTIONS = [
  'Biryani rice',
  'Daily use',
  'Idly/Dosa rice',
  'Sweet rice',
  'Fried rice',
  'Pilaf rice',
  'Risotto rice',
  'Sushi rice'
];

const UNIT_OPTIONS = ['kg', 'g', 'packet'];

const SellerProducts = () => {
  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { products } = productList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    description: "",
    price: 0,
    offerPrice: 0,
    countInStock: 0,
    weight: 0,
    unit: "kg",
    type: "",
    quality: "",
    dietPreference: [], // Changed to array for multi-select
    cookingPurpose: [], // Changed to array for multi-select
    discounts: "",
    stockAvailability: "In-stock",
  });

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(listProducts());
    }
  }, [dispatch, userInfo]);

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
        name: "",
        brand: "",
        category: "",
        description: "",
        price: 0,
        offerPrice: 0,
        countInStock: 0,
        weight: 0,
        unit: "kg",
        type: "",
        quality: "",
        dietPreference: [],
        cookingPurpose: [],
        discounts: "",
        stockAvailability: "In-stock",
      });
      setSelectedImages([]);
    }
    setImageError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle multi-select fields
    if (name === 'dietPreference' || name === 'cookingPurpose') {
      setFormData({ ...formData, [name]: typeof value === 'string' ? value.split(',') : value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageError('');

    // Validate image count (3-5 images)
    if (files.length < 3 || files.length > 5) {
      setImageError('Please upload between 3 to 5 images');
      return;
    }

    // Validate file sizes (>1.5MB each)
    const invalidFiles = files.filter(file => file.size <= 1.5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setImageError('Each image must be larger than 1.5MB for high quality display');
      return;
    }

    // Validate file types
    const invalidTypes = files.filter(file => !file.type.startsWith('image/'));
    if (invalidTypes.length > 0) {
      setImageError('Only image files are allowed');
      return;
    }

    setSelectedImages(files);
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name || !formData.brand || !formData.category || !formData.description ||
        !formData.price || !formData.countInStock || !formData.weight) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate images for new products
    if (!editingProduct && selectedImages.length === 0) {
      alert('Please upload 3-5 high-quality images (>1.5MB each)');
      return;
    }

    if (editingProduct) {
      dispatch(updateProduct(editingProduct._id, formData));
    } else {
      const data = new FormData();

      // Add form data
      Object.keys(formData).forEach((key) => {
        if (Array.isArray(formData[key])) {
          // Handle array fields
          formData[key].forEach(value => data.append(key, value));
        } else {
          data.append(key, formData[key]);
        }
      });

      // Add images
      selectedImages.forEach((image, index) => {
        data.append('images', image);
      });

      dispatch(createProduct(data));
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      dispatch(deleteProduct(id));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#2e7d32" }}
      >
        My Products
      </Typography>

      <Button
        variant="contained"
        sx={{
          mb: 2,
          backgroundColor: "#2e7d32",
          "&:hover": { backgroundColor: "#1b5e20" },
        }}
        onClick={() => handleOpenDialog()}
      >
        Add Product
      </Button>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>₹{product.price}</TableCell>
                <TableCell>{product.countInStock}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDialog(product)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogContent>
          {!editingProduct && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Use dropdowns for better categorization. Upload 3-5 high-quality images (>1.5MB each) for the best customer experience.
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Brand *"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              fullWidth
              required
            >
              {BRAND_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Category *"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
              required
            >
              {CATEGORY_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Offer Price"
              name="offerPrice"
              type="number"
              value={formData.offerPrice}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Count In Stock"
              name="countInStock"
              type="number"
              value={formData.countInStock}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="kg">Kg</MenuItem>
              <MenuItem value="g">Gram</MenuItem>
              <MenuItem value="packet">Packet</MenuItem>
            </TextField>
            <TextField
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              fullWidth
            >
              {TYPE_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Quality"
              name="quality"
              value={formData.quality}
              onChange={handleChange}
              fullWidth
            >
              {QUALITY_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Diet Preferences"
              name="dietPreference"
              value={formData.dietPreference}
              onChange={handleChange}
              fullWidth
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(', ')
              }}
            >
              {DIET_PREFERENCE_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Cooking Purposes"
              name="cookingPurpose"
              value={formData.cookingPurpose}
              onChange={handleChange}
              fullWidth
              SelectProps={{
                multiple: true,
                renderValue: (selected) => selected.join(', ')
              }}
            >
              {COOKING_PURPOSE_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Discounts"
              name="discounts"
              value={formData.discounts}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              select
              label="Stock Availability"
              name="stockAvailability"
              value={formData.stockAvailability}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="In-stock">In-stock</MenuItem>
              <MenuItem value="Pre-order">Pre-order</MenuItem>
            </TextField>

            {/* ✅ IMAGE UPLOAD SECTION */}
            {!editingProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Product Images (3-5 required, >1.5MB each for HD quality) *
                </Typography>
                <input
                  accept="image/*"
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ py: 2, border: '2px dashed #ccc' }}
                  >
                    Upload Images ({selectedImages.length}/5 selected)
                  </Button>
                </label>
                {imageError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {imageError}
                  </Typography>
                )}
                {selectedImages.length > 0 && (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    ✓ {selectedImages.length} high-quality images selected
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editingProduct ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerProducts;
