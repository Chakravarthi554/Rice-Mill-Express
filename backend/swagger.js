const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rice Mill E-Commerce API',
      version: '1.0.0',
      description:
        'API documentation for the Rice Mill Express application — covering Auth, Orders, and Payments.',
      contact: {
        name: 'Rice Mill Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        OrderCreate: {
          type: 'object',
          required: ['orderItems', 'shippingAddress', 'paymentMethod'],
          properties: {
            orderItems: {
              type: 'array',
              items: {
                type: 'object',
                required: ['product', 'qty', 'price'],
                properties: {
                  product: {
                    type: 'string',
                    description: 'Product ID',
                    example: '60d5ec49f1b2c72b7c8e4a3f',
                  },
                  name: {
                    type: 'string',
                    example: 'Basmati Rice 5kg',
                  },
                  qty: {
                    type: 'integer',
                    example: 2,
                  },
                  price: {
                    type: 'number',
                    example: 450,
                  },
                },
              },
            },
            shippingAddress: {
              type: 'object',
              properties: {
                address: { type: 'string', example: '123 Rice Lane' },
                city: { type: 'string', example: 'Hyderabad' },
                postalCode: { type: 'string', example: '500001' },
                state: { type: 'string', example: 'Telangana' },
              },
            },
            paymentMethod: {
              type: 'string',
              enum: ['razorpay', 'cod'],
              example: 'razorpay',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  // Swagger UI serves its own JS/CSS from CDN; we need to relax helmet CSP
  // specifically for the /api-docs path so the UI loads correctly.
  app.use(
    '/api-docs',
    (req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://unpkg.com https://swagger.io; connect-src 'self';"
      );
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customSiteTitle: 'Rice Mill API Docs',
    })
  );
  console.log('✅ Swagger UI available at /api-docs');
};
