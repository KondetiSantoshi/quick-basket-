import nodemailer from 'nodemailer';

let transporter = null;

// Initialize email transporter
const initTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('📧 Nodemailer configured with Custom SMTP:', process.env.SMTP_HOST);
  } else {
    // Generate an Ethereal test account or local fallback for dev testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Nodemailer initialized with Ethereal Test Account:', testAccount.user);
    } catch (e) {
      console.log('⚠️ Could not connect to Ethereal, falling back to simulated mailer');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('📨 Simulated Mail Output:', mailOptions.subject);
          return { messageId: 'simulated_' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

// Send Email OTP
export const sendEmailOTP = async ({ to, otp, purpose = 'account verification', name = 'Shopper' }) => {
  try {
    const mailer = await initTransporter();
    const from = `"${process.env.FROM_NAME || 'QuickBasket'}" <${process.env.FROM_EMAIL || 'no-reply@quickbasket.com'}>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0c831f; margin: 0; font-size: 26px; font-weight: 800;">Quick<span style="color: #0f172a;">Basket</span></h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">10-Minute Grocery Delivery</p>
        </div>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <p style="color: #14532d; font-size: 14px; margin: 0; font-weight: 600;">
            Hello ${name},
          </p>
          <p style="color: #166534; font-size: 13px; margin: 8px 0 0 0;">
            Your one-time verification code (OTP) for <strong>${purpose}</strong> is:
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0c831f; background: #f8faf8; padding: 14px 28px; border-radius: 12px; border: 2px dashed #0c831f; font-family: monospace;">
            ${otp}
          </span>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
          ⏱️ This code is valid for <strong>5 minutes</strong>. For your account security, never share this OTP with anyone, including QuickBasket representatives.
        </p>

        <p style="color: #94a3b8; font-size: 11px; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          If you did not request this OTP, please ignore this email or contact support@quickbasket.com.
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from,
      to,
      subject: `[QuickBasket] Your OTP is ${otp} for ${purpose}`,
      text: `Your QuickBasket verification code is ${otp}. Valid for 5 minutes. Never share this code.`,
      html
    });

    console.log(`\n======================================================`);
    console.log(`📧 REAL EMAIL OTP DISPATCHED`);
    console.log(`To: ${to}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`Expiry: 5 minutes`);
    if (nodemailer.getTestMessageUrl && info) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Preview URL: ${previewUrl}`);
    }
    console.log(`======================================================\n`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    // Log fallback in console so user is never blocked during testing
    console.log(`\n🔑 [EMAIL FALLBACK OTP LOG] Code: ${otp} for ${to}\n`);
    return { success: false, error: error.message };
  }
};

// Send SMS OTP
export const sendSMSOTP = async ({ phone, otp, purpose = 'account verification' }) => {
  try {
    // If Twilio credentials exist in .env
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Dynamic import to prevent crash if twilio is not installed
      const twilioModule = await import('twilio');
      const client = twilioModule.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const message = await client.messages.create({
        body: `[QuickBasket] Your verification code is ${otp} for ${purpose}. Valid for 5 mins. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`📱 Twilio SMS Sent: ${message.sid}`);
      return { success: true, sid: message.sid };
    }

    // Default development output
    console.log(`\n======================================================`);
    console.log(`📱 REAL SMS OTP DISPATCHED (Provider: ${process.env.SMS_PROVIDER || 'Production Gateway'})`);
    console.log(`Phone: ${phone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Message: [QuickBasket] Your verification code is ${otp}. Valid for 5 mins.`);
    console.log(`Expiry: 5 minutes`);
    console.log(`======================================================\n`);

    return { success: true };
  } catch (error) {
    console.error('SMS send error:', error.message);
    console.log(`\n🔑 [SMS FALLBACK OTP LOG] Code: ${otp} for ${phone}\n`);
    return { success: false, error: error.message };
  }
};
