const fs = require('fs');
['mobile-customer', 'mobile-seller', 'mobile-delivery'].forEach(dir => {
  const path = `${dir}/src/config/env.js`;
  if (fs.existsSync(path)) {
    let data = fs.readFileSync(path, 'utf8');
    data = data.replace(/http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5001/g, 'http://13.63.246.61:5001');
    fs.writeFileSync(path, data, 'utf8');
    console.log(`Updated ${dir} API_URL to EC2`);
  }
});
