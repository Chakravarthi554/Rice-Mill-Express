import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProduct, updateProduct } from "../redux/actions/productActions";

const ProductForm = ({ productToEdit, onSuccess }) => {
  const dispatch = useDispatch();

  const { loading, error, success } = useSelector(
    (state) => state.productCreate
  );

  const [formData, setFormData] = useState({
    name: "",
    variants: [],
    promotions: [],
    festivalPromotions: [],
    stock: "",
    badges: "",
    images: [],
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || "",
        variants: productToEdit.variants || [],
        promotions: productToEdit.promotions || [],
        festivalPromotions: productToEdit.festivalPromotions || [],
        stock: productToEdit.countInStock || "",
        badges: productToEdit.badges || "",
        images: productToEdit.images || [],
      });
    }
  }, [productToEdit]);

  // Reset form on success
  useEffect(() => {
    if (success) {
      setFormData({
        name: "",
        variants: [],
        promotions: [],
        festivalPromotions: [],
        stock: "",
        badges: "",
        images: [],
      });
      if (onSuccess) onSuccess(); // callback to parent
    }
  }, [success, onSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert comma-separated strings to arrays for certain fields
    if (["variants", "promotions", "festivalPromotions"].includes(name)) {
      setFormData({ ...formData, [name]: value.split(",").map((v) => v.trim()) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, images: [...e.target.files] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (productToEdit) {
      dispatch(updateProduct(productToEdit._id, formData));
    } else {
      dispatch(createProduct(formData));
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      <input
        type="text"
        name="name"
        placeholder="Product Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="variants"
        placeholder="Variants (comma-separated)"
        value={formData.variants.join(", ")}
        onChange={handleChange}
      />
      <input
        type="text"
        name="promotions"
        placeholder="Promotions (comma-separated)"
        value={formData.promotions.join(", ")}
        onChange={handleChange}
      />
      <input
        type="text"
        name="festivalPromotions"
        placeholder="Festival Promotions (comma-separated)"
        value={formData.festivalPromotions.join(", ")}
        onChange={handleChange}
      />
      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock}
        onChange={handleChange}
      />
      <input
        type="text"
        name="badges"
        placeholder="Badges"
        value={formData.badges}
        onChange={handleChange}
      />
      <input
        type="file"
        name="images"
        multiple
        onChange={handleImageChange}
      />
      {formData.images.length > 0 && (
        <p>{formData.images.length} image(s) selected</p>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : productToEdit ? "Update Product" : "Add Product"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Product saved successfully!</p>}
    </form>
  );
};

export default ProductForm;
