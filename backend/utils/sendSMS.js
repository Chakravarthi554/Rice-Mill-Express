// backend/utils/sendSMS.js

/**
 * Mock utility for sending SMS notifications.
 * Can be expanded with real providers like Twilio, Gupshup, or AWS SNS.
 */
const sendSMS = async (options) => {
    const { phone, message } = options;

    // In a real environment, you would check for API keys
    const isDev = process.env.NODE_ENV === 'development';
    const hasConfig = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN;

    if (!hasConfig) {
        console.log('--- MOCK SMS ---');
        console.log(`To: ${phone}`);
        console.log(`Message: ${message}`);
        console.log('----------------');
        return { success: true, simulated: true };
    }

    // Example implementation structure for Twilio:
    /*
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      const response = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      console.log(`✅ SMS sent successfully: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error(`❌ SMS failed: ${error.message}`);
      if (isDev) return { success: true, simulated: true, error: error.message };
      throw error;
    }
    */

    return { success: true, simulated: true };
};

module.exports = sendSMS;
