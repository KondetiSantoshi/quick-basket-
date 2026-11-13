import rateLimit from 'express-rate-limit';

// Standard rate limiter for login & registration
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: {
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for sending and verifying OTPs to prevent brute-force & SMS/Email flooding
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 attempts max per IP
  message: {
    message: 'Too many OTP requests. Please wait 10 minutes before requesting another OTP.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Payment creation rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    message: 'Too many payment requests, please slow down.'
  }
});
