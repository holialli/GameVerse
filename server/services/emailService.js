const nodemailer = require('nodemailer');

let cachedTransporter = null;
const APP_CLIENT_URL = 'https://game-verse.tech';

const resolveMailFrom = () => {
  const explicitFrom = process.env.EMAIL_FROM || process.env.CONTACT_EMAIL || process.env.SMTP_FROM;
  if (explicitFrom) return explicitFrom;

  // Resend allows onboarding@resend.dev for unverified/testing senders.
  if ((process.env.SMTP_HOST || '').includes('resend.com')) {
    return 'GameVerse <onboarding@resend.dev>';
  }

  return process.env.EMAIL_FROM
    || process.env.CONTACT_EMAIL
    || process.env.SMTP_FROM
    || 'GameVerse <noreply@game-verse.tech>';
};

const resolveClientUrl = () => {
  return APP_CLIENT_URL;
};

// For development/testing: use ethereal email (fake SMTP service)
const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || 'resend';
  const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || process.env.EMAIL_PASSWORD;

  if (smtpHost && smtpPass) {
    console.log(`[EMAIL] Initializing SMTP transporter: host=${smtpHost}, port=${smtpPort}, user=${smtpUser.substring(0, 5)}***, secure=${smtpPort === 465}`);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transporter.verify();
      console.log('[EMAIL] SMTP connection verified successfully');
      cachedTransporter = transporter;
      return cachedTransporter;
    } catch (verifyError) {
      console.error('[EMAIL] SMTP verification failed:', verifyError.message);
      throw new Error('Email transport configuration is invalid. Verify SMTP credentials.');
    }
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Create test account
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      return cachedTransporter;
    } catch (err) {
      console.log('Using ethereal email for tests');
      // Fallback for test environments
      cachedTransporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025, // MailHog default port
        secure: false,
      });
      return cachedTransporter;
    }
  }

  throw new Error('Missing SMTP configuration in production. Set SMTP_HOST and SMTP_PASS (or RESEND_API_KEY).');
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: 'Welcome to GameVerse!',
      html: `
        <h2>Welcome to GameVerse, ${name}!</h2>
        <p>Thank you for joining our gaming community.</p>
        <p>You can now:</p>
        <ul>
          <li>Buy and own your favorite games</li>
          <li>Rent games for 7 days</li>
          <li>Discover new games and genres</li>
          <li>Connect with other gaming enthusiasts</li>
        </ul>
        <p>Get started by visiting your <a href="${clientUrl}/dashboard">dashboard</a>.</p>
        <p>Happy gaming!</p>
        <hr>
        <p><small>GameVerse Team</small></p>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error sending welcome email:', error);
    }
    // Don't throw error - email sending should not block registration
  }
};

// Send password changed email
exports.sendPasswordChangedEmail = async (email, name) => {
  try {
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: 'Your Password Has Been Changed',
      html: `
        <h2>Password Changed Successfully</h2>
        <p>Hi ${name},</p>
        <p>Your GameVerse password was changed successfully.</p>
        <p>If you did not make this change, please contact us immediately.</p>
        <p><a href="${clientUrl}/profile">Reset your password</a></p>
        <hr>
        <p><small>GameVerse Security Team</small></p>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Password changed email sent:', info.messageId);
    return info;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error sending password changed email:', error);
    }
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    console.log(`[EMAIL] Attempting to send password reset email to: ${email}`);
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetLink}">Reset Your Password</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr>
        <p><small>GameVerse Security Team</small></p>
      `,
    };

    console.log(`[EMAIL] Mail options prepared - from: ${mailOptions.from}, to: ${mailOptions.to}`);
    const startTime = Date.now();
    const info = await emailTransporter.sendMail(mailOptions);
    const sendTime = Date.now() - startTime;
    
    console.log(`[EMAIL] Password reset email sent successfully - MessageID: ${info.messageId}, Time: ${sendTime}ms, Response: ${info.response}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('[EMAIL] Password reset preview URL:', previewUrl);
      info.previewUrl = previewUrl;
    }
    return info;
  } catch (error) {
    console.error('[EMAIL] ERROR sending password reset email:', {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    // Don't expose implementation details to client - log server-side instead
    const err = new Error('Failed to send password reset email. Please contact support if the issue persists.');
    err.statusCode = 500;
    err.isEmailError = true;
    throw err;
  }
};

// Send game created notification
exports.sendGameCreatedEmail = async (email, name, gameTitle) => {
  try {
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: `Your Game "${gameTitle}" Has Been Created!`,
      html: `
        <h2>Game Added Successfully!</h2>
        <p>Hi ${name},</p>
        <p>Your new game <strong>${gameTitle}</strong> has been added to your collection.</p>
        <p><a href="${clientUrl}/games">View your games</a></p>
        <hr>
        <p><small>GameVerse Team</small></p>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Game created email sent:', info.messageId);
    return info;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error sending game created email:', error);
    }
  }
};

// Send game purchase confirmation email
exports.sendGamePurchaseEmail = async (email, name, gameTitle, price) => {
  try {
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: 'Game Purchase Confirmation - GameVerse',
      html: `
        <h2>Purchase Confirmed, ${name}!</h2>
        <p>Thank you for purchasing a game on GameVerse.</p>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
          <p><strong>Game:</strong> ${gameTitle}</p>
          <p><strong>Price:</strong> $${price.toFixed(2)}</p>
          <p><strong>Status:</strong> Permanently Owned</p>
        </div>
        
        <p>You can now access this game anytime from your <a href="${clientUrl}/dashboard">dashboard</a>.</p>
        <p>Enjoy your new game!</p>
        <hr>
        <p><small>GameVerse Team</small></p>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Purchase confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error sending purchase email:', error);
    }
  }
};

// Send game rental confirmation email
exports.sendGameRentalEmail = async (email, name, gameTitle, price, expiryDate) => {
  try {
    const emailTransporter = await getTransporter();
    const clientUrl = resolveClientUrl();
    
    const mailOptions = {
      from: resolveMailFrom(),
      to: email,
      subject: 'Game Rental Confirmation - GameVerse',
      html: `
        <h2>Rental Confirmed, ${name}!</h2>
        <p>Your game rental has been confirmed on GameVerse.</p>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
          <p><strong>Game:</strong> ${gameTitle}</p>
          <p><strong>Price:</strong> $${price.toFixed(2)}</p>
          <p><strong>Expires:</strong> ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> 7 Days</p>
        </div>
        
        <p>You can access this game from your <a href="${clientUrl}/dashboard">dashboard</a>.</p>
        <p>After the rental period expires, you will no longer have access to this game.</p>
        <hr>
        <p><small>GameVerse Team</small></p>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Rental confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Error sending rental email:', error);
    }
  }
};

module.exports = {
  sendWelcomeEmail: exports.sendWelcomeEmail,
  sendPasswordChangedEmail: exports.sendPasswordChangedEmail,
  sendPasswordResetEmail: exports.sendPasswordResetEmail,
  sendGameCreatedEmail: exports.sendGameCreatedEmail,
  sendGamePurchaseEmail: exports.sendGamePurchaseEmail,
  sendGameRentalEmail: exports.sendGameRentalEmail,
};
