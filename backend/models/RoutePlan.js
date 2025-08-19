const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
  binId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', required: true },
  name: String,
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distanceFromPrevKm: { type: Number, default: 0 }
}, { _id: false });

const RoutePlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  depot: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  threshold: { type: Number, default: 80 },      // fill% threshold
  maxStops: { type: Number },                    // optional cap on stops
  totalDistanceKm: { type: Number, default: 0 }, // includes return to depot
  status: { type: String, enum: ['planned','locked','completed'], default: 'planned' },
  stops: [StopSchema],
}, { timestamps: true });

module.exports = mongoose.model('RoutePlan', RoutePlanSchema);
