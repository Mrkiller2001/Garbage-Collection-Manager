const Truck = require('../models/Truck');

// GET /api/trucks?status=&minCapacity=&q=
const getTrucks = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const filter = { userId };
    const { status, minCapacity, q } = req.query;

    if (status) filter.status = status;
    if (minCapacity) filter.capacityLitres = { $gte: Number(minCapacity) };
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { plateNumber: new RegExp(q, 'i') }
      ];
    }

    const trucks = await Truck.find(filter).sort({ createdAt: -1 });
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/trucks/:id
const getTruck = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const truck = await Truck.findOne({ _id: req.params.id, userId });
    if (!truck) return res.status(404).json({ message: 'Truck not found' });
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/trucks
const addTruck = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  const {
    name, plateNumber, capacityLitres, fuelType, status, location, lastServiceAt, odometerKm
  } = req.body;

  try {
    const truck = await Truck.create({
      userId,
      name: name?.trim(),
      plateNumber: plateNumber?.trim(),
      capacityLitres,
      fuelType,
      status: status || 'available',
      location,
      lastServiceAt,
      odometerKm
    });
    res.status(201).json(truck);
  } catch (error) {
    // duplicate key (plate per user)
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Plate number already exists for this user' });
    }
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/trucks/:id
const updateTruck = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const truck = await Truck.findOne({ _id: req.params.id, userId });
    if (!truck) return res.status(404).json({ message: 'Truck not found' });

    const {
      name, plateNumber, capacityLitres, fuelType, status, location, lastServiceAt, odometerKm, currentRouteId
    } = req.body;

    if (name !== undefined) truck.name = name;
    if (plateNumber !== undefined) truck.plateNumber = plateNumber;
    if (capacityLitres !== undefined) truck.capacityLitres = capacityLitres;
    if (fuelType !== undefined) truck.fuelType = fuelType;
    if (status !== undefined) truck.status = status;
    if (location !== undefined) truck.location = location;
    if (lastServiceAt !== undefined) truck.lastServiceAt = lastServiceAt;
    if (odometerKm !== undefined) truck.odometerKm = odometerKm;
    if (currentRouteId !== undefined) truck.currentRouteId = currentRouteId;

    const updated = await truck.save();
    res.json(updated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Plate number already exists for this user' });
    }
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/trucks/:id
const deleteTruck = async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString();
  try {
    const truck = await Truck.findOne({ _id: req.params.id, userId });
    if (!truck) return res.status(404).json({ message: 'Truck not found' });
    await truck.deleteOne();
    res.json({ message: 'Truck deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTrucks, getTruck, addTruck, updateTruck, deleteTruck };
