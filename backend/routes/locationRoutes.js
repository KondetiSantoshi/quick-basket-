import express from 'express';
import {
  getDeliveryHubs,
  reverseGeocodeLocation,
  searchLocations
} from '../controllers/locationController.js';

const router = express.Router();

router.get('/hubs', getDeliveryHubs);
router.get('/reverse', reverseGeocodeLocation);
router.get('/search', searchLocations);

export default router;
