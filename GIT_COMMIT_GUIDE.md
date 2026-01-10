# Changes to Commit for Rate Limiter Fix

## Files Modified

### 1. `backend/middleware/rateLimit.js`
**Changes:**
- Removed custom `keyGenerator` from all three rate limiters
- Changed `validate: { defaultKeys: false }` to `validate: { default: false }`
- This fixes both the IPv6 error and the unknown validation option error

### 2. `backend/routes/products.js`
**Changes:**
- Added import: `const { customerLimiter } = require("../middleware/rateLimit");` at line 7

### 3. `backend/routes/recipeRoutes.js`
**Changes:**
- Added import: `const { socialRateLimiter, strictSocialLimiter, customerLimiter } = require('../middleware/rateLimit');` at line 16

### 4. `backend/routes/socialRoutes.js`
**Changes:**
- Added import: `const { customerLimiter } = require('../middleware/rateLimit');` at line 17

### 5. `backend/controllers/socialController.js`
**Changes:**
- Added `replyToComment` to module.exports (line 1238)

### 6. `backend/models/BulkOrder.js`
**Changes:**
- Removed duplicate index: commented out `bulkOrderSchema.index({ orderNumber: 1 });` at line 199
- This fixes the Mongoose duplicate index warning

## Git Commands to Share Changes

```bash
# Stage all changes
git add backend/middleware/rateLimit.js
git add backend/routes/products.js
git add backend/routes/recipeRoutes.js
git add backend/routes/socialRoutes.js
git add backend/controllers/socialController.js
git add backend/models/BulkOrder.js

# Commit
git commit -m "Fix rate limiter validation errors and Mongoose duplicate index warning"

# Push to remote
git push origin main
```

## For Your Friend to Test

After you push, your friend should:
```bash
git pull origin main
npm start
```

The server should now start without the `customerLimiter is not defined` errors.
