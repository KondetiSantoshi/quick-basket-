import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  vehicleType: { type: String, default: 'Electric Bike' },
  rating: { type: Number, default: 4.8 },
  totalDeliveries: { type: Number, default: 142 },
  status: { type: String, enum: ['Available', 'On Delivery', 'Offline'], default: 'Available' },
  currentLocation: {
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    address: { type: String, default: 'Indiranagar, Bangalore' }
  }
}, {
  timestamps: true
});

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
export default DeliveryPartner;
