const nodemailer = require("nodemailer");

const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "⚠️  Email credentials not configured. Emails will not be sent.",
    );
    console.warn("⚠️  Please set EMAIL_USER and EMAIL_PASS in your .env file");
    return null;
  }

  // Nodemailer v7.x+ uses default export
  const mailerModule = nodemailer.default || nodemailer;

  if (typeof mailerModule.createTransport !== "function") {
    console.error("Nodemailer createTransport is not available");
    return null;
  }

  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const isSecure = port === 465;

  const transportConfig = {
    host: process.env.EMAIL_HOST,
    port: port,
    secure: isSecure, // true for 465, false for other ports (587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Don't fail on invalid certs
      rejectUnauthorized: false,
      // Minimum TLS version
      minVersion: "TLSv1.2",
    },
    // Connection timeout (10 seconds)
    connectionTimeout: 10000,
    // Greeting timeout (10 seconds)
    greetingTimeout: 10000,
    // Socket timeout (10 seconds)
    socketTimeout: 10000,
    // Enable debug logs
    debug: process.env.NODE_ENV === "development",
    logger: process.env.NODE_ENV === "development",
  };

  // For port 587, explicitly enable STARTTLS
  if (port === 587) {
    transportConfig.requireTLS = true;
  }

  return mailerModule.createTransport(transportConfig);
};
const EmailService = {
  sendEmail: async ({
    to,
    subject,
    template,
    data,
    EMAIL_FROM = process.env.EMAIL_FROM,
  }) => {
    try {
      const transporter = createTransporter();

      // If transporter is null (email not configured), skip sending
      if (!transporter) {
        console.log("📧 Email not sent (service not configured):", subject);
        return { success: false, message: "Email service not configured" };
      }

      // For now, sending simple HTML email
      // In production, you'd use a template engine like Handlebars
      let html = "";

      if (template === "emailVerification") {
        html = `
        <h2>Welcome to WasHub, ${data.name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${data.verificationLink}">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
      `;
      } else if (template === "passwordReset") {
        html = `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${data.resetLink}">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;
      } else if (template === "sendOtp") {
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OTP Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .header {
      background-color: #2563eb;
      padding: 20px;
      text-align: center;
      color: #ffffff;
    }
    .content {
      padding: 30px;
      color: #333333;
    }
    .otp {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 6px;
      text-align: center;
      margin: 30px 0;
      color: #2563eb;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777777;
      background-color: #f9fafb;
    }
    .note {
      font-size: 14px;
      color: #555555;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OTP Verification</h1>
    </div>

    <div class="content">
      <p>Hello,</p>

      <p>
        Use the One-Time Password (OTP) below to complete your verification.
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <div class="otp">${data.otp}</div>

      <p class="note">
        If you did not request this code, please ignore this email.
        Do not share this OTP with anyone.
      </p>

      <p>Thank you,<br />The WasHub Team</p>
    </div>

    <div class="footer">
      © 2026 WasHub. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
      }
      const mailOptions = {
        from: `"WasHub" <${EMAIL_FROM}>`,
        to,
        subject,
        html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },
};

module.exports = EmailService;
