# QuickBasket ⚡ 10-Minute Grocery Delivery Platform

**QuickBasket** is a complete, modern, responsive full-stack online grocery delivery web application inspired by **Zepto**, **Blinkit**, and **BigBasket**. Built as a unified **Next.js 14 (App Router)** platform with Express.js APIs, MongoDB database, Leaflet GPS geolocation mapping, and Razorpay/UPI checkout.

---

## 📁 Unified Single-Folder Structure

Everything in QuickBasket lives in this single repository:

```
├── app/                  # Next.js 14 App Router (all pages & layouts)
│   ├── page.jsx          # Storefront (Hero, Categories, Deals, Aisles)
│   ├── products/         # Catalog & Zepto-style filter modal
│   ├── product/[id]/     # Product details with pack size selector
│   ├── cart/             # Shopping basket & delivery progress bar
│   ├── checkout/         # GPS location, interactive map & payment
│   ├── order-success/    # Confirmation banner & live tracking link
│   ├── order-tracking/   # 5-stage live rider GPS route tracking
│   ├── dashboard/        # User profile, addresses, orders, support
│   ├── admin/            # Admin analytics, CRUD products, orders
│   ├── delivery/         # Rider dashboard with active dispatches
│   ├── login/            # Phone/Email login & demo accounts
│   ├── register/         # User registration with password strength
│   ├── verify-otp/       # 6-box OTP entry with countdown
│   └── (about, contact, help, terms, privacy, apps, not-found)
├── components/           # Modular UI widgets (cart, checkout, home, product, common)
├── context/              # Context API (Auth, Cart, Location, Wishlist)
├── controllers/          # Backend controllers (Auth, Products, Orders, Payments, etc.)
├── models/               # MongoDB Mongoose schemas
├── routes/               # Backend API endpoints
├── middleware/           # Authentication guards & rate limiting
├── config/               # Database and payment gateway configs
├── utils/                # Department catalog, seeder, notifications
├── services/             # Axios API client
├── public/               # Static assets & brand icons
├── server.js             # Unified full-stack server (Next.js + Express)
├── package.json          # Single unified dependencies & scripts
├── next.config.mjs       # Next.js configuration
├── tailwind.config.js    # QuickBasket emerald theme
└── .env.example          # Environment variables template
```

---

## 🚀 Quick Start (One Command)

### 1. Clone the repository
```bash
git clone https://github.com/KondetiSantoshi/quick-basket-.git
cd quick-basket-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/quickbasket
JWT_SECRET=quickbasket_ultra_secure_jwt_secret_token_2025_grocery_app

# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=rzp_test_secret_key_quickbasket_2025
RAZORPAY_WEBHOOK_SECRET=quickbasket_webhook_secret_9988

# Email & SMS
FROM_EMAIL=no-reply@quickbasket.com
FROM_NAME=QuickBasket Groceries
SMS_PROVIDER=console
```

### 4. Seed sample grocery inventory (optional)
```bash
npm run seed
```

### 5. Run the application
```bash
# Starts both Express backend and Next.js frontend on http://localhost:3000
npm run dev

# Or build for production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials (1-Click Login Available)

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Customer** | `user@quickbasket.com` | `password123` | Browsing, Cart, Checkout, Order Tracking, Profile, Addresses |
| **Admin** | `admin@quickbasket.com` | `admin123` | Analytics, Product CRUD, Categories, Orders Management, Coupons |
| **Delivery Rider** | `delivery@quickbasket.com` | `rider123` | Rider Queue, Out for Delivery, Mark Delivered, Daily Earnings |

---

## 🛒 All 12 Grocery Categories Included

1. 🍎 **Fruits & Vegetables**
2. 🥛 **Dairy, Bread & Eggs**
3. 🌾 **Rice, Atta & Dal**
4. 🍟 **Snacks & Munchies**
5. 🥤 **Cold Drinks & Juices**
6. 🥣 **Breakfast & Instant Food**
7. 🍫 **Chocolates & Ice Cream**
8. 🧴 **Personal Care**
9. 🧼 **Household Essentials**
10. 👶 **Baby Care**
11. 🍗 **Meat & Seafood**
12. 🍪 **Bakery & Biscuits**

---

## 💳 Payment Gateway Support

- **UPI Instant Pay:** Google Pay, PhonePe, Paytm, BHIM (via UPI ID or scan QR)
- **Credit & Debit Cards:** Visa, Mastercard, RuPay, Amex with Luhn validation
- **Net Banking:** HDFC, ICICI, SBI, Axis, Kotak, Yes Bank, and more
- **Digital Wallets:** Paytm, Amazon Pay, PhonePe Wallet, MobiKwik
- **Cash on Delivery (COD):** Pay at doorstep on arrival
