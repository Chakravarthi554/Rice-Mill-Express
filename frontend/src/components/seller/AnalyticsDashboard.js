import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2'; // Correct import for Grid2
import { listSellerAnalytics } from '../../redux/actions/productActions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { io } from 'socket.io-client';
import { selectSellerAnalytics } from '../../redux/store';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector(selectSellerAnalytics);
  const { userInfo } = useSelector((state) => state.userLogin || {});

  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(listSellerAnalytics(timeframe));
    }
  }, [dispatch, timeframe, userInfo?._id]);

  useEffect(() => {
    const token = userInfo?.token || localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token available for WebSocket connection');
      return;
    }

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket:', socket.id);
      const sellerId = userInfo?._id || localStorage.getItem('userId');
      if (sellerId) {
        socket.emit('joinSellerRoom', sellerId);
        console.log('Joined room:', `seller_${sellerId}`);
      }
    });

    socket.on('REFRESH_ANALYTICS', (data) => {
      console.log('📊 REFRESH_ANALYTICS received:', data);
      const sellerId = userInfo?._id || localStorage.getItem('userId');
      if (data.sellerId === sellerId) {
        dispatch(listSellerAnalytics(timeframe));
      }
    });

    socket.on('connect_error', (err) => {
      console.error('❌ WebSocket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
    });

    return () => {
      socket.off('REFRESH_ANALYTICS');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [dispatch, timeframe, userInfo?._id, userInfo?.token]);

  useEffect(() => {
    console.log('Analytics state:', { analytics, loading, error });
  }, [analytics, loading, error]);

  const kpis = [
    { title: 'Total Sales', value: `₹${analytics?.totalSales || 0}`, color: '#4CAF50' },
    { title: 'Total Orders', value: analytics?.totalOrders || 0, color: '#2196F3' },
    { title: 'Top Product', value: analytics?.popularProducts?.[0]?.name || 'N/A', color: '#FF9800' },
  ];

  const salesData = {
    labels: analytics?.sales?.map((s) => s.date) || [],
    datasets: [
      {
        label: 'Sales (₹)',
        data: analytics?.sales?.map((s) => s.amount) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const popularProductsData = {
    labels: analytics?.popularProducts?.map((p) => p.name) || [],
    datasets: [
      {
        data: analytics?.popularProducts?.map((p) => p.salesCount) || [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8BC34A', '#9C27B0'],
      },
    ],
  };

  const exportCSV = () => {
    let csv = 'Date,Sales (₹)\n';
    analytics?.sales?.forEach((s) => {
      csv += `${s.date},${s.amount}\n`;
    });

    csv += '\nProduct,Sales Count\n';
    analytics?.popularProducts?.forEach((p) => {
      csv += `${p.name},${p.salesCount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Seller Analytics Report', 14, 20);

    doc.setFontSize(12);
    doc.text(`Total Sales: ₹${analytics?.totalSales || 0}`, 14, 30);
    doc.text(`Total Orders: ${analytics?.totalOrders || 0}`, 14, 36);
    doc.text(`Top Product: ${analytics?.popularProducts?.[0]?.name || 'N/A'}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Sales (₹)']],
      body: analytics?.sales?.map((s) => [s.date, s.amount]) || [],
    });

    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80,
      head: [['Product', 'Sales Count']],
      body: analytics?.popularProducts?.map((p) => [p.name, p.salesCount]) || [],
    });

    doc.save(`analytics_${Date.now()}.pdf`);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        Seller Analytics Dashboard
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        {['7d', '30d', '90d'].map((tf) => (
          <Button
            key={tf}
            variant={timeframe === tf ? 'contained' : 'outlined'}
            onClick={() => setTimeframe(tf)}
            sx={{ mx: 1 }}
          >
            Last {tf.replace('d', '')} Days
          </Button>
        ))}
        <Button variant="outlined" color="success" sx={{ mx: 1 }} onClick={exportCSV}>
          Export CSV
        </Button>
        <Button variant="outlined" color="error" sx={{ mx: 1 }} onClick={exportPDF}>
          Export PDF
        </Button>
        <Button variant="outlined" color="primary" sx={{ mx: 1 }} onClick={() => dispatch(listSellerAnalytics(timeframe))}>
          Refresh
        </Button>
      </Box>

      <Grid2 container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, idx) => (
          <Grid2 xs={12} sm={4} key={idx}>
            <Card sx={{ backgroundColor: kpi.color, color: '#fff' }}>
              <CardContent>
                <Typography variant="h6">{kpi.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>

      {loading && (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {!loading && !error && analytics && (
        <Grid2 container spacing={3}>
          <Grid2 xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Data
                </Typography>
                <Bar data={salesData} />
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Popular Products
                </Typography>
                <Pie data={popularProductsData} />
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      )}
      {!loading && !error && !analytics && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No analytics data available for the selected timeframe.
        </Alert>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;
