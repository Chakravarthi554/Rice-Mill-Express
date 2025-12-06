import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { listProducts } from '../../redux/actions/productActions';
import Loader from '../Loader';
import Message from '../Message';
const ProductSelectionModal = ({ show, handleClose, selectedProducts, setSelectedProducts }) => {
  const dispatch = useDispatch();
const productList = useSelector((state) => state.productList);
  const { loading, error, products } = productList;

  const [quantities, setQuantities] = useState({});
useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);
const handleQuantityChange = (productId, value) => {
    setQuantities({
      ...quantities,
      [productId]: Number(value)
    });
};
const handleProductSelect = (product) => {
    const quantity = quantities[product._id] || 1;
const existingIndex = selectedProducts.findIndex(
      (item) => item.product === product._id
    );
if (existingIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity = quantity;
      setSelectedProducts(updatedProducts);
} else {
      setSelectedProducts([
        ...selectedProducts,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity
        }
      ]);
}
};

  const removeProduct = (productId) => {
    setSelectedProducts(
      selectedProducts.filter((item) => item.product !== productId)
    );
};

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select Products</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : (
         
<>
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                
<th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  
<tr>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedProducts.some(
         
                  (item) => item.product === product._id
                        )}
                        onChange={() => handleProductSelect(product)}
                      />
       
              </td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>
                      <Form.Control
     
                    type="number"
                        min="1"
                        value={quantities[product._id] ||
1}
                        onChange={(e) =>
                          handleQuantityChange(product._id, e.target.value)
                        }
                        
style={{ width: '70px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
       
      </Table>

            <h5>Selected Products</h5>
            {selectedProducts.length === 0 ?
(
              <Message>No products selected</Message>
            ) : (
              <Table striped bordered hover responsive className="table-sm">
                <thead>
                  <tr>
                 
<th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                 
</tr>
                </thead>
                <tbody>
                  {selectedProducts.map((item) => (
                    <tr key={item.product}>
                      <td>{item.name}</td>
    
                      <td>${item.price}</td>
                      <td>{item.quantity}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      <td>
              
                      <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeProduct(item.product)}
          
                      >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
            
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
  
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleClose}>
          Save Selection
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductSelectionModal;