import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

export default function RoutePlanForm({ onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    depotLat: '',
    depotLng: '',
    threshold: 80,
    maxStops: ''
  });
  const [saving, setSaving] = useState(false);

  const change = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        depot: { lat: Number(form.depotLat), lng: Number(form.depotLng) },
        threshold: Number(form.threshold),
        maxStops: form.maxStops === '' ? undefined : Number(form.maxStops)
      };
      const { data } = await axiosInstance.post('/api/routes', body, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      onCreated?.(data);
      // keep depot coords; clear caps
      setForm(prev => ({ ...prev, maxStops: '' }));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to create route');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-semibold mb-3">Generate New Route</h2>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="number" step="any" required className="border rounded p-2"
          placeholder="Depot Latitude"
          value={form.depotLat}
          onChange={(e) => change('depotLat', e.target.value)}
        />
        <input
          type="number" step="any" required className="border rounded p-2"
          placeholder="Depot Longitude"
          value={form.depotLng}
          onChange={(e) => change('depotLng', e.target.value)}
        />
        <input
          type="number" min="0" max="100" className="border rounded p-2"
          placeholder="Fill% Threshold (default 80)"
          value={form.threshold}
          onChange={(e) => change('threshold', e.target.value)}
        />
        <input
          type="number" min="1" className="border rounded p-2"
          placeholder="Max Stops (optional)"
          value={form.maxStops}
          onChange={(e) => change('maxStops', e.target.value)}
        />
        <div className="md:col-span-4">
          <button
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Generating…' : 'Generate Route'}
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Creates a route for bins with status <span className="font-medium">needs_pickup</span> or fill ≥ threshold.
      </p>
    </div>
  );
}
