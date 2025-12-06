const Joi = require('joi');

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  JWT_SECRET: Joi.string().required(),
  MONGO_URI: Joi.string().required(),
  // Add validation for all other variables
}).unknown();
const { error } = envVarsSchema.validate(process.env);
if (error) throw new Error(`Config validation error: ${error.message}`);