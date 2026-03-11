// Delivery Charge Calculator for Rice Mill App
// Base: ₹50, Distance: ₹5/km, Weight: ₹10/kg over 10kg

const axios = require('axios');

// ─── In-Memory Distance Cache ───
// Caches Google Maps API responses to avoid redundant calls
// Key: "sellerPincode:customerPincode", Value: { distance, timestamp }
const distanceCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500;

/**
 * Evict oldest entries when cache exceeds max size
 */
const evictCache = () => {
    if (distanceCache.size <= MAX_CACHE_SIZE) return;
    // Delete the oldest 20% of entries
    const entriesToDelete = Math.floor(MAX_CACHE_SIZE * 0.2);
    const iterator = distanceCache.keys();
    for (let i = 0; i < entriesToDelete; i++) {
        const key = iterator.next().value;
        if (key) distanceCache.delete(key);
    }
};

/**
 * Calculate delivery charge based on distance, weight, and order total
 * @param {Number} distance - Distance in kilometers
 * @param {Number} weight - Total weight in kilograms
 * @param {Number} orderTotal - Total order amount in rupees
 * @returns {Object} - { charge, breakdown, freeDelivery }
 */
const calculateDeliveryCharge = (distance = 0, weight = 0, orderTotal = 0, settings = {}) => {
    // 1. Check for free delivery threshold from settings
    const freeThreshold = settings.freeDeliveryThreshold || 1000;
    if (orderTotal >= freeThreshold) {
        return {
            charge: 0,
            breakdown: { base: 0, distance: 0, weight: 0, total: 0, dpShare: 0 },
            freeDelivery: true,
            reason: `Free delivery for orders ≥ ₹${freeThreshold}`
        };
    }

    // 2. Use slab-based logic if available in settings
    if (settings.deliverySlabs && settings.deliverySlabs.length > 0) {
        let slabFee = 0;
        const sortedSlabs = [...settings.deliverySlabs].sort((a, b) => a.minKm - b.minKm);

        // Find matching slab
        const matchingSlab = sortedSlabs.find(slab => distance >= slab.minKm && distance <= slab.maxKm);

        if (matchingSlab) {
            slabFee = matchingSlab.fee;
        } else if (distance > sortedSlabs[sortedSlabs.length - 1].maxKm) {
            // Handle distance beyond max slab
            const lastSlab = sortedSlabs[sortedSlabs.length - 1];
            const extraKm = distance - lastSlab.maxKm;
            slabFee = lastSlab.fee + (extraKm * (settings.extraKmFee || 10));
        } else {
            slabFee = settings.deliveryFee || 40;
        }

        // Weight surcharge logic (₹10 per kg over 10kg)
        const weightSurcharge = weight > 10 ? Math.round((weight - 10) * 10) : 0;
        const totalCharge = slabFee + weightSurcharge;

        // Delivery Partner Share (Logic: 70% of delivery fee goes to DP)
        const deliveryPartnerShare = Math.round(totalCharge * 0.7);

        return {
            charge: totalCharge,
            breakdown: {
                base: slabFee,
                distance: 0,
                weight: weightSurcharge,
                total: totalCharge,
                dpShare: deliveryPartnerShare
            },
            freeDelivery: false,
            reason: null
        };
    }

    // 3. Fallback to legacy distance-based logic
    const baseCharge = settings.deliveryFee || 50;
    const distanceRate = 5; // ₹5 per km
    const weightRate = 10; // ₹10 per kg

    const distanceCharge = Math.round(distance * distanceRate);
    const weightSurcharge = weight > 10 ? Math.round((weight - 10) * weightRate) : 0;
    const totalCharge = baseCharge + distanceCharge + weightSurcharge;

    return {
        charge: totalCharge,
        breakdown: {
            base: baseCharge,
            distance: distanceCharge,
            weight: weightSurcharge,
            total: totalCharge,
            dpShare: Math.round(totalCharge * 0.7)
        },
        freeDelivery: false,
        reason: null
    };
};

/**
 * Fallback distance estimation from pincodes (used when Google Maps API is unavailable)
 * @param {String} sellerPincode
 * @param {String} customerPincode
 * @returns {Number} - Estimated distance in kilometers
 */
const fallbackPincodeDistance = (sellerPincode, customerPincode) => {
    if (!sellerPincode || !customerPincode) return 10;

    const seller = parseInt(sellerPincode);
    const customer = parseInt(customerPincode);

    if (isNaN(seller) || isNaN(customer)) return 10;

    // Same pincode = local delivery
    if (seller === customer) return 3;

    // Same district (first 4 digits match)
    const sellerDistrict = Math.floor(seller / 100);
    const customerDistrict = Math.floor(customer / 100);
    if (sellerDistrict === customerDistrict) return 8;

    // Same region (first 3 digits match)
    const sellerRegion = Math.floor(seller / 1000);
    const customerRegion = Math.floor(customer / 1000);
    if (sellerRegion === customerRegion) return 25;

    // Different region
    const diff = Math.abs(seller - customer);
    return Math.min(Math.round(diff * 0.05), 100); // Cap at 100km
};

/**
 * Calculate distance between two Indian pincodes using Google Maps Distance Matrix API.
 * Uses in-memory cache (24h TTL) to minimize API calls.
 * Falls back to estimation if API key is missing or API call fails.
 *
 * @param {String} sellerPincode - Seller's pincode
 * @param {String} customerPincode - Customer's pincode
 * @returns {Promise<Number>} - Distance in kilometers
 */
const calculatePincodeDistance = async (sellerPincode, customerPincode) => {
    // Normalize inputs
    const sp = (sellerPincode || '').toString().trim();
    const cp = (customerPincode || '').toString().trim();

    if (!sp || !cp) return 10;
    if (sp === cp) return 3; // Same pincode, short local delivery

    // 1. Check cache first
    const cacheKey = `${sp}:${cp}`;
    const reverseCacheKey = `${cp}:${sp}`; // Distance is symmetric
    const cached = distanceCache.get(cacheKey) || distanceCache.get(reverseCacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`📍 Distance cache hit: ${sp} → ${cp} = ${cached.distance}km`);
        return cached.distance;
    }

    // 2. Try Google Maps Distance Matrix API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.log('📍 GOOGLE_MAPS_API_KEY not configured, using fallback distance estimation');
        return fallbackPincodeDistance(sp, cp);
    }

    try {
        // Google Maps Distance Matrix API expects origins/destinations
        // For Indian pincodes, append ", India" for better geocoding accuracy
        const origin = `${sp}, India`;
        const destination = `${cp}, India`;

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: origin,
                destinations: destination,
                units: 'metric',
                key: apiKey
            },
            timeout: 5000 // 5 second timeout
        });

        const data = response.data;

        if (
            data.status === 'OK' &&
            data.rows?.[0]?.elements?.[0]?.status === 'OK'
        ) {
            // Distance is returned in meters, convert to km
            const distanceMeters = data.rows[0].elements[0].distance.value;
            const distanceKm = Math.round(distanceMeters / 1000);

            // Cache the result (both directions)
            const cacheEntry = { distance: distanceKm, timestamp: Date.now() };
            distanceCache.set(cacheKey, cacheEntry);
            distanceCache.set(reverseCacheKey, cacheEntry);
            evictCache();

            console.log(`📍 Google Maps: ${sp} → ${cp} = ${distanceKm}km (${data.rows[0].elements[0].distance.text})`);
            return distanceKm;
        }

        // API returned but with an error status for the element
        const elementStatus = data.rows?.[0]?.elements?.[0]?.status;
        console.warn(`📍 Google Maps API element status: ${elementStatus} for ${sp} → ${cp}. Using fallback.`);
        return fallbackPincodeDistance(sp, cp);

    } catch (error) {
        // Network error, timeout, rate limit, etc.
        console.error(`📍 Google Maps API error for ${sp} → ${cp}:`, error.message);
        return fallbackPincodeDistance(sp, cp);
    }
};

/**
 * Calculate total weight of order items
 * @param {Array} orderItems - Array of order items with product details
 * @returns {Number} - Total weight in kilograms
 */
const calculateOrderWeight = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems)) return 0;

    return orderItems.reduce((total, item) => {
        // Assume each rice product has weight field, default 5kg per item
        const itemWeight = item.product?.weight || 5;
        const quantity = item.qty || 1;
        return total + (itemWeight * quantity);
    }, 0);
};

module.exports = {
    calculateDeliveryCharge,
    calculatePincodeDistance,
    calculateOrderWeight,
    fallbackPincodeDistance  // Exported for testing
};
