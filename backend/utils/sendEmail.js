// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Determine which config to use (SendGrid vs SMTP)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
  const smtpPort = process.env.EMAIL_PORT || process.env.SMTP_PORT || 587;

  // ⚠️ Mock check: If no valid real-time config is provided, mock it.
  // Note: 'your.email@gmail.com' is a placeholder from .env
  if (!sendgridKey && (!smtpHost || smtpUser.includes('your.email'))) {
    console.warn('⚠️ Email configuration is missing or using placeholders. Skipping actual email.');
    console.log('--- MOCK EMAIL ---');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    console.log('------------------');
    return { success: true, simulated: true };
  }

  let transporter;

  // 2. Prepare Transporter
  if (sendgridKey) {
    // Priority: SendGrid
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: sendgridKey,
      },
    });
  } else {
    // Fallback: Generic SMTP
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  // 3. Define the email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'RiceMill Express'}" <${process.env.SENDGRID_VERIFIED_SENDER || process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_FROM_EMAIL || 'noreply@ricemill.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  // 4. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending real-time email:', error.message);
    // Don't throw for non-critical emails in dev or if fallback is preferred
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Falling back to simulated success in development.');
      return { success: true, simulated: true, error: error.message };
    }
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;