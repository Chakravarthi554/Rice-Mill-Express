
const path = require('path');
const fs = require('fs');

const routes = [
    './backend/routes/products.js',
    './backend/routes/recipeRoutes.js',
    './backend/routes/socialRoutes.js',
    './backend/routes/adminPaymentRoutes.js'
];

routes.forEach(f => {
    console.log(`\n--- Testing ${f} ---`);
    try {
        const fullPath = path.resolve(f);
        if (!fs.existsSync(fullPath)) {
            console.log(`File not found: ${fullPath}`);
            return;
        }
        require(f);
        console.log(`✅ Loaded ${f} successfully`);
    } catch (e) {
        console.error(`❌ Failed to load ${f}:`);
        console.error(e.message);
        if (e.stack) {
            // Find the first line in the stack trace that belongs to our project
            const stackLines = e.stack.split('\n');
            console.error(stackLines.slice(0, 5).join('\n'));
        }
    }
});
