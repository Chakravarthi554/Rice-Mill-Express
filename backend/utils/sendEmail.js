// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter (service that will send email like "gmail", "sendgrid", etc.)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // For services like Gmail, you might need to enable "less secure app access"
    // or use OAuth2 for better security. For SendGrid/Mailgun, use their API keys.
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'RiceMill Express'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Use HTML for links and formatting
    // text: options.message // You can provide a plain text version as fallback
  };

  // 3. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent'); // Propagate error up
  }
};

module.exports = sendEmail;