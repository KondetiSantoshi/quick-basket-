import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import { DELIVERY_HUBS, findNearestHub } from './locationController.js';

// @desc Create new grocery order
// @route POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      deliveryTimeSlot,
      paymentMethod,
      itemsPrice,
      deliveryPrice,
      platformFee,
      discountAmount,
      totalPrice,
      couponApplied
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.pincode) {
      return res.status(400).json({ message: 'Valid shipping address required' });
    }

    const orderNumber = `QB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Pick an available delivery partner
    const partner = await DeliveryPartner.findOne({ status: 'Available' }) || {
      name: 'Ramesh Kumar',
      phone: '+91 98450 12345',
      rating: 4.9,
      vehicleNumber: 'KA-01-EQ-4421',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    };

    const lat = Number(shippingAddress.lat);
    const lng = Number(shippingAddress.lng);
    const hubMatch =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? findNearestHub(lat, lng)
        : { hub: DELIVERY_HUBS[0], distanceKm: 1.4, estimate: '10-14 mins' };

    const order = new Order({
      orderNumber,
      user: req.user._id,
      items,
      shippingAddress,
      deliveryHub: {
        name: hubMatch.hub.name,
        lat: hubMatch.hub.lat,
        lng: hubMatch.hub.lng,
        distanceKm: hubMatch.distanceKm
      },
      deliveryTimeSlot: deliveryTimeSlot || 'Instant Delivery (10-15 mins)',
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: 'Pending',
      paymentDetails: {
        methodLabel: paymentMethod === 'COD' ? 'Cash on Delivery' : `${paymentMethod || 'Online'} Payment Pending`
      },
      itemsPrice: Number(itemsPrice),
      deliveryPrice: Number(deliveryPrice || 0),
      platformFee: Number(platformFee || 5),
      discountAmount: Number(discountAmount || 0),
      totalPrice: Number(totalPrice),
      couponApplied,
      orderStatus: 'Order Placed',
      statusTimeline: [
        {
          status: 'Order Placed',
          timestamp: new Date(),
          description: `Your order has been received and routed to ${hubMatch.hub.name}.`
        }
      ],
      deliveryPartner: {
        name: partner.name,
        phone: partner.phone,
        rating: partner.rating,
        vehicleNumber: partner.vehicleNumber,
        photo: partner.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      estimatedDeliveryTime: hubMatch.estimate || '10-14 mins'
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get logged-in user's orders
// @route GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single order by ID or orderNumber
// @route GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (id.startsWith('QB-')) {
      order = await Order.findOne({ orderNumber: id }).populate('user', 'name email phone');
    } else {
      order = await Order.findById(id).populate('user', 'name email phone');
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all orders (Admin & Delivery Partner)
// @route GET /api/orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    let query = {};
    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ orders, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update order status (Admin / Delivery partner)
// @route PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, description } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = status;

    const descriptions = {
      'Order Confirmed': 'Order confirmed by dark store. Preparing basket items.',
      'Packing': 'Items are packed and sealed in eco-friendly bag.',
      'Out for Delivery': `${order.deliveryPartner.name} is on the way with your order on electric scooter.`,
      'Delivered': 'Order delivered to doorstep! Enjoy your fresh groceries.',
      'Cancelled': 'Order was cancelled.'
    };

    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      description: description || descriptions[status] || `Status updated to ${status}`
    });

    if (status === 'Delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Completed';
    }

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mock Razorpay payment verification
// @route POST /api/orders/verify-payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'Completed';
    order.paymentDetails = {
      transactionId: razorpay_payment_id || `pay_${Date.now()}`,
      paidAt: new Date()
    };

    await order.save();
    res.json({ success: true, message: 'Payment verified successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin analytics & summary
// @route GET /api/orders/analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const deliveredCount = orders.filter(o => o.orderStatus === 'Delivered').length;
    const activeOrdersCount = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus)).length;

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      totalOrders,
      totalSales: Math.round(totalSales),
      deliveredCount,
      activeOrdersCount,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
