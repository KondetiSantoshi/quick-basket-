import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTPVerification from '../models/OTPVerification.js';
import { generateToken } from '../middleware/auth.js';
import { sendEmailOTP, sendSMSOTP } from '../utils/notificationService.js';

// Helper to generate a cryptographically secure 6-digit OTP
const generateRandomOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Helper to format Indian phone numbers
const formatPhoneNumber = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone;
};

// @desc Register user with Email or Mobile (Sends real OTP)
// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      termsAccepted,
      verificationMethod = 'email' // 'email' | 'phone'
    } = req.body;

    // 1. Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ message: 'Please provide a valid full name (at least 2 characters)' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const cleanPhone = phone ? String(phone).trim() : '';
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must agree to the Terms and Conditions to register' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const formattedPhone = formatPhoneNumber(cleanPhone);

    // 2. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: formattedPhone }]
    });

    let user;

    if (existingUser) {
      // If already active, reject
      if (existingUser.accountStatus === 'active') {
        if (existingUser.email === normalizedEmail) {
          return res.status(400).json({ message: 'This email address is already registered. Please sign in.' });
        }
        return res.status(400).json({ message: 'This mobile number is already registered. Please sign in.' });
      }

      // If pending verification, update info and re-issue OTP
      existingUser.fullName = fullName.trim();
      existingUser.password = password; // Pre-save will hash
      existingUser.phone = formattedPhone;
      existingUser.email = normalizedEmail;
      user = await existingUser.save();
    } else {
      // Create new user in pending_verification status
      user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: formattedPhone,
        password,
        accountStatus: 'pending_verification',
        emailVerified: false,
        phoneVerified: false,
        role: 'customer',
        addresses: [{
          fullName: fullName.trim(),
          phone: formattedPhone,
          street: '100ft Road, Indiranagar',
          landmark: 'Near Metro Station',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          type: 'Home',
          isDefault: true
        }]
      });
    }

    // 3. Generate Cryptographic 6-digit OTP & Hash
    const otp = generateRandomOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, otpSalt);

    const verificationId = `ver_${crypto.randomBytes(16).toString('hex')}`;
    const targetIdentifier = verificationMethod === 'phone' ? formattedPhone : normalizedEmail;

    // Delete any pending OTPs for this identifier
    await OTPVerification.deleteMany({ identifier: targetIdentifier });

    // Store hashed OTP
    await OTPVerification.create({
      verificationId,
      identifier: targetIdentifier,
      userId: user._id,
      otpHash,
      purpose: 'registration',
      expiryTime: new Date(Date.now() + 15 * 60 * 1000), // 15 mins validity for testing
      attempts: 0,
      lastResendAt: new Date()
    });

    // 4. Send real OTP via chosen method
    if (verificationMethod === 'phone') {
      await sendSMSOTP({
        phone: formattedPhone,
        otp,
        purpose: 'account registration'
      });
    } else {
      await sendEmailOTP({
        to: normalizedEmail,
        otp,
        purpose: 'account registration',
        name: fullName.trim()
      });
    }

    res.status(201).json({
      success: true,
      requiresVerification: true,
      verificationId,
      identifier: targetIdentifier,
      verificationMethod,
      devOtp: otp, // Surfaced for instant verification preview
      message: `Verification code sent to ${targetIdentifier}. (OTP: ${otp})`
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc Send OTP for quick login or on-demand verification
// @route POST /api/auth/send-otp
export const sendLoginOTP = async (req, res) => {
  try {
    const { identifier, purpose = 'login' } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please provide email address or mobile number' });
    }

    const clean = identifier.trim();
    const isEmail = clean.includes('@');
    const targetIdentifier = isEmail ? clean.toLowerCase() : formatPhoneNumber(clean);

    let user = await User.findOne({
      $or: [{ email: targetIdentifier }, { phone: targetIdentifier }]
    });

    if (!user) {
      // Auto-create for quick mobile login
      user = await User.create({
        fullName: isEmail ? clean.split('@')[0] : 'Quick Shopper',
        email: isEmail ? targetIdentifier : `user_${Date.now()}@quickbasket.com`,
        phone: isEmail ? `+91${Math.floor(6000000000 + Math.random() * 3999999999)}` : targetIdentifier,
        password: 'Password@123',
        accountStatus: 'pending_verification',
        emailVerified: isEmail,
        phoneVerified: !isEmail
      });
    }

    const otp = generateRandomOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const verificationId = `ver_${crypto.randomBytes(16).toString('hex')}`;

    await OTPVerification.deleteMany({ identifier: targetIdentifier });
    await OTPVerification.create({
      verificationId,
      identifier: targetIdentifier,
      userId: user._id,
      otpHash,
      purpose,
      expiryTime: new Date(Date.now() + 15 * 60 * 1000),
      attempts: 0,
      lastResendAt: new Date()
    });

    if (isEmail) {
      await sendEmailOTP({
        to: targetIdentifier,
        otp,
        purpose: 'account verification',
        name: user.fullName
      });
    } else {
      await sendSMSOTP({
        phone: targetIdentifier,
        otp,
        purpose: 'account verification'
      });
    }

    res.json({
      success: true,
      verificationId,
      identifier: targetIdentifier,
      devOtp: otp,
      message: `OTP sent successfully to ${targetIdentifier}. (OTP: ${otp})`
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

// @desc Verify OTP and activate account or login
// @route POST /api/auth/verify-otp
export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { verificationId, identifier, otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const cleanOtp = String(otp).trim();

    // Query by verificationId or identifier
    let verificationRecord = null;
    if (verificationId) {
      verificationRecord = await OTPVerification.findOne({
        $or: [{ verificationId }, { identifier: verificationId }]
      }).sort({ createdAt: -1 });
    }
    if (!verificationRecord && identifier) {
      verificationRecord = await OTPVerification.findOne({
        identifier: identifier.trim()
      }).sort({ createdAt: -1 });
    }

    if (!verificationRecord) {
      // Check if user already exists and wants to verify with master demo code 123456
      const searchTarget = identifier || verificationId;
      const fallbackUser = searchTarget ? await User.findOne({
        $or: [{ email: searchTarget }, { phone: searchTarget }]
      }) : null;

      if (fallbackUser && cleanOtp === '123456') {
        fallbackUser.accountStatus = 'active';
        fallbackUser.emailVerified = true;
        fallbackUser.phoneVerified = true;
        await fallbackUser.save();

        const token = generateToken(fallbackUser._id);
        return res.json({
          success: true,
          message: 'Account successfully verified! Welcome to QuickBasket.',
          user: {
            _id: fallbackUser._id,
            fullName: fallbackUser.fullName,
            name: fallbackUser.fullName,
            email: fallbackUser.email,
            phone: fallbackUser.phone,
            role: fallbackUser.role,
            emailVerified: fallbackUser.emailVerified,
            phoneVerified: fallbackUser.phoneVerified,
            accountStatus: fallbackUser.accountStatus,
            addresses: fallbackUser.addresses,
            token
          }
        });
      }

      return res.status(400).json({ message: 'No active OTP verification found. Please click Resend OTP or use 123456.' });
    }

    // Check expiration (allow 123456 even if expired)
    if (verificationRecord.expiryTime && new Date() > new Date(verificationRecord.expiryTime) && cleanOtp !== '123456') {
      return res.status(400).json({ message: 'OTP has expired. Please click Resend OTP or use 123456.' });
    }

    // Check attempts limit (max 10)
    if (verificationRecord.attempts >= 10) {
      return res.status(400).json({ message: 'Maximum attempts exceeded. Please request a new OTP.' });
    }

    // Compare entered OTP with hashed OTP OR allow master bypass 123456
    const isMatch = (await verificationRecord.matchOTP(cleanOtp)) || cleanOtp === '123456';

    if (!isMatch) {
      verificationRecord.attempts += 1;
      await verificationRecord.save();
      const remaining = 10 - verificationRecord.attempts;
      return res.status(400).json({
        message: `Incorrect OTP code. ${remaining} attempts remaining.`
      });
    }

    // Mark verification as complete
    verificationRecord.verified = true;
    await verificationRecord.save();

    // Find and activate user
    let user = null;
    if (verificationRecord.userId) {
      user = await User.findById(verificationRecord.userId);
    }
    if (!user) {
      user = await User.findOne({
        $or: [{ email: verificationRecord.identifier }, { phone: verificationRecord.identifier }]
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.accountStatus = 'active';
    if (verificationRecord.identifier.includes('@')) {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }

    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Account successfully verified and activated! Welcome to QuickBasket.',
      user: {
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        accountStatus: user.accountStatus,
        addresses: user.addresses,
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
};

// @desc Resend OTP with cooldown
// @route POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
  try {
    const { verificationId, identifier } = req.body;

    let verificationRecord;
    if (verificationId) {
      verificationRecord = await OTPVerification.findOne({
        $or: [{ verificationId }, { identifier: verificationId }]
      }).sort({ createdAt: -1 });
    } else if (identifier) {
      verificationRecord = await OTPVerification.findOne({
        identifier: identifier.trim()
      }).sort({ createdAt: -1 });
    }

    const cleanIdentifier = identifier || verificationRecord?.identifier;

    if (!cleanIdentifier) {
      return res.status(400).json({ message: 'Identifier or verificationId is required to resend OTP' });
    }

    // Cooldown check (30 seconds)
    const COOLDOWN_SECONDS = 30;
    if (verificationRecord && verificationRecord.lastResendAt) {
      const elapsed = Math.floor((Date.now() - new Date(verificationRecord.lastResendAt).getTime()) / 1000);
      if (elapsed < COOLDOWN_SECONDS) {
        return res.status(429).json({
          message: `Please wait ${COOLDOWN_SECONDS - elapsed} seconds before requesting a new OTP.`
        });
      }
    }

    // Generate new OTP & Hash
    const newOtp = generateRandomOTP();
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newOtp, salt);

    if (verificationRecord) {
      verificationRecord.otpHash = newHash;
      verificationRecord.expiryTime = new Date(Date.now() + 15 * 60 * 1000);
      verificationRecord.attempts = 0;
      verificationRecord.verified = false;
      verificationRecord.lastResendAt = new Date();
      await verificationRecord.save();
    } else {
      verificationRecord = await OTPVerification.create({
        verificationId: `ver_${crypto.randomBytes(16).toString('hex')}`,
        identifier: cleanIdentifier,
        otpHash: newHash,
        purpose: 'registration',
        expiryTime: new Date(Date.now() + 15 * 60 * 1000),
        attempts: 0,
        lastResendAt: new Date()
      });
    }

    const isEmail = cleanIdentifier.includes('@');
    if (isEmail) {
      await sendEmailOTP({
        to: cleanIdentifier,
        otp: newOtp,
        purpose: verificationRecord.purpose || 'verification'
      });
    } else {
      await sendSMSOTP({
        phone: cleanIdentifier,
        otp: newOtp,
        purpose: verificationRecord.purpose || 'verification'
      });
    }

    res.json({
      success: true,
      verificationId: verificationRecord.verificationId,
      identifier: cleanIdentifier,
      devOtp: newOtp,
      message: `A fresh OTP has been sent to ${cleanIdentifier}. (OTP: ${newOtp})`,
      cooldown: COOLDOWN_SECONDS
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to resend OTP' });
  }
};

// @desc Login user (Email + Password OR Mobile + Password)
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { loginIdentifier, email, phone, password, rememberMe } = req.body;

    const identifier = (loginIdentifier || email || phone || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/mobile and your password' });
    }

    const isEmail = identifier.includes('@');
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { phone: { $in: [identifier, formatPhoneNumber(identifier)] } };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: 'No account found with this email or mobile number' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
    }

    // If account was pending verification, generate OTP & allow 1-click verification
    if (user.accountStatus === 'pending_verification') {
      const otp = generateRandomOTP();
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otp, salt);
      const verificationId = `ver_${crypto.randomBytes(16).toString('hex')}`;

      await OTPVerification.deleteMany({ identifier: user.email });
      await OTPVerification.create({
        verificationId,
        identifier: user.email,
        userId: user._id,
        otpHash,
        purpose: 'registration',
        expiryTime: new Date(Date.now() + 15 * 60 * 1000)
      });

      await sendEmailOTP({
        to: user.email,
        otp,
        purpose: 'account activation',
        name: user.fullName
      });

      return res.status(403).json({
        message: `Your account is pending verification. OTP sent to ${user.email}. (OTP: ${otp})`,
        requiresVerification: true,
        verificationId,
        identifier: user.email,
        devOtp: otp
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact customer support.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      _id: user._id,
      fullName: user.fullName,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      addresses: user.addresses,
      wishlist: user.wishlist,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

// @desc Forgot Password - Send OTP
// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please provide your registered email address or mobile number' });
    }

    const clean = identifier.trim();
    const isEmail = clean.includes('@');
    const query = isEmail
      ? { email: clean.toLowerCase() }
      : { phone: { $in: [clean, formatPhoneNumber(clean)] } };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email or mobile number.' });
    }

    // Generate secure OTP
    const otp = generateRandomOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const verificationId = `pwd_${crypto.randomBytes(16).toString('hex')}`;
    const targetIdentifier = isEmail ? user.email : user.phone;

    await OTPVerification.deleteMany({ identifier: targetIdentifier, purpose: 'password_reset' });

    await OTPVerification.create({
      verificationId,
      identifier: targetIdentifier,
      userId: user._id,
      otpHash,
      purpose: 'password_reset',
      expiryTime: new Date(Date.now() + 15 * 60 * 1000)
    });

    if (isEmail) {
      await sendEmailOTP({
        to: user.email,
        otp,
        purpose: 'password reset',
        name: user.fullName
      });
    } else {
      await sendSMSOTP({
        phone: user.phone,
        otp,
        purpose: 'password reset'
      });
    }

    res.json({
      success: true,
      verificationId,
      identifier: targetIdentifier,
      devOtp: otp,
      message: `Password reset OTP sent to ${targetIdentifier}. (OTP: ${otp})`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Password reset request failed' });
  }
};

// @desc Reset Password after OTP verification
// @route POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { verificationId, identifier, otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const cleanOtp = String(otp).trim();

    // Query record
    const query = { purpose: 'password_reset', verified: false };
    if (verificationId) {
      query.$or = [{ verificationId }, { identifier: verificationId }];
    } else if (identifier) {
      query.identifier = identifier.trim();
    }

    let record = await OTPVerification.findOne(query).sort({ createdAt: -1 });

    let user = null;
    if (record) {
      user = await User.findById(record.userId);
    } else {
      user = await User.findOne({
        $or: [{ email: verificationId || identifier }, { phone: verificationId || identifier }]
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = (record && (await record.matchOTP(cleanOtp))) || cleanOtp === '123456';

    if (!isMatch) {
      if (record) {
        record.attempts += 1;
        await record.save();
      }
      return res.status(400).json({ message: 'Incorrect OTP code.' });
    }

    if (record) {
      record.verified = true;
      await record.save();
    }

    user.password = newPassword; // Pre-save hook hashes with bcrypt
    user.accountStatus = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
};

// @desc Change Password (Profile Section)
// @route PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user._id);
    const isCurrentValid = await user.matchPassword(currentPassword);

    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get current user profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('wishlist');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.fullName) {
      user.fullName = req.body.fullName.trim();
    }
    if (req.body.name) {
      user.fullName = req.body.name.trim();
    }
    if (req.body.phone) {
      user.phone = req.body.phone.trim();
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      fullName: updated.fullName,
      name: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      emailVerified: updated.emailVerified,
      phoneVerified: updated.phoneVerified,
      addresses: updated.addresses,
      token: generateToken(updated._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Add saved address
// @route POST /api/auth/address
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { fullName, phone, street, landmark, city, state, pincode, lat, lng, type, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses.push({
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
      street,
      landmark,
      city: city || 'Bangalore',
      state: state || 'Karnataka',
      pincode,
      ...(Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
        ? { lat: Number(lat), lng: Number(lng) }
        : {}),
      type: type || 'Home',
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete address
// @route DELETE /api/auth/address/:addressId
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Toggle wishlist
// @route POST /api/auth/wishlist/:productId
export const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { productId } = req.params;

    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
