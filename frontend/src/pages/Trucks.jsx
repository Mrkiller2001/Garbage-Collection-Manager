import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import TruckForm from '../components/TruckForm';
import TruckList from '../components/TruckList';

export default function TrucksPage() {
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [editingTruck, setEditingTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const headers = { Authorization: `Bearer ${user.token}` };

  const load = useCallback(async () => {
    try {
      setErr('');
      setLoading(true);
      const { data } = await axiosInstance.get('/api/trucks', { headers });
      setTrucks(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to load trucks');
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Trucks</h1>
        <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
      </div>

      <TruckForm
        trucks={trucks}
        setTrucks={setTrucks}
        editingTruck={editingTruck}
        setEditingTruck={setEditingTruck}
      />

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="text-red-600 mb-3">Error: {err}</div>}

      {!loading && (
        <TruckList
          trucks={trucks}
          setTrucks={setTrucks}
          setEditingTruck={setEditingTruck}
        />
      )}
    </div>
  );
}
