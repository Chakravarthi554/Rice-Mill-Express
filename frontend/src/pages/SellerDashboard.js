import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container, Typography, Tabs, Tab, Box, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    useTheme, Divider, Alert, CircularProgress, TextField, IconButton, Pagination, Chip,
    AppBar, Toolbar, Card, CardContent
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Chat as ChatIcon,
    Download as DownloadIcon,
    Logout as LogoutIcon,
    Support as SupportIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { listSellerOrders, updateOrderStatus } from '../redux/actions/orderActions';
import { listDeliveryPartners, assignDeliveryPartner } from '../redux/actions/deliveryActions';
import { listMyRecipes, submitRecipe, deleteRecipe } from '../redux/actions/recipeActions';
import { listSellerProducts } from '../redux/actions/productActions';
import { OrderTrackingSocket } from '../utils/socket';
import Loader from '../components/common/Loader';
import SellerProfile from '../components/seller/SellerProfile';
import SellerProducts from '../components/seller/SellerProducts';
import SellerPayments from '../components/seller/SellerPayments';
import SellerDelivery from '../components/seller/SellerDelivery';
import AnalyticsDashboard from '../components/seller/AnalyticsDashboard';
import Forum from '../components/common/Forum';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/common/ChatWindow';
import Message from '../components/common/Message';
import { RECIPE_SUBMIT_RESET } from '../redux/constants/RecipeConstants';

const generatePDF = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Invoice for Order #${order._id?.slice(-6) || 'N/A'}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    doc.text(`Customer: ${order.user?.name || 'N/A'}`, 14, 32);
    doc.text(`Email: ${order.user?.email || 'N/A'}`, 14, 38);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 14, 44);

    doc.text('Shipping Address:', 14, 54);
    const addr = order.shippingAddress;
    doc.text(`${addr?.street || ''}, ${addr?.city || ''}`, 14, 60);
    doc.text(`${addr?.state || ''} - ${addr?.pinCode || ''}`, 14, 66);
    doc.text(`Phone: ${addr?.phone || order.user?.phone || 'N/A'}`, 14, 72);

    const tableColumn = ["#", "Product", "Quantity", "Price", "Total"];
    const tableRows = [];
    order.orderItems?.forEach((item, index) => {
        const itemData = [
            index + 1,
            item.name,
            item.qty,
            `Rs. ${item.price?.toFixed(2) || '0.00'}`,
            `Rs. ${((item.qty || 0) * (item.price || 0)).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    // FIXED: Use autoTable(doc, options) syntax
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] },
        styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text(`Items Price: Rs. ${order.itemsPrice?.toFixed(2) || '0.00'}`, 145, finalY + 10, { align: 'right' });
    doc.text(`Shipping Price: Rs. ${order.shippingPrice?.toFixed(2) || '0.00'}`, 145, finalY + 16, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Price: Rs. ${order.totalPrice?.toFixed(2) || '0.00'}`, 145, finalY + 24, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 14, finalY + 30);
    doc.text(`Payment Status: ${order.isPaid ? `Paid on ${order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'N/A'}` : 'Not Paid'}`, 14, finalY + 36);

    doc.save(`invoice_${order._id?.slice(-6) || 'unknown'}.pdf`);
};


// 🔥 NEW: Logout Component for Seller Dashboard
const SellerLogoutButton = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    return (
        <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{ ml: 'auto' }}
            title="Logout"
        >
            <LogoutIcon />
        </IconButton>
    );
};

// --- Recipe Form Component ---
const RecipeForm = ({ open, onClose, onSubmit, sellerProducts = [] }) => {
    const [title, setTitle] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [steps, setSteps] = useState('');
    const [riceType, setRiceType] = useState('');
    const [linkedProducts, setLinkedProducts] = useState([]);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        const parsedIngredients = ingredients.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const parsedSteps = steps.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        formData.append('ingredients', JSON.stringify(parsedIngredients));
        formData.append('steps', JSON.stringify(parsedSteps));
        formData.append('riceType', riceType);
        formData.append('linkedProducts', JSON.stringify(linkedProducts));
        if (image) formData.append('image', image);
        onSubmit(formData);
    };

    useEffect(() => {
        if (!open) {
            setTitle('');
            setIngredients('');
            setSteps('');
            setRiceType('');
            setLinkedProducts([]);
            setImage(null);
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
            }
        }
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        }
    }, [open, imagePreview]);

    const riceTypes = ['Basmati', 'Jasmine', 'Brown Rice', 'Arborio', 'Sushi Rice', 'Wild Rice', 'Other'];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Submit New Recipe</DialogTitle>
            <DialogContent>
                <TextField
                    margin="dense"
                    label="Recipe Title"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <TextField
                    margin="dense"
                    label="Ingredients (one per line or comma-separated)"
                    fullWidth
                    multiline
                    rows={4}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    required
                />
                <TextField
                    margin="dense"
                    label="Steps (one per line or comma-separated)"
                    fullWidth
                    multiline
                    rows={6}
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    required
                />
                <FormControl fullWidth margin="dense" required>
                    <InputLabel>Rice Type</InputLabel>
                    <Select
                        value={riceType}
                        label="Rice Type"
                        onChange={(e) => setRiceType(e.target.value)}
                    >
                        {riceTypes.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Link Your Products (Optional)</InputLabel>
                    <Select
                        multiple
                        value={linkedProducts}
                        label="Link Your Products (Optional)"
                        onChange={(e) => setLinkedProducts(e.target.value)}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((id) => {
                                    const product = sellerProducts.find(p => p._id === id);
                                    return (
                                        <Chip
                                            key={id}
                                            label={product?.name || `ID:...${id.slice(-6)}`}
                                            size="small"
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    >
                        {sellerProducts.length === 0 && (
                            <MenuItem disabled>No products available to link</MenuItem>
                        )}
                        {sellerProducts.map((product) => (
                            <MenuItem key={product._id} value={product._id}>
                                {product.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="contained" component="label" sx={{ mt: 2 }}>
                    Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                    <Box
                        component="img"
                        src={imagePreview}
                        alt="Preview"
                        sx={{
                            maxHeight: 150,
                            display: 'block',
                            mt: 1,
                            borderRadius: 1
                        }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">
                    Submit Recipe
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// --- Seller Recipes Panel Component ---
const SellerRecipesPanel = () => {
    const dispatch = useDispatch();
    const [recipeFormOpen, setRecipeFormOpen] = useState(false);

    const {
        loading,
        error,
        recipes = [],
        page = 1,
        pages = 1
    } = useSelector(state => state.recipeListMy || {
        loading: false,
        error: null,
        recipes: [],
        page: 1,
        pages: 1
    });

    const recipeSubmit = useSelector(state => state.recipeSubmit || {});
    const { loading: submitting, error: submitError, success: submitSuccess } = recipeSubmit;

    const recipeDelete = useSelector(state => state.recipeDelete || {});
    const { loading: deleting, error: deleteError, success: deleteSuccess } = recipeDelete;

    const productSellerList = useSelector(state => state.productSellerList || {});
    const { products: sellerProducts = [], loading: loadingProducts } = productSellerList;

    const fetchMyRecipes = useCallback((pageNum = 1) => {
        dispatch(listMyRecipes({ pageNumber: pageNum }));
    }, [dispatch]);

    useEffect(() => {
        fetchMyRecipes(1);
        dispatch(listSellerProducts());
    }, [dispatch, fetchMyRecipes]);

    useEffect(() => {
        let shouldRefresh = false;
        if (submitSuccess) {
            dispatch({ type: RECIPE_SUBMIT_RESET });
            shouldRefresh = true;
        }
        if (deleteSuccess) {
            shouldRefresh = true;
        }

        if (shouldRefresh) {
            fetchMyRecipes(page);
            setRecipeFormOpen(false);
        }
    }, [submitSuccess, deleteSuccess, fetchMyRecipes, dispatch, page]);

    const handleOpenRecipeForm = () => setRecipeFormOpen(true);
    const handleCloseRecipeForm = () => setRecipeFormOpen(false);

    const handleSubmitRecipe = (formData) => {
        dispatch(submitRecipe(formData));
    };

    const handleDeleteRecipe = (id) => {
        if (window.confirm('Are you sure you want to delete this recipe?')) {
            dispatch(deleteRecipe(id));
        }
    };

    const handlePageChange = (event, value) => {
        fetchMyRecipes(value);
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="h5">My Recipes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenRecipeForm}
                    disabled={loadingProducts || submitting}
                >
                    {loadingProducts ? 'Loading Products...' : (submitting ? 'Submitting...' : 'Submit New Recipe')}
                </Button>
            </Box>

            {submitError && <Message severity="error">Submit Error: {submitError}</Message>}
            {deleteError && <Message severity="error">Delete Error: {deleteError}</Message>}
            {submitSuccess && (
                <Message severity="success">
                    Recipe submitted successfully! Awaiting approval.
                </Message>
            )}
            {deleteSuccess && (
                <Message severity="success">Recipe deleted successfully!</Message>
            )}

            {loading && recipes.length === 0 ? (
                <Loader />
            ) : error ? (
                <Message severity="error">{error}</Message>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: grey[100] }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Rice Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Linked Products</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recipes.map((recipe) => (
                                    <TableRow key={recipe._id} hover>
                                        <TableCell>{recipe.title}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={recipe.status}
                                                size="small"
                                                color={
                                                    recipe.status === 'approved' ? 'success' :
                                                        recipe.status === 'rejected' ? 'error' :
                                                            'warning'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{recipe.riceType}</TableCell>
                                        <TableCell>
                                            {recipe.linkedProducts?.length > 0 ?
                                                recipe.linkedProducts.map(p => p.name).join(', ') :
                                                'None'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {new Date(recipe.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteRecipe(recipe._id)}
                                                disabled={deleting}
                                            >
                                                <DeleteIcon color={deleting ? 'disabled' : 'error'} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recipes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No recipes submitted yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {pages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Pagination
                                count={pages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                disabled={loading || submitting || deleting}
                            />
                        </Box>
                    )}
                </>
            )}

            <RecipeForm
                open={recipeFormOpen}
                onClose={handleCloseRecipeForm}
                onSubmit={handleSubmitRecipe}
                sellerProducts={sellerProducts}
            />
        </Box>
    );
};

// --- Main SellerDashboard Component ---
const SellerDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [partnerId, setPartnerId] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [chatWithAdminOpen, setChatWithAdminOpen] = useState(false);
    const theme = useTheme();
    const dispatch = useDispatch();
    const { user } = useAuth();

    // FIX: Handle orders data structure properly
    const orderListSeller = useSelector((state) => state.orderListSeller || {});
    const {
        orders: rawOrders = [],
        loading: ordersLoading = false,
        error: ordersError = null
    } = orderListSeller;

    // FIX: Ensure orders is always an array
    const orders = useMemo(() => {
        if (Array.isArray(rawOrders)) return rawOrders;
        if (rawOrders && Array.isArray(rawOrders.orders)) return rawOrders.orders;
        if (rawOrders && rawOrders.orders) return [rawOrders.orders];
        return [];
    }, [rawOrders]);

    const {
        partners = [],
        loading: partnersLoading = false,
        error: partnersError = null
    } = useSelector((state) => state.deliveryPartnerList || {});

    const assignPartnerState = useSelector((state) => state.deliveryPartnerAction || {});
    const updateStatusState = useSelector((state) => state.orderUpdate || {});

    useEffect(() => {
        dispatch(listSellerOrders());
        dispatch(listDeliveryPartners());
    }, [dispatch]);

    // Socket setup
    useEffect(() => {
        let orderSocket = null;

        const handleSocketMessage = (data) => {
            console.log("Seller Dashboard Socket Received:", data);
            if (data.type === 'ORDER_UPDATE' || data.type === 'NEW_ORDER') {
                dispatch(listSellerOrders());
                if (orderSocket && data.data?.orderId) {
                    orderSocket.joinOrderRoom(data.data.orderId);
                }
            }
            if (data.type === 'RECIPE_STATUS') {
                if (tabValue === 5) dispatch(listMyRecipes());
            }
        };

        if (user?._id) {
            orderSocket = new OrderTrackingSocket(
                user._id,
                user.role,
                localStorage.getItem('token'),
                handleSocketMessage
            );

            orders.forEach(order => {
                if (order && order._id) {
                    orderSocket.joinOrderRoom(order._id);
                }
            });
        }

        return () => {
            if (orderSocket) {
                orderSocket.cleanup();
            }
        };
    }, [user?._id, user?.role, dispatch, orders, tabValue]);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const handleOpenDialog = (order) => {
        setSelectedOrder(order);
        setPartnerId('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedOrder(null);
        setPartnerId('');
    };

    const handleAssignPartner = () => {
        if (selectedOrder && partnerId) {
            // Reverted to correct payload key 'deliveryPartner' matching backend
            dispatch(assignDeliveryPartner(selectedOrder._id, { deliveryPartner: partnerId, trackingNumber: '' }));
            handleCloseDialog();
        } else {
            alert('Please select a delivery partner.');
        }
    };

    // Reset success flags after action completes to prevent stale state
    useEffect(() => {
        if (assignPartnerState.success) {
            console.log('✅ Assignment completed, resetting flag');
            const timer = setTimeout(() => {
                dispatch({ type: 'DELIVERY_ASSIGN_RESET' });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [assignPartnerState.success, dispatch]);

    useEffect(() => {
        if (updateStatusState.success) {
            console.log('✅ Status update completed, resetting flag');
            const timer = setTimeout(() => {
                dispatch({ type: 'ORDER_UPDATE_RESET' });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [updateStatusState.success, dispatch]);

    const handleUpdateStatus = (orderId, status) => {
        if (status === 'shipped') {
            setOpenDialog(true); // Assuming setOpenDialog is used for assigning partner
            setSelectedOrder(orders.find(o => o._id === orderId)); // Set selected order for the dialog
        } else {
            // Pass status directly, not as an object
            dispatch(updateOrderStatus(orderId, status));
        }
    };

    const handleOpenChat = (customerId) => {
        setSelectedCustomer(customerId);
        setChatOpen(true);
    };

    const generatePDF = (order) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Invoice for Order #${order._id?.slice(-6) || 'N/A'}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        doc.text(`Customer: ${order.user?.name || 'N/A'}`, 14, 32);
        doc.text(`Email: ${order.user?.email || 'N/A'}`, 14, 38);
        doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 14, 44);

        doc.text('Shipping Address:', 14, 54);
        const addr = order.shippingAddress;
        doc.text(`${addr?.street || ''}, ${addr?.city || ''}`, 14, 60);
        doc.text(`${addr?.state || ''} - ${addr?.pinCode || ''}`, 14, 66);
        doc.text(`Phone: ${addr?.phone || order.user?.phone || 'N/A'}`, 14, 72);

        const tableColumn = ["#", "Product", "Quantity", "Price", "Total"];
        const tableRows = [];
        order.orderItems?.forEach((item, index) => {
            const itemData = [
                index + 1,
                item.name,
                item.qty,
                `₹${item.price?.toFixed(2) || '0.00'}`,
                `₹${((item.qty || 0) * (item.price || 0)).toFixed(2)}`
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] },
            styles: { fontSize: 10 }
        });

        const finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(12);
        doc.text(`Items Price: ₹${order.itemsPrice?.toFixed(2) || '0.00'}`, 145, finalY + 10, { align: 'right' });
        doc.text(`Shipping Price: ₹${order.shippingPrice?.toFixed(2) || '0.00'}`, 145, finalY + 16, { align: 'right' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Price: ₹${order.totalPrice?.toFixed(2) || '0.00'}`, 145, finalY + 24, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 14, finalY + 30);
        doc.text(`Payment Status: ${order.isPaid ? `Paid on ${order.paidAt ? new Date(order.paidAt).toLocaleDateString() : 'N/A'}` : 'Not Paid'}`, 14, finalY + 36);

        doc.save(`invoice_${order._id?.slice(-6) || 'unknown'}.pdf`);
    };

    const getEstimatedDeliveryDate = (createdAt) => {
        if (!createdAt) return 'N/A';
        const date = new Date(createdAt);
        date.setDate(date.getDate() + 5);
        return date.toLocaleDateString();
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.street}, ${address.city}, ${address.state} - ${address.pinCode}`;
    };

    return (
        <Box sx={{ backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            {/* 🔥 NEW: Header with Logout and Admin Chat */}
            <AppBar position="static" sx={{ mb: 3 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Seller Dashboard
                    </Typography>

                    {/* Message Admin Button */}
                    <Button
                        color="inherit"
                        onClick={() => setChatWithAdminOpen(true)}
                        startIcon={<SupportIcon />}
                        sx={{ mr: 2 }}
                    >
                        Message Admin
                    </Button>

                    <SellerLogoutButton />
                </Toolbar>
            </AppBar>

            {/* Support Card */}
            <Container maxWidth="xl" sx={{ mb: 2 }}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white', mb: 3 }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    💬 Need Help?
                                </Typography>
                                <Typography variant="body2">
                                    Message our admin team directly for any questions about orders, payments, or platform issues.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                                onClick={() => setChatWithAdminOpen(true)}
                                startIcon={<ChatIcon />}
                            >
                                Message Admin
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>

            <Container maxWidth="xl" sx={{ mb: 4 }}>
                <Paper elevation={4} sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e8f5e9 30%, #f1f8e9 100%)',
                }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="Seller dashboard tabs"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                textTransform: 'none',
                                '&.Mui-selected': { color: theme.palette.primary.main },
                            },
                        }}
                    >
                        <Tab label="Profile" id="seller-tab-0" aria-controls="seller-panel-0" />
                        <Tab label="Orders" id="seller-tab-1" aria-controls="seller-panel-1" />
                        <Tab label="Products" id="seller-tab-2" aria-controls="seller-panel-2" />
                        <Tab label="Payments" id="seller-tab-3" aria-controls="seller-panel-3" />
                        <Tab label="Delivery" id="seller-tab-4" aria-controls="seller-panel-4" />
                        <Tab label="Recipes" id="seller-tab-5" aria-controls="seller-panel-5" />
                        <Tab label="Community Forum" id="seller-tab-6" aria-controls="seller-panel-6" />
                        <Tab label="Analytics" id="seller-tab-7" aria-controls="seller-panel-7" />
                    </Tabs>
                </Paper>

                <Box role="tabpanel" hidden={tabValue !== 0} id="seller-panel-0" aria-labelledby="seller-tab-0">
                    <SellerProfile />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 1} id="seller-panel-1" aria-labelledby="seller-tab-1">
                    {ordersLoading && orders.length === 0 ? (
                        <Loader />
                    ) : ordersError ? (
                        <Message severity="error">{ordersError}</Message>
                    ) : (
                        <TableContainer component={Paper} elevation={3} sx={{ mt: 2, borderRadius: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: grey[100] }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Payment</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Delivery Partner</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Est. Delivery</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>...{order._id?.slice(-6) || 'N/A'}</TableCell>
                                            <TableCell>{order.user?.name || 'N/A'}</TableCell>
                                            <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>₹{order.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={order.status || 'Pending'}
                                                    onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                    size="small"
                                                    disabled={updateStatusState.loading && updateStatusState.orderId === order._id}
                                                    sx={{ minWidth: 120 }}
                                                >
                                                    <MenuItem value="Pending">Pending</MenuItem>
                                                    <MenuItem value="Processing">Processing</MenuItem>
                                                    <MenuItem value="Shipped">Shipped</MenuItem>
                                                    <MenuItem value="Out For Delivery">Out For Delivery</MenuItem>
                                                    <MenuItem value="Delivered">Delivered</MenuItem>
                                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={order.isPaid ? 'Paid' : 'Pending'}
                                                    color={order.isPaid ? 'success' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{order.deliveryPartner?.name || 'Not Assigned'}</TableCell>
                                            <TableCell>{order.createdAt ? getEstimatedDeliveryDate(order.createdAt) : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleOpenDialog(order)}
                                                        disabled={assignPartnerState.loading}
                                                    >
                                                        Assign
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => generatePDF(order)}
                                                        title="Download Invoice"
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {orders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                No orders found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 2} id="seller-panel-2" aria-labelledby="seller-tab-2">
                    <SellerProducts />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 3} id="seller-panel-3" aria-labelledby="seller-tab-3">
                    <SellerPayments />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 4} id="seller-panel-4" aria-labelledby="seller-tab-4">
                    <SellerDelivery />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 5} id="seller-panel-5" aria-labelledby="seller-tab-5">
                    <SellerRecipesPanel />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 6} id="seller-panel-6" aria-labelledby="seller-tab-6">
                    <Forum />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 7} id="seller-panel-7" aria-labelledby="seller-tab-7">
                    <AnalyticsDashboard />
                </Box>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Assign Delivery Partner for Order #{selectedOrder?._id?.slice(-6) || 'N/A'}
                    </DialogTitle>
                    <DialogContent>
                        {partnersLoading ? (
                            <Loader />
                        ) : partnersError ? (
                            <Alert severity="error">{partnersError}</Alert>
                        ) : partners.length === 0 ? (
                            <Typography>No delivery partners available.</Typography>
                        ) : (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="partner-select-label">Delivery Partner</InputLabel>
                                <Select
                                    labelId="partner-select-label"
                                    value={partnerId}
                                    label="Delivery Partner"
                                    onChange={(e) => setPartnerId(e.target.value)}
                                >
                                    {partners.map(p => (
                                        <MenuItem key={p._id} value={p._id}>
                                            {p.name} ({p.vehicleType})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {assignPartnerState.error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {assignPartnerState.error}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleAssignPartner}
                            variant="contained"
                            disabled={partnersLoading || partners.length === 0 || assignPartnerState.loading || !partnerId}
                        >
                            {assignPartnerState.loading ? <CircularProgress size={24} /> : 'Assign'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Chat with Customer */}
                {chatOpen && user && selectedCustomer && (
                    <ChatWindow
                        receiverId={selectedCustomer}
                        onClose={() => {
                            setChatOpen(false);
                            setSelectedCustomer(null);
                        }}
                    />
                )}

                {/* Chat with Admin */}
                {chatWithAdminOpen && (
                    <ChatWindow
                        receiverId={process.env.REACT_APP_ADMIN_USER_ID || 'admin'}
                        receiverName="Admin"
                        onClose={() => setChatWithAdminOpen(false)}
                    />
                )}
            </Container>
        </Box>
    );
};

export default SellerDashboard;