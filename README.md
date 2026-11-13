# QuickBasket ⚡ 10-Minute Grocery Delivery Platform

**QuickBasket** is a modern, responsive online grocery delivery web application inspired by **Zepto**, **Blinkit**, and **BigBasket**. Built with a high-performance React + Vite frontend, Tailwind CSS, Express.js backend, and MongoDB database.

---

## 🚀 Live Demo & Access

- **Frontend Application:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/api/health`

---

## 🔑 Demo Login Credentials (1-Click Login Available in Modal)

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Customer** | `user@quickbasket.com` | `password123` | Browsing, Cart, Checkout, Order Tracking, Profile, Addresses, Wishlist |
| **Admin** | `admin@quickbasket.com` | `admin123` | Analytics, Product CRUD, Categories, Orders Management, Coupons |
| **Delivery Rider** | `delivery@quickbasket.com` | `rider123` | Rider Queue, Out for Delivery, Mark Delivered, Daily Earnings |

> **Tip:** You can also click the quick **"Customer"**, **"Admin"**, or **"Rider"** buttons inside the Login Modal for instant authentication!

---

## 🛒 All 12 Required Grocery Categories

1. 🍎 **Fruits & Vegetables** (Tomatoes, Onions, Apples, Bananas, Hydroponic Spinach)
2. 🥛 **Dairy, Bread & Eggs** (Amul Taaza Milk, Amul Butter, Farm Eggs, Brown Bread, Malai Paneer)
3. 🌾 **Rice, Atta & Dal** (Aashirvaad Chakki Atta, Fortune Basmati Rice, Tata Toor Dal, Sunflower Oil)
4. 🍟 **Snacks & Munchies** (Lay's Magic Masala, Haldiram Aloo Bhujia, Doritos, Act II Popcorn)
5. 🥤 **Cold Drinks & Juices** (Coca-Cola Can, Real 100% Orange Juice, Red Bull, Kinley Soda)
6. 🥣 **Breakfast & Instant Food** (Maggi 2-Minute Noodles, Kellogg's Corn Flakes, Quaker Oats)
7. 🍫 **Chocolates & Ice Cream** (Cadbury Dairy Milk Silk, Amul Belgian Ice Cream, Ferrero Rocher)
8. 🧴 **Personal Care** (Dettol Soap Pack, Colgate Total Toothpaste, Dove Intense Repair Shampoo)
9. 🧼 **Household Essentials** (Surf Excel Matic, Vim Lemon Gel, Lizol Floor Cleaner)
10. 👶 **Baby Care** (Pampers Diaper Pants, Himalaya Baby Wipes)
11. 🍗 **Meat & Seafood** (Fresh Chicken Curry Cut, Fresh Cleaned Prawns)
12. 🍪 **Bakery & Biscuits** (Britannia Good Day, Parle Hide & Seek, Sunfeast Dark Fantasy)

---

## 🎟️ Active Discount Coupons

- `WELCOME50` - 50% Flat Off (up to ₹100) on first order
- `QUICK100` - Flat ₹100 Off on orders above ₹499
- `FREEDEL` - Free Delivery on any order size
- `SUPER20` - 20% Off on fresh produce & dairy

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with custom emerald theme (`#0c831f`)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **State Management:** Context API (`AuthContext`, `CartContext`, `LocationContext`, `WishlistContext`)
- **HTTP Client:** Axios with auto-JWT authorization interceptor
- **Celebration Effects:** Canvas-Confetti

### Backend
- **Runtime:** Node.js & Express.js (ES Modules)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password encryption
- **Payment Integration:** Razorpay test mode mock API + UPI payment selector
- **Logger:** Morgan HTTP logger

---

## 📋 Key Pages & Features

1. **Homepage:**
   - 10-Minute delivery banner with dynamic location pill
   - Real-time product search with auto-complete suggestions
   - Promotional slider carousel with active coupon codes
   - 12 categories circular grid with hover animations
   - Flash Deals section with live ticking countdown clock
   - Sections for Trending, Best Sellers, and Daily Essentials

2. **Product Listing Page:**
   - Search & dynamic multi-filter sidebar (Category, Brand checkboxes, Price range slider, In-stock toggle)
   - Sorting by Popularity, Price (Low to High, High to Low), Discount, and Rating
   - Instant cart quantity steppers (`- [count] +`) directly on cards

3. **Product Details Page:**
   - High-resolution product images
   - Weight/pack size indicator
   - Shelf life, storage instructions & country of origin
   - Customer ratings & review submission form
   - Related products carousel

4. **Cart Drawer & Cart Page:**
   - Slide-over drawer with free delivery progress meter ("Add ₹X for FREE Delivery")
   - Quantity modification and instant total calculation
   - Delivery partner tip selector
   - Coupon code application with quick chips

5. **Checkout & Payments:**
   - Saved address selector + modal to add new addresses
   - Delivery time slot: "Instant 10-15 mins" vs Scheduled
   - Payment methods: UPI (GPay/PhonePe/Paytm/QR), Cards, Net Banking, COD, Razorpay sandbox

6. **Live Order Tracking:**
   - 5 Animated Stages: `Order Placed` ➔ `Order Confirmed` ➔ `Packing` ➔ `Out for Delivery` ➔ `Delivered`
   - Real-time countdown timer
   - Delivery partner card with electric scooter details, rider rating, and phone call link
   - Simulated live route radar map
   - Interactive testing buttons to advance order stages on demand

7. **User Dashboard:**
   - Profile management
   - My Orders history with direct tracking & item receipts
   - Saved delivery addresses management
   - Wishlist with 1-click Add to Basket
   - Help & Support FAQs accordion

8. **Admin Dashboard:**
   - Store KPIs: Total Revenue, Total Orders, Active Dispatches, Catalog Size
   - Product Management: Add, Edit, Delete products with live image preview
   - Order Management: Status update dropdown & order details
   - Coupon Management: Create and delete promotional vouchers

9. **Delivery Partner Dashboard:**
   - Rider active delivery queue
   - Customer location and phone dialer
   - Quick status update buttons ("Out for Delivery", "Mark Delivered")
   - Daily incentive earnings tracker

---

## 🏃 Running Locally

To start both servers simultaneously:
```bash
# In the root directory:
npm run dev

# Or run separately:
npm run server  # starts backend on port 5000
npm run client  # starts frontend on port 3000

# To re-seed the MongoDB database:
npm run seed
```
