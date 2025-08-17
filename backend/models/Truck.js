const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  name: { type: String, trim: true },                 // e.g., "Truck 12"
  plateNumber: { type: String, required: true, trim: true }, // "123-ABC" (unique per user)
  capacityLitres: { type: Number, required: true, min: 1 },  // bin capacity it can carry
  fuelType: { type: String, enum: ['diesel', 'petrol', 'electric', 'hybrid'], default: 'diesel' },

  status: { type: String, enum: ['available', 'in_service', 'maintenance'], default: 'available', index: true },

  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  currentRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutePlan', default: null },
  lastServiceAt: { type: Date },
  odometerKm: { type: Number, default: 0, min: 0 },

}, { timestamps: true });

// unique plate per user
TruckSchema.index({ userId: 1, plateNumber: 1 }, { unique: true });

module.exports = mongoose.model('Truck', TruckSchema);
