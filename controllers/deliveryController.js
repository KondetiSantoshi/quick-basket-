import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';

// @desc Get delivery partner stats & orders
// @route GET /api/delivery/dashboard
export const getDeliveryDashboard = async (req, res) => {
  try {
    const activeOrders = await Order.find({
      orderStatus: { $in: ['Order Confirmed', 'Packing', 'Out for Delivery'] }
    }).sort({ createdAt: -1 });

    const completedToday = await Order.find({
      orderStatus: 'Delivered',
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).sort({ updatedAt: -1 });

    res.json({
      activeOrders,
      completedToday,
      totalActive: activeOrders.length,
      totalDeliveredToday: completedToday.length,
      todayEarnings: completedToday.length * 45 // ₹45 per delivery incentive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all delivery partners
// @route GET /api/delivery/partners
export const getDeliveryPartners = async (req, res) => {
  try {
    const partners = await DeliveryPartner.find();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create or update delivery partner
// @route POST /api/delivery/partners
export const createDeliveryPartner = async (req, res) => {
  try {
    const partner = await DeliveryPartner.create(req.body);
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
