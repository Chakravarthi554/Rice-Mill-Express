// Delivery Charge Calculator for Rice Mill App
// Base: ₹50, Distance: ₹5/km, Weight: ₹10/kg over 10kg

/**
 * Calculate delivery charge based on distance, weight, and order total
 * @param {Number} distance - Distance in kilometers
 * @param {Number} weight - Total weight in kilograms
 * @param {Number} orderTotal - Total order amount in rupees
 * @returns {Object} - { charge, breakdown, freeDelivery }
 */
const calculateDeliveryCharge = (distance = 0, weight = 0, orderTotal = 0) => {
    const BASE_CHARGE = 50; // ₹50 base charge
    const DISTANCE_RATE = 5; // ₹5 per km
    const WEIGHT_THRESHOLD = 10; // Free up to 10kg
    const WEIGHT_RATE = 10; // ₹10 per kg over threshold
    const FREE_DELIVERY_THRESHOLD = 1000; // Free delivery for orders >= ₹1000

    // Check for free delivery
    if (orderTotal >= FREE_DELIVERY_THRESHOLD) {
        return {
            charge: 0,
            breakdown: {
                base: 0,
                distance: 0,
                weight: 0,
                total: 0
            },
            freeDelivery: true,
            reason: `Free delivery for orders ≥ ₹${FREE_DELIVERY_THRESHOLD}`
        };
    }

    // Calculate components
    const baseCharge = BASE_CHARGE;
    const distanceCharge = Math.round(distance * DISTANCE_RATE);
    const weightSurcharge = weight > WEIGHT_THRESHOLD
        ? Math.round((weight - WEIGHT_THRESHOLD) * WEIGHT_RATE)
        : 0;

    const totalCharge = baseCharge + distanceCharge + weightSurcharge;

    return {
        charge: totalCharge,
        breakdown: {
            base: baseCharge,
            distance: distanceCharge,
            weight: weightSurcharge,
            total: totalCharge
        },
        freeDelivery: false,
        reason: null
    };
};

/**
 * Calculate distance from pincode (simplified - uses mock data)
 * In production, integrate with Google Maps Distance Matrix API
 * @param {String} sellerPincode - Seller's pincode
 * @param {String} customerPincode - Customer's pincode
 * @returns {Number} - Distance in kilometers
 */
const calculatePincodeDistance = (sellerPincode, customerPincode) => {
    // Mock implementation - replace with actual API call
    // For now, use simple logic based on pincode difference

    if (!sellerPincode || !customerPincode) return 10; // Default 10km

    const seller = parseInt(sellerPincode);
    const customer = parseInt(customerPincode);

    if (isNaN(seller) || isNaN(customer)) return 10;

    // Simple approximation: 1 pincode unit ≈ 2km
    const diff = Math.abs(seller - customer);
    const distance = Math.min(diff * 2, 100); // Cap at 100km

    return distance;
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
    calculateOrderWeight
};
