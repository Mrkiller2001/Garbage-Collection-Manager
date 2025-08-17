const Bin = require('../models/Bin');
const RoutePlan = require('../models/RoutePlan');
const { haversineKm } = require('../utils/geo');

// POST /api/routes
// body: { depot:{lat,lng}, threshold=80, maxStops }
const createRoutePlan = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  const { depot, threshold = 80, maxStops } = req.body;

  try {
    if (!depot || typeof depot.lat !== 'number' || typeof depot.lng !== 'number') {
      return res.status(400).json({ message: 'Valid depot {lat,lng} is required' });
    }

    const th = Number(threshold);
    const cap = Number.isFinite(Number(maxStops)) ? Number(maxStops) : Infinity;

    // candidate bins
    const bins = await Bin.find({
      userId,
      $or: [
        { status: 'needs_pickup' },
        { latestFillPct: { $gte: th } }
      ]
    });

    if (!bins.length) {
      return res.status(400).json({ message: 'No bins require pickup at this time' });
    }

    // greedy nearest-neighbor from depot
    const remaining = bins.map(b => ({
      binId: b._id,
      name: b.name,
      location: { lat: b.location.lat, lng: b.location.lng }
    }));

    const stops = [];
    let current = { lat: depot.lat, lng: depot.lng };
    let total = 0;

    while (remaining.length && stops.length < cap) {
      // find nearest
      let idx = 0;
      let best = haversineKm(current, remaining[0].location);
      for (let i = 1; i < remaining.length; i++) {
        const d = haversineKm(current, remaining[i].location);
        if (d < best) { best = d; idx = i; }
      }
      const next = remaining.splice(idx, 1)[0];
      stops.push({
        ...next,
        distanceFromPrevKm: Number(best.toFixed(3))
      });
      total += best;
      current = next.location;
    }

    // include return to depot in total
    const back = haversineKm(current, depot);
    total += back;

    const plan = await RoutePlan.create({
      userId,
      depot,
      threshold: th,
      maxStops: Number.isFinite(cap) ? cap : undefined,
      totalDistanceKm: Number(total.toFixed(3)),
      status: 'planned',
      stops
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/routes
const listRoutePlans = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const plans = await RoutePlan.find({ userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/routes/:id
const getRoutePlan = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const plan = await RoutePlan.findOne({ _id: req.params.id, userId });
    if (!plan) return res.status(404).json({ message: 'Route plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/routes/:id
const deleteRoutePlan = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const plan = await RoutePlan.findOne({ _id: req.params.id, userId });
    if (!plan) return res.status(404).json({ message: 'Route plan not found' });
    await plan.deleteOne();
    res.json({ message: 'Route plan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/routes/:id/stops/:binId/complete
const completeStop = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  const { id: routeId, binId } = req.params;

  try {
    const plan = await RoutePlan.findOne({ _id: routeId, userId });
    if (!plan) return res.status(404).json({ message: 'Route plan not found' });

    const stop = plan.stops.find(s => String(s.binId) === String(binId));
    if (!stop) return res.status(404).json({ message: 'Stop not found in this route' });

    // idempotent: if already serviced, just return the plan
    if (!stop.servicedAt) {
      stop.servicedAt = new Date();

      // reset bin snapshot
      const bin = await Bin.findOne({ _id: binId, userId });
      if (bin) {
        bin.latestFillPct = 0;
        bin.status = 'normal';
        bin.latestReadingAt = new Date();
        await bin.save();
      }

      // complete route if all stops serviced
      const allDone = plan.stops.every(s => !!s.servicedAt);
      if (allDone) {
        plan.status = 'completed';
        // plan.completedAt = new Date(); // (optional if you added the field)
      }

      await plan.save();
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoutePlan, listRoutePlans, getRoutePlan, deleteRoutePlan, completeStop };
