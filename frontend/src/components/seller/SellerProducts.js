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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../redux/actions/productActions";

const SellerProducts = () => {
  const dispatch = useDispatch();

  const productList = useSelector((state) => state.productList);
  const { products } = productList;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
    dietPreference: "",
    cookingPurpose: "",
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
      setFormData(product);
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
        dietPreference: "",
        cookingPurpose: "",
        discounts: "",
        stockAvailability: "In-stock",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    if (editingProduct) {
      dispatch(updateProduct(editingProduct._id, formData));
    } else {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      // 🚫 Removed seller field, backend will set req.user._id automatically
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
            />
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
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Quality"
              name="quality"
              value={formData.quality}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Diet Preference"
              name="dietPreference"
              value={formData.dietPreference}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Cooking Purpose"
              name="cookingPurpose"
              value={formData.cookingPurpose}
              onChange={handleChange}
              fullWidth
            />
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
