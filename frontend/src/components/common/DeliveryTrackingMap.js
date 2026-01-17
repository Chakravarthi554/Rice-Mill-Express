import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { LocalShipping as TruckIcon, PersonPinCircle as HouseIcon } from '@mui/icons-material';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Delivery Icon
const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/709/709790.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

// Custom House Icon
const houseIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center);
    }, [center, map]);
    return null;
};

const DeliveryTrackingMap = ({ order, socket }) => {
    const [partnerLocation, setPartnerLocation] = useState(order.deliveryPartner?.location || null);
    const [customerLocation, setCustomerLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Default center (e.g., center of India or Hyderabad)
    const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);

    useEffect(() => {
        // 1. Geocode customer address (Mocked or simple implementation)
        // In a real app, we'd use a geocoding service.
        // Here we'll mock it if order.shippingAddress has coordinates or just random near partner
        if (order.shippingAddress) {
            // Mocked customer location near the partner if no location in order
            // In real system, Order would have 'location' [lat, lng]
            const lat = order.location?.coordinates?.[1] || 17.3850 + (Math.random() - 0.5) * 0.1;
            const lng = order.location?.coordinates?.[0] || 78.4867 + (Math.random() - 0.5) * 0.1;
            setCustomerLocation([lat, lng]);
            setMapCenter([lat, lng]);
            setLoading(false);
        }

        // 2. Listen for location updates
        if (socket) {
            const handleLocationUpdate = (data) => {
                console.log('📍 Received location update:', data);
                if (data.orderId === order._id && data.location) {
                    setPartnerLocation(data.location);
                }
            };

            socket.on('PARTNER_LOCATION_UPDATE', handleLocationUpdate);
            return () => socket.off('PARTNER_LOCATION_UPDATE', handleLocationUpdate);
        }
    }, [order, socket]);

    if (loading && !customerLocation) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Initializing Map...</Typography>
            </Box>
        );
    }

    const pLoc = partnerLocation?.coordinates ? [partnerLocation.coordinates[1], partnerLocation.coordinates[0]] : null;

    return (
        <Paper elevation={2} sx={{ height: 400, width: '100%', overflow: 'hidden', borderRadius: 2, position: 'relative' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {customerLocation && (
                    <Marker position={customerLocation} icon={houseIcon}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}
                {pLoc && (
                    <Marker position={pLoc} icon={deliveryIcon}>
                        <Popup>Delivery Partner is here</Popup>
                    </Marker>
                )}
                <ChangeView center={pLoc || customerLocation} />
            </MapContainer>

            <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1000,
                bgcolor: 'white',
                p: 1,
                borderRadius: 1,
                boxShadow: 2
            }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    <TruckIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                    Real-time Tracking Enabled
                </Typography>
            </Box>
        </Paper>
    );
};

export default DeliveryTrackingMap;
