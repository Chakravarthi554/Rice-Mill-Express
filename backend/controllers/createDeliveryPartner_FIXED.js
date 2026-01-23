// @desc    Create a new delivery partner
// @route   POST /api/delivery-partners/partners
// @access  Private/Seller

const createDeliveryPartner = asyncHandler(async (req, res) => {
    const { name, email, phone, password, vehicle_type, vehicle_number, license_number } = req.body;

    // Validate required fields
    if (!name || !vehicle_type || !vehicle_number || !license_number) {
        res.status(400);
        throw new Error('Name, vehicle_type, vehicle_number, and license_number are required');
    }

    // Require either phone OR (email + password)
    const hasPhoneAuth = phone && phone.trim();
    const hasEmailAuth = email && email.trim() && password && password.trim();

    if (!hasPhoneAuth && !hasEmailAuth) {
        res.status(400);
        throw new Error('Please provide either phone number OR both email and password for login credentials');
    }

    // Normalize phone number to 10 digits (remove +91 or country code if present)
    let normalizedPhone = '';
    if (hasPhoneAuth) {
        normalizedPhone = phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '');
        if (normalizedPhone.length > 10) {
            normalizedPhone = normalizedPhone.slice(-10); // Take last 10 digits
        }
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({
        $or: [
            email ? { email } : null,
            normalizedPhone ? { phone: normalizedPhone } : null
        ].filter(Boolean)
    });

    if (existingUser) {
        res.status(400);
        throw new Error('User with this email or phone already exists');
    }

    // 2. Create the User login identity first
    const userData = {
        name,
        role: 'deliveryPartner',
        isVerified: true // Pre-verified since seller is adding them
    };

    // Add credentials based on what was provided
    if (hasEmailAuth && hasPhoneAuth) {
        // Both email and phone provided
        userData.email = email;
        userData.password = password;
        userData.phone = normalizedPhone;
    } else if (hasEmailAuth) {
        // Email-only (unlikely but handle it)
        userData.email = email;
        userData.password = password;
    } else if (hasPhoneAuth) {
        // Phone-only registration: generate random password and temp email
        const crypto = require('crypto');
        const randomPassword = crypto.randomBytes(16).toString('hex'); // Secure random password
        userData.email = `${normalizedPhone}@delivery.temp`; // Use normalized phone for temp email
        userData.password = randomPassword; // User won't know this, will login via OTP only
        userData.phone = normalizedPhone;
    }

    const user = await User.create(userData);

    if (!user) {
        res.status(500);
        throw new Error('Failed to create user account for delivery partner');
    }

    // 3. Create the DeliveryPartner profile linked to the User
    const partner = new DeliveryPartner({
        name,
        email: userData.email, // Use the email we created (might be temp)
        phone: normalizedPhone || phone, // Use normalized phone if available
        vehicle_type,
        vehicle_number,
        license_number,
        seller: req.user._id,
        user: user._id, // Link to the Auth User
    });

    try {
        const createdPartner = await partner.save();
        res.status(201).json(createdPartner);
    } catch (error) {
        // Rollback user creation if partner save fails
        await User.findByIdAndDelete(user._id);
        res.status(500);
        throw new Error('Failed to save delivery partner profile to database');
    }
});
