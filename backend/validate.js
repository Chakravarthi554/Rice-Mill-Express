const fs = require('fs');
const requiredModels = ['Order', 'BulkOrder', 'User', 'Product'];
requiredModels.forEach(model => {
  try {
    require(`./models/${model}`);
  } catch (err) {
    console.error(`Missing model: ${model}.js`);
    process.exit(1);
  }
});
console.log('All required models exist');