import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

export default function TruckForm({ trucks, setTrucks, editingTruck, setEditingTruck }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    plateNumber: '',
    capacityLitres: '',
    fuelType: 'diesel',
    status: 'available',
    odometerKm: '',
    lastServiceAt: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    if (editingTruck) {
      setForm({
        name: editingTruck.name || '',
        plateNumber: editingTruck.plateNumber || '',
        capacityLitres: editingTruck.capacityLitres ?? '',
        fuelType: editingTruck.fuelType || 'diesel',
        status: editingTruck.status || 'available',
        odometerKm: editingTruck.odometerKm ?? '',
        lastServiceAt: editingTruck.lastServiceAt ? editingTruck.lastServiceAt.substring(0,10) : '',
        lat: editingTruck.location?.lat ?? '',
        lng: editingTruck.location?.lng ?? ''
      });
    } else {
      setForm({
        name: '',
        plateNumber: '',
        capacityLitres: '',
        fuelType: 'diesel',
        status: 'available',
        odometerKm: '',
        lastServiceAt: '',
        lat: '',
        lng: ''
      });
    }
  }, [editingTruck]);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name || undefined,
      plateNumber: form.plateNumber,
      capacityLitres: Number(form.capacityLitres),
      fuelType: form.fuelType,
      status: form.status,
      odometerKm: form.odometerKm === '' ? undefined : Number(form.odometerKm),
      lastServiceAt: form.lastServiceAt || undefined,
      location: (form.lat !== '' && form.lng !== '') ? { lat: Number(form.lat), lng: Number(form.lng) } : undefined
    };

    try {
      if (editingTruck) {
        const { data } = await axiosInstance.put(`/api/trucks/${editingTruck._id}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrucks(trucks.map(t => t._id === data._id ? data : t));
      } else {
        const { data } = await axiosInstance.post('/api/trucks', payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrucks([...trucks, data]);
      }
      setEditingTruck(null);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to save truck');
    }
  };

  return (
    <form onSubmit={save} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-semibold mb-3">{editingTruck ? 'Edit Truck' : 'Add Truck'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded p-2" placeholder="Name (optional)"
          value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
        <input className="border rounded p-2" placeholder="Plate Number *" required
          value={form.plateNumber} onChange={e => setForm(s => ({ ...s, plateNumber: e.target.value }))} />
        <input className="border rounded p-2" type="number" min="1" placeholder="Capacity (L) *" required
          value={form.capacityLitres} onChange={e => setForm(s => ({ ...s, capacityLitres: e.target.value }))} />
        <select className="border rounded p-2"
          value={form.fuelType} onChange={e => setForm(s => ({ ...s, fuelType: e.target.value }))}>
          <option value="diesel">Diesel</option>
          <option value="petrol">Petrol</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>

        <select className="border rounded p-2"
          value={form.status} onChange={e => setForm(s => ({ ...s, status: e.target.value }))}>
          <option value="available">Available</option>
          <option value="in_service">In Service</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <input className="border rounded p-2" type="number" min="0" placeholder="Odometer (km)"
          value={form.odometerKm} onChange={e => setForm(s => ({ ...s, odometerKm: e.target.value }))} />
        <input className="border rounded p-2" type="date"
          value={form.lastServiceAt} onChange={e => setForm(s => ({ ...s, lastServiceAt: e.target.value }))} />

        <input className="border rounded p-2" type="number" step="any" placeholder="Lat"
          value={form.lat} onChange={e => setForm(s => ({ ...s, lat: e.target.value }))} />
        <input className="border rounded p-2" type="number" step="any" placeholder="Lng"
          value={form.lng} onChange={e => setForm(s => ({ ...s, lng: e.target.value }))} />
      </div>

      <div className="mt-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingTruck ? 'Update Truck' : 'Create Truck'}
        </button>
        {editingTruck && (
          <button type="button" className="ml-2 px-4 py-2 rounded border" onClick={() => setEditingTruck(null)}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
