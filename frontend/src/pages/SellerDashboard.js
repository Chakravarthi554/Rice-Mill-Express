import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container, Typography, Tabs, Tab, Box, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    useTheme, Divider, Alert, CircularProgress, TextField, IconButton, Pagination, Chip,
    AppBar, Toolbar, Card, CardContent, Grid
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Chat as ChatIcon,
    Download as DownloadIcon,
    Logout as LogoutIcon,
    Support as SupportIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { listSellerOrders, updateOrderStatus, downloadInvoice } from '../redux/actions/orderActions';
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
import OrderKanban from '../components/seller/OrderKanban';
import OrderTimeline from '../components/common/OrderTimeline';
import { useAuth } from '../context/AuthContext';
import SellerChatWidget from '../components/seller/SellerChatWidget';
import Message from '../components/common/Message';
import { RECIPE_SUBMIT_RESET } from '../redux/constants/RecipeConstants';
import RecipeEngagementDashboard from '../components/seller/RecipeEngagementDashboard';
import SettingsBanner from '../components/common/SettingsBanner';
import { EmptyState } from '../components/common/PageStates';

// ✅ Backend-driven Invoice handled via Redux actions

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
    const { user } = useAuth();
    const [recipeFormOpen, setRecipeFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'engagement'

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

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={viewMode === 'list' ? 0 : 1} onChange={(e, v) => setViewMode(v === 0 ? 'list' : 'engagement')}>
                    <Tab label="Recipe List" />
                    <Tab label="Engagement Dashboard" />
                </Tabs>
            </Box>

            {viewMode === 'engagement' ? (
                <RecipeEngagementDashboard sellerId={user?._id} recipes={recipes} />
            ) : (
                <>
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
    const [chatWithAdminOpen, setChatWithAdminOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban'); // 'table' or 'kanban'
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
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

    // ✅ FIXED: Delivery partner assignment with proper refresh and error handling
    const handleAssignPartner = async () => {
        if (!selectedOrder || !partnerId) {
            alert('Please select a delivery partner.');
            return;
        }

        try {
            await dispatch(assignDeliveryPartner(selectedOrder._id, { partnerId }));
            // ✅ FIXED: Refresh orders list after successful assignment
            await dispatch(listSellerOrders());
            handleCloseDialog();
            alert('Delivery partner assigned successfully!');
        } catch (error) {
            console.error('Failed to assign delivery partner:', error);
            alert('Failed to assign delivery partner: ' + (error.message || 'Unknown error'));
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setDetailsDialogOpen(true);
    };

    // ✅ FIXED: Backend-driven Invoice Actions
    const handleDownloadInvoice = async (orderId) => {
        setInvoiceLoading(true);
        const result = await dispatch(downloadInvoice(orderId));
        setInvoiceLoading(false);
        if (!result.success) alert(result.error || 'Failed to download invoice');
    };

    const handlePreviewInvoice = async (orderId) => {
        setInvoiceLoading(true);
        try {
            const { data } = await OrderTrackingSocket.apiInstance.get(`/api/orders/${orderId}/invoice`, {
                responseType: 'blob'
            });
            const blob = new Blob([data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Note: We don't revoke here because it might close the new tab's access
        } catch (error) {
            console.error('Preview error:', error);
            alert('Failed to preview invoice');
        } finally {
            setInvoiceLoading(false);
        }
    };

    // ✅ FIXED: Reset success flags and refresh orders after actions
    useEffect(() => {
        if (assignPartnerState.success) {
            console.log('✅ Assignment completed, refreshing orders...');
            dispatch(listSellerOrders()); // ✅ FIXED: Refresh orders list
            const timer = setTimeout(() => {
                dispatch({ type: 'DELIVERY_ASSIGN_RESET' });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [assignPartnerState.success, dispatch]);

    useEffect(() => {
        if (updateStatusState.success) {
            console.log('✅ Status update completed, refreshing orders...');
            dispatch(listSellerOrders()); // ✅ FIXED: Refresh orders list
            const timer = setTimeout(() => {
                dispatch({ type: 'ORDER_UPDATE_RESET' });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [updateStatusState.success, dispatch]);

    // ✅ FIXED: Order status update with refresh and notifications
    const handleUpdateStatus = async (orderId, status) => {
        if (status === 'shipped') {
            setOpenDialog(true);
            setSelectedOrder(orders.find(o => o._id === orderId));
        } else {
            try {
                await dispatch(updateOrderStatus(orderId, status));
                // ✅ FIXED: Refresh orders list after status update
                await dispatch(listSellerOrders());
                alert(`Order status updated to ${status}. Customer will be notified.`);
            } catch (error) {
                console.error('Failed to update order status:', error);
                alert('Failed to update order status: ' + (error.message || 'Unknown error'));
            }
        }
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
            <AppBar position="static" sx={{ mb: 3 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Seller Dashboard
                    </Typography>
                    <SellerLogoutButton />
                </Toolbar>
            </AppBar>


            <Container maxWidth="xl" sx={{ mb: 4 }}>
                <Paper elevation={4} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #e8f5e9 30%, #f1f8e9 100%)' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="Profile" id="seller-tab-0" />
                        <Tab label="Orders" id="seller-tab-1" />
                        <Tab label="Products" id="seller-tab-2" />
                        <Tab label="Payments" id="seller-tab-3" />
                        <Tab label="Delivery" id="seller-tab-4" />
                        <Tab label="Recipes" id="seller-tab-5" />
                        <Tab label="Community Forum" id="seller-tab-6" />
                        <Tab label="Analytics" id="seller-tab-7" />
                    </Tabs>
                </Paper>

                <Box role="tabpanel" hidden={tabValue !== 0} id="seller-panel-0">
                    <SellerProfile />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 1} id="seller-panel-1">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
                        <Button variant={viewMode === 'kanban' ? 'contained' : 'outlined'} onClick={() => setViewMode('kanban')} size="small">Kanban</Button>
                        <Button variant={viewMode === 'table' ? 'contained' : 'outlined'} onClick={() => setViewMode('table')} size="small">Table</Button>
                    </Box>

                    {ordersLoading ? (
                        <Loader />
                    ) : ordersError ? (
                        <Message severity="error">{ordersError}</Message>
                    ) : (
                        viewMode === 'table' ? (
                            orders?.length === 0 ? (
                                <EmptyState
                                    title="No seller orders yet"
                                    description="Orders will appear here once customers start purchasing."
                                    actionLabel="Refresh"
                                    onAction={() => dispatch(listSellerOrders())}
                                />
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
                                        {orders && orders.map((order) => (
                                            <TableRow key={order._id} hover>
                                                <TableCell onClick={() => handleViewDetails(order)} sx={{ cursor: 'pointer', color: 'primary.main' }}>
                                                    #{order._id?.slice(-6).toUpperCase()}
                                                </TableCell>
                                                <TableCell>{order.user?.name || 'N/A'}</TableCell>
                                                <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>₹{order.totalPrice?.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={order.orderStatus}
                                                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                        size="small"
                                                        disabled={updateStatusState.loading && updateStatusState.orderId === order._id}
                                                    >
                                                        <MenuItem value="placed">Pending</MenuItem>
                                                        <MenuItem value="processing">Processing</MenuItem>
                                                        <MenuItem value="packed">Packed</MenuItem>
                                                        <MenuItem value="shipped">Shipped</MenuItem>
                                                        <MenuItem value="delivered">Delivered</MenuItem>
                                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={order.isPaid ? 'Paid' : 'Unpaid'} color={order.isPaid ? 'success' : 'warning'} size="small" />
                                                </TableCell>
                                                <TableCell>{order.deliveryPartner?.name || 'Not Assigned'}</TableCell>
                                                <TableCell>{getEstimatedDeliveryDate(order.createdAt)}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton size="small" onClick={() => handleViewDetails(order)} title="View Details"><VisibilityIcon fontSize="small" /></IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDownloadInvoice(order._id)}
                                                            disabled={invoiceLoading}
                                                            title="Download Invoice"
                                                        >
                                                            {invoiceLoading ? <CircularProgress size={20} /> : <DownloadIcon fontSize="small" />}
                                                        </IconButton>
                                                        {order.orderStatus === 'packed' && !order.deliveryPartner && (
                                                            <Button variant="outlined" size="small" onClick={() => handleOpenDialog(order)}>Assign</Button>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            )
                        ) : (
                            <OrderKanban orders={orders} onUpdateStatus={handleUpdateStatus} onAssignPartner={handleOpenDialog} onViewDetails={handleViewDetails} />
                        )
                    )}
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 2} id="seller-panel-2">
                    <SellerProducts />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 3} id="seller-panel-3">
                    <SellerPayments />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 4} id="seller-panel-4">
                    <SellerDelivery />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 5} id="seller-panel-5">
                    <SellerRecipesPanel />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 6} id="seller-panel-6">
                    <Forum />
                </Box>

                <Box role="tabpanel" hidden={tabValue !== 7} id="seller-panel-7">
                    <AnalyticsDashboard />
                </Box>

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Assign Delivery Partner for Order #{selectedOrder?._id?.slice(-6) || 'N/A'}</DialogTitle>
                    <DialogContent>
                        {partnersLoading ? <Loader /> : partnersError ? <Alert severity="error">{partnersError}</Alert> : partners.length === 0 ? <Typography>No delivery partners available.</Typography> : (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel id="partner-select-label">Delivery Partner</InputLabel>
                                <Select labelId="partner-select-label" value={partnerId} label="Delivery Partner" onChange={(e) => setPartnerId(e.target.value)}>
                                    {partners.map(p => <MenuItem key={p._id} value={p._id}>{p.name} ({p.vehicleType})</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {assignPartnerState.error && <Alert severity="error" sx={{ mt: 2 }}>{assignPartnerState.error}</Alert>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleAssignPartner} variant="contained" disabled={partnersLoading || partners.length === 0 || assignPartnerState.loading || !partnerId}>
                            {assignPartnerState.loading ? <CircularProgress size={24} /> : 'Assign'}
                        </Button>
                    </DialogActions>
                </Dialog>


                <SellerChatWidget />

                <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Order Details #{selectedOrder?._id?.slice(-6).toUpperCase()}</DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        {selectedOrder && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <Typography variant="h6" gutterBottom>Track Status</Typography>
                                    <OrderTimeline history={selectedOrder.statusHistory || []} currentStatus={selectedOrder.orderStatus} />
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" gutterBottom>Order Items</Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {selectedOrder.orderItems?.map((item) => (
                                                    <TableRow key={item._id}><TableCell>{item.name}</TableCell><TableCell align="right">{item.qty}</TableCell><TableCell align="right">₹{item.price?.toFixed(2)}</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: grey[50] }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>Customer Information</Typography>
                                        <Typography variant="body2"><strong>Name:</strong> {selectedOrder.user?.name}</Typography>
                                        <Typography variant="body2"><strong>Email:</strong> {selectedOrder.user?.email}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Shipping Address:</strong></Typography>
                                        <Typography variant="body2" color="text.secondary">{formatAddress(selectedOrder.shippingAddress)}</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>Payment Details</Typography>
                                        <Typography variant="body2"><strong>Method:</strong> {selectedOrder.paymentMethod?.toUpperCase()}</Typography>
                                        <Typography variant="body2"><strong>Status:</strong><Chip label={selectedOrder.isPaid ? 'PAID' : 'PENDING'} size="small" color={selectedOrder.isPaid ? 'success' : 'warning'} sx={{ ml: 1 }} /></Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} gutterBottom>Action Details</Typography>
                                        <Typography variant="body2"><strong>Delivery Partner:</strong> {selectedOrder.deliveryPartner?.name || 'None Assigned'}</Typography>
                                        {selectedOrder.deliveryOtp && <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Verification OTP: {selectedOrder.deliveryOtp}</Typography>}
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                        <Button variant="outlined" onClick={() => handlePreviewInvoice(selectedOrder._id)} disabled={invoiceLoading}>Preview Invoice</Button>
                        <Button variant="contained" onClick={() => handleDownloadInvoice(selectedOrder._id)} disabled={invoiceLoading}>
                            {invoiceLoading ? <CircularProgress size={24} /> : 'Download Invoice'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default SellerDashboard;