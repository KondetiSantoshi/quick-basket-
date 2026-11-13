import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key_quickbasket_2025';

let razorpayInstance = null;

try {
  razorpayInstance = new Razorpay({
    key_id,
    key_secret
  });
  console.log(`💳 Razorpay SDK initialized with key: ${key_id}`);
} catch (error) {
  console.warn('⚠️ Razorpay initialization warning:', error.message);
}

export { razorpayInstance, key_id, key_secret };
